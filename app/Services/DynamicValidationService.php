<?php

namespace App\Services;

use App\Models\Module;
use App\Models\ModuleField;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class DynamicValidationService
{
    public function validate(Module $module, array $input, ?int $recordId = null): array
    {
        $fields = $module->fields()->where('status', 'active')->get();
        $writable = $fields->reject(fn (ModuleField $field) => $field->is_hidden || $field->is_readonly)->keyBy('name');
        $unknown = collect(array_keys($input))->reject(fn (string $key) => $writable->has($key));
        if ($unknown->isNotEmpty()) {
            throw ValidationException::withMessages($unknown->mapWithKeys(
                fn (string $key) => [$key => 'This field cannot be submitted.']
            )->all());
        }

        $rules = [];
        foreach ($writable as $field) {
            $required = $field->is_required && ! ($recordId !== null && $field->field_type === 'password');
            $fieldRules = [$required ? 'required' : 'nullable'];
            $fieldRules = [...$fieldRules, ...$this->typeRules($field)];
            $rules[$field->name] = $fieldRules;
        }

        $validated = Validator::make($input, $rules, [], $writable->mapWithKeys(fn ($field) => [$field->name => $field->label])->all())->validate();
        $errors = [];
        foreach ($writable->where('is_unique', true) as $field) {
            $value = $validated[$field->name] ?? null;
            if ($value === null || $value === '') {
                continue;
            }
            $query = DB::table($module->table_name)->where($field->name, $value);
            if ($recordId !== null) {
                $query->where('id', '!=', $recordId);
            }
            if ($query->exists()) {
                $errors[$field->name] = "The {$field->label} has already been taken.";
            }
        }
        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        return $validated;
    }

    private function typeRules(ModuleField $field): array
    {
        $configured = $field->validation_rules ?? [];
        $rules = match ($field->field_type) {
            'text', 'phone', 'password' => ['string', 'max:255'],
            'textarea' => ['string'],
            'email' => ['string', 'email', 'max:255'],
            'url' => ['string', 'url', 'max:255'],
            'number' => ['integer'],
            'decimal', 'currency', 'percentage' => ['numeric'],
            'date' => ['date_format:Y-m-d'],
            'time' => ['date_format:H:i'],
            'datetime' => ['date'],
            'select', 'radio' => ['string', Rule::in(collect($field->options ?? [])->pluck('value')->all())],
            'checkbox', 'toggle' => ['boolean'],
            default => [],
        };

        if (in_array($field->field_type, ['text', 'textarea', 'phone', 'password'], true)) {
            if (isset($configured['min_length'])) {
                $rules[] = 'min:'.(int) $configured['min_length'];
            }
            if (isset($configured['max_length'])) {
                $rules[] = 'max:'.(int) $configured['max_length'];
            }
        }
        if (in_array($field->field_type, ['number', 'decimal', 'currency', 'percentage'], true)) {
            if (isset($configured['min'])) {
                $rules[] = 'min:'.(float) $configured['min'];
            }
            if (isset($configured['max'])) {
                $rules[] = 'max:'.(float) $configured['max'];
            }
        }

        return $rules;
    }
}
