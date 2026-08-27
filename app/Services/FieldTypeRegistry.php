<?php

namespace App\Services;

use Illuminate\Support\Arr;

class FieldTypeRegistry
{
    private const TYPES = [
        'text' => ['label' => 'Text', 'category' => 'Basic', 'icon' => 'type', 'database_type' => 'string', 'supports_placeholder' => true, 'supports_default' => true, 'supports_required' => true, 'supports_unique' => true, 'supports_options' => false, 'validation_rules' => ['min_length', 'max_length']],
        'textarea' => ['label' => 'Textarea', 'category' => 'Basic', 'icon' => 'align-left', 'database_type' => 'text', 'supports_placeholder' => true, 'supports_default' => true, 'supports_required' => true, 'supports_unique' => false, 'supports_options' => false, 'validation_rules' => ['min_length', 'max_length', 'rows']],
        'number' => ['label' => 'Number', 'category' => 'Basic', 'icon' => 'hash', 'database_type' => 'integer', 'supports_placeholder' => true, 'supports_default' => true, 'supports_required' => true, 'supports_unique' => true, 'supports_options' => false, 'validation_rules' => ['min', 'max']],
        'decimal' => ['label' => 'Decimal', 'category' => 'Basic', 'icon' => 'binary', 'database_type' => 'decimal', 'supports_placeholder' => true, 'supports_default' => true, 'supports_required' => true, 'supports_unique' => true, 'supports_options' => false, 'validation_rules' => ['min', 'max', 'decimal_places']],
        'email' => ['label' => 'Email', 'category' => 'Contact', 'icon' => 'mail', 'database_type' => 'string', 'supports_placeholder' => true, 'supports_default' => true, 'supports_required' => true, 'supports_unique' => true, 'supports_options' => false, 'validation_rules' => []],
        'phone' => ['label' => 'Phone', 'category' => 'Contact', 'icon' => 'phone', 'database_type' => 'string', 'supports_placeholder' => true, 'supports_default' => true, 'supports_required' => true, 'supports_unique' => true, 'supports_options' => false, 'validation_rules' => ['min_length', 'max_length']],
        'url' => ['label' => 'URL', 'category' => 'Contact', 'icon' => 'link', 'database_type' => 'string', 'supports_placeholder' => true, 'supports_default' => true, 'supports_required' => true, 'supports_unique' => true, 'supports_options' => false, 'validation_rules' => []],
        'password' => ['label' => 'Password', 'category' => 'Contact', 'icon' => 'key-round', 'database_type' => 'string', 'supports_placeholder' => true, 'supports_default' => false, 'supports_required' => true, 'supports_unique' => false, 'supports_options' => false, 'validation_rules' => ['min_length', 'max_length']],
        'date' => ['label' => 'Date', 'category' => 'Date & Time', 'icon' => 'calendar', 'database_type' => 'date', 'supports_placeholder' => false, 'supports_default' => true, 'supports_required' => true, 'supports_unique' => false, 'supports_options' => false, 'validation_rules' => []],
        'time' => ['label' => 'Time', 'category' => 'Date & Time', 'icon' => 'clock', 'database_type' => 'time', 'supports_placeholder' => false, 'supports_default' => true, 'supports_required' => true, 'supports_unique' => false, 'supports_options' => false, 'validation_rules' => []],
        'datetime' => ['label' => 'Date & Time', 'category' => 'Date & Time', 'icon' => 'calendar-clock', 'database_type' => 'datetime', 'supports_placeholder' => false, 'supports_default' => true, 'supports_required' => true, 'supports_unique' => false, 'supports_options' => false, 'validation_rules' => []],
        'select' => ['label' => 'Dropdown', 'category' => 'Choice', 'icon' => 'list-filter', 'database_type' => 'string', 'supports_placeholder' => true, 'supports_default' => true, 'supports_required' => true, 'supports_unique' => false, 'supports_options' => true, 'validation_rules' => []],
        'radio' => ['label' => 'Radio', 'category' => 'Choice', 'icon' => 'circle-dot', 'database_type' => 'string', 'supports_placeholder' => false, 'supports_default' => true, 'supports_required' => true, 'supports_unique' => false, 'supports_options' => true, 'validation_rules' => []],
        'checkbox' => ['label' => 'Checkbox', 'category' => 'Choice', 'icon' => 'square-check', 'database_type' => 'boolean', 'supports_placeholder' => false, 'supports_default' => true, 'supports_required' => false, 'supports_unique' => false, 'supports_options' => false, 'validation_rules' => []],
        'toggle' => ['label' => 'Toggle', 'category' => 'Choice', 'icon' => 'toggle-right', 'database_type' => 'boolean', 'supports_placeholder' => false, 'supports_default' => true, 'supports_required' => false, 'supports_unique' => false, 'supports_options' => false, 'validation_rules' => []],
        'currency' => ['label' => 'Currency', 'category' => 'Financial', 'icon' => 'circle-dollar-sign', 'database_type' => 'decimal', 'supports_placeholder' => true, 'supports_default' => true, 'supports_required' => true, 'supports_unique' => false, 'supports_options' => false, 'validation_rules' => ['min', 'max', 'decimal_places']],
        'percentage' => ['label' => 'Percentage', 'category' => 'Financial', 'icon' => 'percent', 'database_type' => 'decimal', 'supports_placeholder' => true, 'supports_default' => true, 'supports_required' => true, 'supports_unique' => false, 'supports_options' => false, 'validation_rules' => ['min', 'max']],
    ];

