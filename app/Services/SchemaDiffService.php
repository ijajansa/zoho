<?php

namespace App\Services;

use App\Models\Module;
use Illuminate\Support\Facades\Schema;

class SchemaDiffService
{
    public function __construct(private readonly FieldSchemaMapper $mapper) {}

    public function diff(Module $module): array
    {
        $tableExists = Schema::hasTable($module->table_name);
        $columns = $tableExists ? Schema::getColumnListing($module->table_name) : [];
        $columnDetails = $tableExists ? collect(Schema::getColumns($module->table_name))->keyBy('name') : collect();
        $activeFields = $module->fields()->get();
        $archivedFields = $module->schemaFields()->where('is_archived', true)->where('is_published', true)->get()
            ->filter(fn ($field) => ! ($field->published_definition['archived'] ?? false));
        $addFields = collect();
        $modifyFields = collect();
        $errors = [];

        foreach ($activeFields as $field) {
            if (! $tableExists || ! in_array($field->name, $columns, true)) {
                if ($field->is_published && $tableExists) {
                    $errors[] = "Published column {$field->name} is missing from the physical table.";
                } else {
                    $addFields->push($field);
                }

                continue;
            }

            if ($field->is_published && $field->published_definition != $this->mapper->definition($field)) {
                $modifyFields->push($field);
            }
            if ($field->is_published && ! $this->mapper->matchesPhysicalType($field, (string) ($columnDetails->get($field->name)['type_name'] ?? ''))) {
                $errors[] = "Published column {$field->name} has an unexpected physical type.";
            }
        }

        return [
            'table_exists' => $tableExists,
            'create_table' => ! $tableExists,
            'active_fields' => $activeFields,
            'add_fields' => $addFields,
            'modify_fields' => $modifyFields,
            'archive_fields' => $archivedFields,
            'errors' => $errors,
            'has_physical_changes' => ! $tableExists || $addFields->isNotEmpty() || $modifyFields->isNotEmpty(),
        ];
    }

    public function publicChanges(array $diff): array
    {
        if ($diff['create_table']) {
            return [['type' => 'create_table', 'label' => 'Create physical table', 'fields' => $diff['active_fields']->pluck('name')->values()->all()]];
        }

        return collect()
            ->merge($diff['add_fields']->map(fn ($field) => ['type' => 'add_column', 'field' => $field->name, 'label' => $field->label]))
            ->merge($diff['modify_fields']->map(fn ($field) => ['type' => 'modify_column', 'field' => $field->name, 'label' => $field->label]))
            ->merge($diff['archive_fields']->map(fn ($field) => ['type' => 'archive_only', 'field' => $field->name, 'label' => $field->label]))
            ->values()->all();
    }
}
