<?php

namespace App\Services;

use App\Models\Module;
use App\Models\ModuleField;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FormBuilderService
{
    public function __construct(private readonly ModuleFieldService $fieldService) {}

    public function save(Module $module, array $submittedFields): Collection
    {
        return DB::transaction(function () use ($module, $submittedFields): Collection {
            $submittedIds = collect($submittedFields)->pluck('id')->filter()->values();
            $existingFields = $module->fields()->whereKey($submittedIds)->get()->keyBy('id');

            if ($existingFields->count() !== $submittedIds->count()) {
                throw ValidationException::withMessages([
                    'fields' => 'One or more fields do not belong to the selected module.',
                ]);
            }

            if ($submittedIds->isEmpty()) {
                $module->fields()->delete();
            } else {
                $module->fields()->whereNotIn('id', $submittedIds)->delete();
            }

            foreach ($submittedFields as $index => $payload) {
                $sortOrder = $index + 1;
                if (! empty($payload['id'])) {
                    /** @var ModuleField $field */
                    $field = $existingFields->get($payload['id']);
                    if ($payload['field_type'] !== $field->field_type) {
                        throw ValidationException::withMessages([
                            "fields.{$index}.field_type" => 'A persisted field type cannot be changed.',
                        ]);
                    }
                    $this->fieldService->update($field, $payload, $sortOrder);
                } else {
                    $this->fieldService->create($module, $payload, $sortOrder);
                }
            }

            return $module->fields()->orderBy('sort_order')->orderBy('id')->get();
        });
    }
}
