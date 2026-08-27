<?php

namespace App\Http\Requests\ModuleField;

use Illuminate\Foundation\Http\FormRequest;

class ReorderModuleFieldsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'fields' => ['required', 'array', 'min:1'],
            'fields.*.id' => ['required', 'integer', 'distinct'],
            'fields.*.sort_order' => ['required', 'integer', 'min:0'],
        ];
    }
}
