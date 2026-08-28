<?php

namespace App\Services;

use App\Models\Module;
use App\Models\ModuleField;
use Illuminate\Cache\Lock;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Throwable;

class DynamicSchemaService
{
    private const BASE_COLUMNS = ['id', 'created_at', 'updated_at'];

    public function __construct(
        private readonly FieldTypeRegistry $registry,
        private readonly FieldSchemaMapper $mapper,
        private readonly SchemaDiffService $diffService,
    ) {}

    public function status(Module $module): array
    {
        $this->validateTableName($module);
        $diff = $this->diffService->diff($module);
        $changes = $this->diffService->publicChanges($diff);
        $lastFailure = $module->schemaChanges()->where('status', 'failed')->latest('id')->first();

        return [
            'schema_status' => $module->schema_status,
            'schema_version' => $module->schema_version,
            'schema_published_at' => $module->schema_published_at?->toISOString(),
            'physical_table_exists' => $diff['table_exists'],
            'pending_changes' => count($changes),
            'changes' => $changes,
            'last_error' => $module->schema_status === 'error' ? $lastFailure?->error_message : null,
        ];
    }

    public function publish(Module $module): array
    {
        /** @var Lock $lock */
        $lock = Cache::lock("module-schema:{$module->id}", 30);
        if (! $lock->get()) {
            throw ValidationException::withMessages(['schema' => 'Schema synchronization is already in progress.']);
        }

        try {
            return $this->publishLocked($module->fresh());
        } finally {
            $lock->release();
        }
    }

    public function structuralDefinition(ModuleField $field): array
    {
        return $this->mapper->definition($field);
    }

    private function publishLocked(Module $module): array
    {
        $logs = collect();

        try {
            $this->validateModule($module);
            $diff = $this->diffService->diff($module);
            if ($diff['errors'] !== []) {
                throw ValidationException::withMessages(['schema' => $diff['errors']]);
            }

            $publicChanges = $this->diffService->publicChanges($diff);
            if (! $diff['has_physical_changes']) {
                $this->completeArchiveOnlyChanges($module, $diff['archive_fields']);
                $module->update(['schema_status' => $module->schema_version > 0 ? 'published' : 'draft']);

                return [
                    'schema_status' => $module->fresh()->schema_status,
                    'schema_version' => $module->schema_version,
                    'schema_published_at' => $module->schema_published_at?->toISOString(),
                    'changes' => $publicChanges,
                ];
            }

            $targetVersion = $module->schema_version + 1;
            $module->update(['schema_status' => 'syncing']);
            $logs = $this->createPendingLogs($module, $diff, $targetVersion);

            if ($diff['create_table']) {
                $this->createTable($module, $diff['active_fields']);
            } else {
                foreach ($diff['add_fields'] as $field) {
                    $this->addColumn($module, $field);
                }
                foreach ($diff['modify_fields'] as $field) {
                    $this->modifyColumn($module, $field);
                }
            }

            $publishedAt = now();
            foreach ($module->fields()->get() as $field) {
                if (Schema::hasColumn($module->table_name, $field->name)) {
                    $field->update([
                        'is_published' => true,
                        'published_at' => $field->published_at ?? $publishedAt,
                        'schema_version' => $targetVersion,
                        'published_definition' => $this->mapper->definition($field),
                    ]);
                }
            }
            $this->completeArchiveOnlyChanges($module, $diff['archive_fields'], $targetVersion);
            $logs->each->update(['status' => 'completed']);
            $module->update([
                'schema_status' => 'published',
                'schema_version' => $targetVersion,
                'schema_published_at' => $publishedAt,
            ]);

            Log::info('Dynamic module schema synchronized.', [
                'application_id' => $module->application_id,
                'module_id' => $module->id,
                'schema_version' => $targetVersion,
                'changes' => $logs->pluck('change_type')->all(),
            ]);

            return [
                'schema_status' => 'published',
                'schema_version' => $targetVersion,
                'schema_published_at' => $publishedAt->toISOString(),
                'changes' => $publicChanges,
            ];
        } catch (Throwable $exception) {
            $safeMessage = $exception instanceof ValidationException
                ? collect($exception->errors())->flatten()->first()
                : 'Unable to apply the requested physical schema changes.';
            $module->update(['schema_status' => 'error']);
            $logs->each->update(['status' => 'failed', 'error_message' => $safeMessage]);
            if ($logs->isEmpty()) {
                $module->schemaChanges()->create([
                    'schema_version' => $module->schema_version + 1,
                    'change_type' => Schema::hasTable($module->table_name) ? 'modify_column' : 'create_table',
                    'payload' => ['operation' => 'validation'],
                    'status' => 'failed',
                    'error_message' => $safeMessage,
                ]);
            }
            Log::error('Dynamic module schema synchronization failed.', [
                'application_id' => $module->application_id,
                'module_id' => $module->id,
                'schema_version' => $module->schema_version,
                'exception' => $exception,
            ]);

            throw ValidationException::withMessages(['schema' => $safeMessage]);
        }
    }

    private function validateModule(Module $module): void
    {
        $this->validateTableName($module);
        if ($module->schema_version === 0 && Schema::hasTable($module->table_name)) {
            throw ValidationException::withMessages(['schema' => 'A physical table already exists for this module identifier and cannot be adopted automatically.']);
        }
        $names = [];
        foreach ($module->fields()->get() as $field) {
            if (! preg_match('/^[a-z0-9_]+$/', $field->name) || strlen($field->name) > 64 || in_array($field->name, self::BASE_COLUMNS, true)) {
                throw ValidationException::withMessages(['schema' => "Field {$field->label} has an unsafe physical column name."]);
            }
            if (in_array($field->name, $names, true)) {
                throw ValidationException::withMessages(['schema' => "Duplicate physical column name: {$field->name}."]);
            }
            if (! $this->registry->has($field->field_type) || $this->registry->databaseType($field->field_type) !== $field->database_type) {
                throw ValidationException::withMessages(['schema' => "Field {$field->label} has unsupported or inconsistent type metadata."]);
            }
            foreach ($this->registry->configurationErrors($field->toArray()) as $error) {
                throw ValidationException::withMessages(['schema' => $error]);
            }
            $this->mapper->normalizedDefault($field);
            $names[] = $field->name;
        }
    }

