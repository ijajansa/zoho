<?php

namespace App\Http\Requests\ModuleField;

use App\Services\FieldTypeRegistry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreModuleFieldRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'label' => ['required', 'string', 'max:100'],
            'field_type' => ['required', 'string', Rule::in(app(FieldTypeRegistry::class)->types())],
            'placeholder' => ['nullable', 'string', 'max:255'],
            'help_text' => ['nullable', 'string', 'max:2000'],
            'default_value' => ['nullable'],
            'is_required' => ['sometimes', 'boolean'],
            'is_unique' => ['sometimes', 'boolean'],
            'is_readonly' => ['sometimes', 'boolean'],
            'is_hidden' => ['sometimes', 'boolean'],
            'validation_rules' => ['nullable', 'array'],
            'options' => ['nullable', 'array'],
            'options.*.label' => ['required', 'string', 'max:100'],
            'options.*.value' => ['nullable', 'string', 'max:100'],
            'settings' => ['nullable', 'array'],
            'width' => ['sometimes', 'integer', Rule::in([12, 6, 4, 3])],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
            'module_id' => ['prohibited'],
            'name' => ['prohibited'],
            'database_type' => ['prohibited'],
            'sort_order' => ['prohibited'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            foreach (app(FieldTypeRegistry::class)->configurationErrors($this->all()) as $error) {
                $validator->errors()->add('field_type', $error);
            }
        }];
    }
}
