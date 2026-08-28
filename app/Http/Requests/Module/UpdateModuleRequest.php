<?php

namespace App\Http\Requests\Module;

use App\Models\ModuleField;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateModuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'singular_name' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
            'icon' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
            'display_field_id' => ['nullable', 'integer'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            $fieldId = $this->input('display_field_id');
            if ($fieldId === null) {
                return;
            }
            $valid = ModuleField::query()->whereKey($fieldId)
                ->where('module_id', $this->route('module')->id)
                ->where('status', 'active')->where('is_archived', false)
                ->where('is_hidden', false)->where('field_type', '!=', 'password')->exists();
            if (! $valid) {
                $validator->errors()->add('display_field_id', 'Select a suitable display field from this module.');
            }
        }];
    }
}
