<?php

namespace App\Services;

use App\Models\Module;
use App\Models\ModuleField;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ModuleFieldService
{
    private const MAX_NAME_LENGTH = 64;

    private const RESERVED_NAMES = [
        'id', 'created_at', 'updated_at', 'deleted_at', 'user_id', 'workspace_id',
        'application_id', 'module_id', 'owner_id', 'status', 'sort_order',
    ];

    public function __construct(
        private readonly FieldTypeRegistry $registry,
        private readonly SchemaStateService $schemaState,
    ) {}

    public function create(Module $module, array $data, ?int $sortOrder = null): ModuleField
    {
        $field = $module->fields()->create($this->createAttributes(
            $module,
            $data,
            $sortOrder ?? (((int) $module->fields()->max('sort_order')) + 1),
        ));
        $this->schemaState->refresh($module);

        return $field;
    }

    public function update(ModuleField $field, array $data, ?int $sortOrder = null): ModuleField
    {
        $field->update($this->updateAttributes($field, $data, $sortOrder));
        $this->schemaState->refresh($field->module);

        return $field->refresh();
    }

    public function remove(ModuleField $field): void
    {
        $module = $field->module;
        if ($field->is_published) {
            $field->update(['is_archived' => true, 'status' => 'inactive']);
        } else {
            $field->delete();
        }
        $this->schemaState->refresh($module);
    }

    public function reorder(Module $module, array $fields): array
    {
        $ids = collect($fields)->pluck('id');
        if ($module->fields()->whereKey($ids)->count() !== $ids->count()) {
            throw ValidationException::withMessages([
                'fields' => 'Every field must belong to the selected module.',
            ]);
        }

        DB::transaction(function () use ($module, $fields): void {
            foreach ($fields as $item) {
                $module->fields()->whereKey($item['id'])->update(['sort_order' => $item['sort_order']]);
            }
        });

        return $module->fields()->orderBy('sort_order')->orderBy('id')->get()->all();
    }

    public function createAttributes(Module $module, array $data, int $sortOrder): array
    {
        $type = $data['field_type'];

        return [
            'name' => $this->uniqueName($module, $data['label']),
            'label' => trim($data['label']),
            'field_type' => $type,
            'database_type' => $this->registry->databaseType($type),
            ...$this->configurationAttributes($type, $data),
            'sort_order' => $sortOrder,
        ];
    }

    public function updateAttributes(ModuleField $field, array $data, ?int $sortOrder = null): array
    {
        return [
            'label' => trim($data['label']),
            ...$this->configurationAttributes($field->field_type, $data),
            'sort_order' => $sortOrder ?? $field->sort_order,
        ];
    }

    private function configurationAttributes(string $type, array $data): array
    {
        $definition = $this->registry->get($type);

        return [
            'placeholder' => $definition['supports_placeholder'] ? ($data['placeholder'] ?? null) : null,
            'help_text' => $data['help_text'] ?? null,
            'default_value' => $definition['supports_default'] ? $this->normalizeDefault($data['default_value'] ?? null) : null,
            'is_required' => $definition['supports_required'] && (bool) ($data['is_required'] ?? false),
            'is_unique' => $definition['supports_unique'] && (bool) ($data['is_unique'] ?? false),
            'is_readonly' => (bool) ($data['is_readonly'] ?? false),
            'is_hidden' => (bool) ($data['is_hidden'] ?? false),
            'validation_rules' => $this->normalizeValidationRules($definition, $data['validation_rules'] ?? []),
            'options' => $definition['supports_options'] ? $this->normalizeOptions($data['options'] ?? []) : null,
            'settings' => is_array($data['settings'] ?? null) ? $data['settings'] : null,
            'width' => (int) ($data['width'] ?? 12),
            'status' => $data['status'] ?? 'active',
        ];
    }

    private function uniqueName(Module $module, string $label): string
    {
        $base = Str::of(Str::ascii($label))->lower()->replaceMatches('/[^a-z0-9]+/', '_')->trim('_')->value();
        $base = $base ?: 'field';
        if (in_array($base, self::RESERVED_NAMES, true)) {
            $base = 'field_'.$base;
        }

        $base = substr($base, 0, self::MAX_NAME_LENGTH);
        $name = $base;
        $suffix = 2;

        while (ModuleField::query()->where('module_id', $module->id)->where('name', $name)->exists()) {
            $ending = '_'.$suffix;
            $name = substr($base, 0, self::MAX_NAME_LENGTH - strlen($ending)).$ending;
            $suffix++;
        }

        return $name;
    }

    private function normalizeOptions(array $options): array
    {
        $used = [];

        return collect($options)->map(function (array $option) use (&$used): array {
            $label = trim($option['label']);
            $base = Str::of(Str::ascii($option['value'] ?? $label))->lower()->replaceMatches('/[^a-z0-9]+/', '_')->trim('_')->value() ?: 'option';
            $value = $base;
            $suffix = 2;
            while (in_array($value, $used, true)) {
                $value = $base.'_'.$suffix;
                $suffix++;
            }
            $used[] = $value;

            return ['label' => $label, 'value' => $value];
        })->values()->all();
    }

    private function normalizeValidationRules(array $definition, array $rules): ?array
    {
        $normalized = collect(Arr::only($rules, $definition['validation_rules']))
            ->reject(fn ($value) => $value === null || $value === '')
            ->map(fn ($value, $key) => in_array($key, ['min_length', 'max_length', 'decimal_places', 'rows'], true) ? (int) $value : (float) $value)
            ->all();

        return $normalized === [] ? null : $normalized;
    }

    private function normalizeDefault(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        return is_scalar($value) ? (string) $value : null;
    }
}