    private function validateTableName(Module $module): void
    {
        $prefix = 'app_'.$module->application_id.'_';
        if (strlen($module->table_name) > 64 || ! str_starts_with($module->table_name, $prefix) || ! preg_match('/^app_[0-9]+_[a-z0-9_]+$/', $module->table_name)) {
            throw ValidationException::withMessages(['schema' => 'The module has an invalid physical table identifier.']);
        }
    }

    private function createPendingLogs(Module $module, array $diff, int $version)
    {
        if ($diff['create_table']) {
            return collect([$module->schemaChanges()->create([
                'schema_version' => $version,
                'change_type' => 'create_table',
                'payload' => ['table' => $module->table_name, 'fields' => $diff['active_fields']->map(fn ($field) => $this->mapper->definition($field))->values()->all()],
                'status' => 'pending',
            ])]);
        }

        return $diff['add_fields']->map(fn ($field) => $module->schemaChanges()->create([
            'schema_version' => $version,
            'change_type' => 'add_column',
            'field_id' => $field->id,
            'payload' => $this->mapper->definition($field),
            'status' => 'pending',
        ]))->merge($diff['modify_fields']->map(fn ($field) => $module->schemaChanges()->create([
            'schema_version' => $version,
            'change_type' => 'modify_column',
            'field_id' => $field->id,
            'payload' => ['before' => $field->published_definition, 'after' => $this->mapper->definition($field)],
            'status' => 'pending',
        ])));
    }

    private function createTable(Module $module, $fields): void
    {
        if (Schema::hasTable($module->table_name)) {
            throw ValidationException::withMessages(['schema' => 'A physical table already exists for this identifier.']);
        }

        Schema::create($module->table_name, function (Blueprint $table) use ($module, $fields): void {
            $table->id();
            foreach ($fields as $field) {
                $this->mapper->addColumn($table, $field);
                if ($field->is_unique) {
                    $table->unique($field->name, $this->mapper->uniqueIndexName($module->id, $field->id));
                }
            }
            $table->timestamps();
        });
    }

    private function addColumn(Module $module, ModuleField $field): void
    {
        if (Schema::hasColumn($module->table_name, $field->name)) {
            return;
        }
        if ($field->is_required && $field->default_value === null && DB::table($module->table_name)->exists()) {
            throw ValidationException::withMessages(['schema' => "Cannot add required field {$field->label} without a default value to a table containing existing records."]);
        }

        Schema::table($module->table_name, function (Blueprint $table) use ($field): void {
            $this->mapper->addColumn($table, $field);
        });
        if ($field->is_unique) {
            Schema::table($module->table_name, fn (Blueprint $table) => $table->unique($field->name, $this->mapper->uniqueIndexName($module->id, $field->id)));
        }
    }

    private function modifyColumn(Module $module, ModuleField $field): void
    {
        $before = $field->published_definition ?? [];
        $after = $this->mapper->definition($field);
        if (($before['nullable'] ?? true) && ! $after['nullable'] && DB::table($module->table_name)->whereNull($field->name)->exists()) {
            throw ValidationException::withMessages(['schema' => "Unable to make {$field->label} required because existing records contain null values."]);
        }
        if (! ($before['unique'] ?? false) && $after['unique'] && $this->hasDuplicateValues($module->table_name, $field->name)) {
            throw ValidationException::withMessages(['schema' => "Unable to make {$field->label} unique because duplicate values exist."]);
        }

        if (($before['nullable'] ?? null) !== $after['nullable'] || ($before['default'] ?? null) !== $after['default']) {
            Schema::table($module->table_name, function (Blueprint $table) use ($field): void {
                $this->mapper->addColumn($table, $field, true);
            });
        }

        $indexName = $this->mapper->uniqueIndexName($module->id, $field->id);
        $hasIndex = $this->indexExists($module->table_name, $indexName);
        if ($after['unique'] && ! $hasIndex) {
            Schema::table($module->table_name, fn (Blueprint $table) => $table->unique($field->name, $indexName));
        } elseif (! $after['unique'] && $hasIndex) {
            Schema::table($module->table_name, fn (Blueprint $table) => $table->dropUnique($indexName));
        }
    }

    private function hasDuplicateValues(string $table, string $column): bool
    {
        return DB::table($table)->select($column)->whereNotNull($column)->groupBy($column)->havingRaw('COUNT(*) > 1')->exists();
    }

    private function indexExists(string $table, string $indexName): bool
    {
        return collect(Schema::getIndexes($table))->contains(fn (array $index) => ($index['name'] ?? null) === $indexName);
    }

    private function completeArchiveOnlyChanges(Module $module, $fields, ?int $version = null): void
    {
        foreach ($fields as $field) {
            $definition = $field->published_definition ?? $this->mapper->definition($field);
            $field->update(['published_definition' => [...$definition, 'archived' => true]]);
            $module->schemaChanges()->create([
                'schema_version' => $version ?? $module->schema_version,
                'change_type' => 'drop_column',
                'field_id' => $field->id,
                'payload' => ['field' => $field->name, 'action' => 'column_preserved'],
                'status' => 'blocked',
                'error_message' => 'Physical column retained to prevent destructive data loss.',
            ]);
        }
    }
}
