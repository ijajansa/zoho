<?php

namespace App\Services;

use App\Models\ModuleField;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use Throwable;

class FieldSchemaMapper
{
    public function definition(ModuleField $field): array
    {
        return [
            'name' => $field->name,
            'field_type' => $field->field_type,
            'nullable' => ! $field->is_required,
            'default' => $this->normalizedDefault($field),
            'unique' => (bool) $field->is_unique,
        ];
    }

    public function addColumn(Blueprint $table, ModuleField $field, bool $change = false): void
    {
        $column = match ($field->field_type) {
            'text', 'email', 'phone', 'password', 'select', 'radio', 'url' => $table->string($field->name, 255),
            'textarea' => $table->text($field->name),
            'number' => $table->integer($field->name),
            'decimal' => $table->decimal($field->name, 15, 4),
            'currency' => $table->decimal($field->name, 15, 2),
            'percentage' => $table->decimal($field->name, 7, 4),
            'date' => $table->date($field->name),
            'time' => $table->time($field->name),
            'datetime' => $table->dateTime($field->name),
            'checkbox', 'toggle' => $table->boolean($field->name),
            default => throw ValidationException::withMessages(['schema' => "Unsupported field type: {$field->field_type}."]),
        };

        $column->nullable(! $field->is_required);
        $default = $this->normalizedDefault($field);
        if ($default !== null || $change) {
            $column->default($default);
        }
        if ($change) {
            $column->change();
        }
    }

    public function uniqueIndexName(int $moduleId, int $fieldId): string
    {
        return "uq_m{$moduleId}_f{$fieldId}";
    }

    public function matchesPhysicalType(ModuleField $field, string $nativeType): bool
    {
        $allowed = match ($field->field_type) {
            'text', 'email', 'phone', 'password', 'select', 'radio', 'url' => ['varchar', 'string'],
            'textarea' => ['text'],
            'number' => ['int', 'integer'],
            'decimal', 'currency', 'percentage' => ['decimal', 'numeric'],
            'date' => ['date'],
            'time' => ['time'],
            'datetime' => ['datetime'],
            'checkbox', 'toggle' => ['tinyint', 'boolean'],
            default => [],
        };

        return in_array(strtolower($nativeType), $allowed, true);
    }

    public function normalizedDefault(ModuleField $field): string|int|float|bool|null
    {
        $value = $field->default_value;
        if ($value === null || $value === '') {
            return null;
        }
        if (! is_scalar($value) || preg_match('/\b(now|current_user|current_timestamp|drop\s+table)\s*\(?/i', (string) $value)) {
            throw ValidationException::withMessages(['schema' => "The default for {$field->label} is not a supported literal value."]);
        }

        if (in_array($field->field_type, ['number'], true)) {
            if (filter_var($value, FILTER_VALIDATE_INT) === false) {
                throw ValidationException::withMessages(['schema' => "The default for {$field->label} must be an integer."]);
            }

            return (int) $value;
        }
        if (in_array($field->field_type, ['decimal', 'currency', 'percentage'], true)) {
            if (! is_numeric($value)) {
                throw ValidationException::withMessages(['schema' => "The default for {$field->label} must be numeric."]);
            }

            return (float) $value;
        }
        if (in_array($field->field_type, ['checkbox', 'toggle'], true)) {
            if (! in_array((string) $value, ['0', '1'], true)) {
                throw ValidationException::withMessages(['schema' => "The default for {$field->label} must be 0 or 1."]);
            }

            return (bool) $value;
        }
        if ($field->field_type === 'textarea') {
            throw ValidationException::withMessages(['schema' => "Database defaults are not supported for textarea field {$field->label}."]);
        }
        if (in_array($field->field_type, ['date', 'time', 'datetime'], true)) {
            $format = match ($field->field_type) {
                'date' => 'Y-m-d',
                'time' => 'H:i:s',
                default => 'Y-m-d H:i:s',
            };
            try {
                $parsed = Carbon::createFromFormat($format, (string) $value);
            } catch (Throwable) {
                $parsed = null;
            }
            if (! $parsed || $parsed->format($format) !== (string) $value) {
                throw ValidationException::withMessages(['schema' => "The default for {$field->label} has an invalid format."]);
            }
        }

        return (string) $value;
    }
}
