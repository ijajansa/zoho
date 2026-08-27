<?php

namespace App\Http\Requests\Module;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ReorderModulesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'modules' => ['required', 'array', 'min:1'],
            'modules.*.id' => ['required', 'integer', 'distinct'],
            'modules.*.sort_order' => ['required', 'integer', 'min:0'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            $application = $this->route('application');
            $ids = collect($this->input('modules', []))->pluck('id');

            if (! $application || $application->modules()->whereKey($ids)->count() !== $ids->count()) {
                $validator->errors()->add('modules', 'Every module must belong to the selected application.');
            }
        }];
    }
}
