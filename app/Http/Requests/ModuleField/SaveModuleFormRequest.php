<?php

namespace App\Http\Requests\ModuleField;

use App\Services\FieldTypeRegistry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SaveModuleFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'fields' => ['present', 'array'],
            'fields.*.id' => ['nullable', 'integer', 'distinct'],
            'fields.*.client_id' => ['nullable', 'string', 'max:100', 'distinct'],
            'fields.*.label' => ['required', 'string', 'max:100'],
            'fields.*.field_type' => ['required', 'string', Rule::in(app(FieldTypeRegistry::class)->types())],
            'fields.*.placeholder' => ['nullable', 'string', 'max:255'],
            'fields.*.help_text' => ['nullable', 'string', 'max:2000'],
            'fields.*.default_value' => ['nullable'],
            'fields.*.is_required' => ['sometimes', 'boolean'],
            'fields.*.is_unique' => ['sometimes', 'boolean'],
            'fields.*.is_readonly' => ['sometimes', 'boolean'],
            'fields.*.is_hidden' => ['sometimes', 'boolean'],
            'fields.*.validation_rules' => ['nullable', 'array'],
            'fields.*.options' => ['nullable', 'array'],
            'fields.*.options.*.label' => ['required', 'string', 'max:100'],
            'fields.*.options.*.value' => ['nullable', 'string', 'max:100'],
            'fields.*.settings' => ['nullable', 'array'],
            'fields.*.sort_order' => ['required', 'integer', 'min:0'],
            'fields.*.width' => ['required', 'integer', Rule::in([12, 6, 4, 3])],
            'fields.*.status' => ['sometimes', Rule::in(['active', 'inactive'])],
            'fields.*.module_id' => ['prohibited'],
            'fields.*.name' => ['prohibited'],
            'fields.*.database_type' => ['prohibited'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            foreach ($this->input('fields', []) as $index => $field) {
                foreach (app(FieldTypeRegistry::class)->configurationErrors($field) as $error) {
                    $validator->errors()->add("fields.{$index}.field_type", $error);
                }
            }
        }];
    }
}