    public function all(): array
    {
        return collect(self::TYPES)->map(fn (array $definition, string $type) => ['type' => $type, ...$definition])->values()->all();
    }

    public function types(): array
    {
        return array_keys(self::TYPES);
    }

    public function has(string $type): bool
    {
        return isset(self::TYPES[$type]);
    }

    public function get(string $type): array
    {
        abort_unless($this->has($type), 422, 'Unsupported field type.');

        return self::TYPES[$type];
    }

    public function databaseType(string $type): string
    {
        return $this->get($type)['database_type'];
    }

    public function configurationErrors(array $payload): array
    {
        $type = (string) ($payload['field_type'] ?? '');
        if (! $this->has($type)) {
            return ['Unsupported field type.'];
        }

        $definition = $this->get($type);
        $errors = [];
        $rules = array_filter($payload['validation_rules'] ?? [], fn ($value) => $value !== null && $value !== '');
        $unknownRules = array_diff(array_keys($rules), $definition['validation_rules']);
        if ($unknownRules !== []) {
            $errors[] = 'Unsupported validation rule for this field type: '.implode(', ', $unknownRules).'.';
        }

        foreach (Arr::only($rules, ['min', 'max']) as $key => $value) {
            if (! is_numeric($value)) {
                $errors[] = "The {$key} validation value must be numeric.";
            }
        }

        foreach (Arr::only($rules, ['min_length', 'max_length']) as $key => $value) {
            if (filter_var($value, FILTER_VALIDATE_INT) === false || (int) $value < 0 || (int) $value > 65535) {
                $errors[] = "The {$key} validation value must be an integer between 0 and 65535.";
            }
        }

        if (isset($rules['decimal_places']) && (filter_var($rules['decimal_places'], FILTER_VALIDATE_INT) === false || (int) $rules['decimal_places'] < 0 || (int) $rules['decimal_places'] > 8)) {
            $errors[] = 'Decimal places must be an integer between 0 and 8.';
        }

        if (isset($rules['rows']) && (filter_var($rules['rows'], FILTER_VALIDATE_INT) === false || (int) $rules['rows'] < 2 || (int) $rules['rows'] > 20)) {
            $errors[] = 'Textarea rows must be an integer between 2 and 20.';
        }

        if (isset($rules['min'], $rules['max']) && is_numeric($rules['min']) && is_numeric($rules['max']) && (float) $rules['min'] > (float) $rules['max']) {
            $errors[] = 'The minimum value may not be greater than the maximum value.';
        }

        $options = $payload['options'] ?? [];
        if ($definition['supports_options'] && (! is_array($options) || count($options) === 0)) {
            $errors[] = 'Dropdown and radio fields require at least one option.';
        }

        return $errors;
    }
}
