<?php

namespace App\Http\Requests\ModuleField;

use App\Services\FieldTypeRegistry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateModuleFieldRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'label' => ['required', 'string', 'max:100'],
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
            'field_type' => ['prohibited'],
            'database_type' => ['prohibited'],
            'sort_order' => ['prohibited'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            $field = $this->route('field');
            if (! $field) {
                return;
            }

            foreach (app(FieldTypeRegistry::class)->configurationErrors([...$this->all(), 'field_type' => $field->field_type]) as $error) {
                $validator->errors()->add('field_type', $error);
            }
        }];
    }
}
