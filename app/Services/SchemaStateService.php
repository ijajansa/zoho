<?php

namespace App\Services;

use App\Models\Module;

class SchemaStateService
{
    public function __construct(private readonly FieldSchemaMapper $mapper) {}

    public function refresh(Module $module): string
    {
        $module->refresh();
        if ($module->schema_version === 0) {
            $status = 'draft';
        } else {
            $activeChanged = $module->fields()->get()->contains(fn ($field) => ! $field->is_published || $field->published_definition != $this->mapper->definition($field));
            $archivePending = $module->schemaFields()->where('is_archived', true)->where('is_published', true)->get()
                ->contains(fn ($field) => ! ($field->published_definition['archived'] ?? false));
            $status = $activeChanged || $archivePending ? 'out_of_sync' : 'published';
        }

        $module->update(['schema_status' => $status]);

        return $status;
    }
}
