<?php

namespace App\Services;

use App\Models\Module;
use App\Models\ModuleField;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DynamicRecordService
{
    private const SEARCHABLE = ['text', 'email', 'phone', 'select', 'radio', 'url'];

    private const FILTERABLE = ['select', 'radio', 'checkbox', 'toggle', 'date'];

    private const PAGE_SIZES = [10, 20, 50, 100];

    public function __construct(private readonly DynamicValidationService $validation) {}

    public function assertAvailable(Module $module): void
    {
        if ($module->status !== 'active' || $module->schema_status !== 'published') {
            throw ValidationException::withMessages(['module' => 'The module schema must be published before records can be managed.']);
        }
        if (! preg_match('/^app_[0-9]+_[a-z0-9_]+$/', $module->table_name) || ! Schema::hasTable($module->table_name)) {
            report(new \RuntimeException("Published module {$module->id} is missing its physical table."));
            throw ValidationException::withMessages(['module' => 'This module is temporarily unavailable because its data storage could not be found.']);
        }
    }

    public function metadata(Module $module): array
    {
        $this->assertAvailable($module);
        $fields = $this->runtimeFields($module);
        $listFields = $this->listFields($module, $fields);
        $displayField = $this->displayField($module, $fields);
        $view = $this->viewSettings($module);

        return [
            'module' => [
                'id' => $module->id, 'name' => $module->name,
                'singular_name' => $module->singular_name ?: Str::singular($module->name),
                'slug' => $module->slug, 'icon' => $module->icon,
                'display_field' => $displayField?->name,
            ],
            'fields' => $fields->map(fn (ModuleField $field) => $this->fieldMetadata($field))->values(),
            'list_fields' => $listFields->map(fn (ModuleField $field) => $this->fieldMetadata($field))->values(),
            'filters' => $fields->whereIn('field_type', self::FILTERABLE)->map(fn (ModuleField $field) => $this->fieldMetadata($field))->values(),
            'list_view' => [
                'default_sort_field' => $view['default_sort_field'],
                'default_sort_direction' => $view['default_sort_direction'],
                'records_per_page' => $view['records_per_page'],
            ],
        ];
    }

    public function index(Module $module, array $params): array
    {
        $this->assertAvailable($module);
        $fields = $this->runtimeFields($module);
        $listFields = $this->listFields($module, $fields);
        $view = $this->viewSettings($module);
        $select = collect(['id'])->merge($listFields->pluck('name'))->merge(['created_at', 'updated_at'])->unique()->all();
        $query = DB::table($module->table_name)->select($select);

        $search = trim((string) ($params['search'] ?? ''));
        $searchFields = $fields->whereIn('field_type', self::SEARCHABLE);
        if ($search !== '' && $searchFields->isNotEmpty()) {
            $query->where(function (Builder $nested) use ($searchFields, $search): void {
                foreach ($searchFields as $index => $field) {
                    $method = $index === 0 ? 'where' : 'orWhere';
                    $nested->{$method}($field->name, 'like', '%'.$search.'%');
                }
            });
        }
        $this->applyFilters($query, $fields, is_array($params['filters'] ?? null) ? $params['filters'] : []);

        $allowedSorts = $listFields->pluck('name')->push('created_at')->push('updated_at');
        $sort = (string) ($params['sort'] ?? $view['default_sort_field'] ?? 'created_at');
        if (! $allowedSorts->contains($sort)) {
            throw ValidationException::withMessages(['sort' => 'The selected sort field is not available in this list.']);
        }
        $direction = strtolower((string) ($params['direction'] ?? $view['default_sort_direction'] ?? 'desc'));
        if (! in_array($direction, ['asc', 'desc'], true)) {
            throw ValidationException::withMessages(['direction' => 'Sort direction must be asc or desc.']);
        }
        $requestedSize = (int) ($params['per_page'] ?? $view['records_per_page']);
        $perPage = in_array($requestedSize, self::PAGE_SIZES, true) ? $requestedSize : $view['records_per_page'];
        $paginator = $query->orderBy($sort, $direction)->orderBy('id', 'desc')->paginate($perPage);

        return $this->pagination($paginator, $listFields);
    }

    public function find(Module $module, int $recordId): array
    {
        $this->assertAvailable($module);
        $fields = $this->runtimeFields($module);
        $record = DB::table($module->table_name)->where('id', $recordId)->first();
        abort_if($record === null, 404, 'Record not found.');

        return $this->transform($record, $fields);
    }

    public function create(Module $module, array $input): array
    {
        $this->assertAvailable($module);
        $validated = $this->validation->validate($module, $input);
        $fields = $this->runtimeFields($module)->keyBy('name');
        $values = $this->storageValues($validated, $fields);
        foreach ($module->fields()->where('status', 'active')->where('is_readonly', true)->where('is_hidden', false)->get() as $field) {
            if ($field->default_value !== null) {
                $values[$field->name] = $this->normalizeValue($field, $field->default_value);
            }
        }
        $now = now();
        $id = DB::table($module->table_name)->insertGetId([...$values, 'created_at' => $now, 'updated_at' => $now]);

        return $this->find($module, $id);
    }

    public function update(Module $module, int $recordId, array $input): array
    {
        $this->assertAvailable($module);
        abort_unless(DB::table($module->table_name)->where('id', $recordId)->exists(), 404, 'Record not found.');
        $validated = $this->validation->validate($module, $input, $recordId);
        $fields = $this->runtimeFields($module)->keyBy('name');
        $values = $this->storageValues($validated, $fields, true);
        DB::table($module->table_name)->where('id', $recordId)->update([...$values, 'updated_at' => now()]);

        return $this->find($module, $recordId);
    }

    public function delete(Module $module, int $recordId): void
    {
        $this->assertAvailable($module);
        abort_unless(DB::table($module->table_name)->where('id', $recordId)->delete() === 1, 404, 'Record not found.');
    }

    public function count(Module $module): int
    {
        $this->assertAvailable($module);

        return DB::table($module->table_name)->count();
    }

    private function runtimeFields(Module $module): Collection
    {
        return $module->fields()->where('status', 'active')->where('is_hidden', false)->get();
    }

    private function listFields(Module $module, Collection $fields): Collection
    {
        $configured = collect($module->listView?->columns ?? [])->where('visible', true)->sortBy('sort_order')->pluck('field_id');
        if ($configured->isNotEmpty()) {
            return $configured->map(fn ($id) => $fields->firstWhere('id', (int) $id))->filter(fn ($field) => $field && $field->field_type !== 'password')->values();
        }
        $preferred = $fields->reject(fn ($field) => in_array($field->field_type, ['password', 'textarea'], true))->take(5);

        return ($preferred->isNotEmpty() ? $preferred : $fields->where('field_type', '!=', 'password')->take(5))->values();
    }

    private function displayField(Module $module, Collection $fields): ?ModuleField
    {
        return $fields->firstWhere('id', $module->display_field_id)
            ?? $fields->first(fn ($field) => in_array($field->field_type, ['text', 'email', 'phone'], true))
            ?? $fields->first(fn ($field) => $field->field_type !== 'password');
    }

    private function viewSettings(Module $module): array
    {
        return [
            'default_sort_field' => $module->listView?->default_sort_field ?: 'created_at',
            'default_sort_direction' => $module->listView?->default_sort_direction ?: 'desc',
            'records_per_page' => in_array($module->listView?->records_per_page, self::PAGE_SIZES, true) ? $module->listView->records_per_page : 20,
        ];
    }

    private function fieldMetadata(ModuleField $field): array
    {
        return [
            'id' => $field->id, 'name' => $field->name, 'label' => $field->label,
            'field_type' => $field->field_type, 'placeholder' => $field->placeholder,
            'help_text' => $field->help_text, 'default_value' => $field->default_value,
            'is_required' => $field->is_required, 'is_readonly' => $field->is_readonly,
            'options' => $field->options ?? [], 'settings' => $field->settings ?? [],
            'sort_order' => $field->sort_order, 'width' => $field->width,
        ];
    }

    private function applyFilters(Builder $query, Collection $fields, array $filters): void
    {
        foreach ($filters as $name => $value) {
            $field = $fields->firstWhere('name', $name);
            if (! $field || ! in_array($field->field_type, self::FILTERABLE, true) || $value === '' || $value === null) {
                continue;
            }
            if (in_array($field->field_type, ['select', 'radio'], true)) {
                $allowed = collect($field->options ?? [])->pluck('value');
                if (! $allowed->contains((string) $value)) {
                    throw ValidationException::withMessages(["filters.{$name}" => 'The selected filter value is invalid.']);
                }
                $query->where($field->name, $value);
            } elseif (in_array($field->field_type, ['checkbox', 'toggle'], true)) {
                if (! in_array((string) $value, ['0', '1'], true)) {
                    throw ValidationException::withMessages(["filters.{$name}" => 'The selected boolean filter is invalid.']);
                }
                $query->where($field->name, (int) $value);
            } elseif (is_array($value)) {
                foreach (['from', 'to'] as $bound) {
                    if (! empty($value[$bound]) && ! \DateTimeImmutable::createFromFormat('Y-m-d', $value[$bound])) {
                        throw ValidationException::withMessages(["filters.{$name}.{$bound}" => 'Enter a valid filter date.']);
                    }
                }
                if (! empty($value['from'])) {
                    $query->whereDate($field->name, '>=', $value['from']);
                }
                if (! empty($value['to'])) {
                    $query->whereDate($field->name, '<=', $value['to']);
                }
            }
        }
    }

    private function storageValues(array $validated, Collection $fields, bool $updating = false): array
    {
        $values = [];
        foreach ($validated as $name => $value) {
            $field = $fields->get($name);
            if (! $field) {
                continue;
            }
            if ($field->field_type === 'password') {
                if ($updating && ($value === null || $value === '')) {
                    continue;
                }
                $values[$name] = Hash::make($value);
            } else {
                $values[$name] = $this->normalizeValue($field, $value);
            }
        }

        return $values;
    }

    private function normalizeValue(ModuleField $field, mixed $value): mixed
    {
        if ($value === null || $value === '') {
            return $value === '' && ! $field->is_required ? null : $value;
        }
        if (in_array($field->field_type, ['checkbox', 'toggle'], true)) {
            return (bool) $value;
        }

        return $value;
    }

    private function transform(object $record, Collection $fields): array
    {
        $data = ['id' => $record->id];
        foreach ($fields as $field) {
            if ($field->field_type !== 'password' && property_exists($record, $field->name)) {
                $data[$field->name] = $record->{$field->name};
            }
        }
        $data['created_at'] = $record->created_at ?? null;
        $data['updated_at'] = $record->updated_at ?? null;

        return $data;
    }

    private function pagination(LengthAwarePaginator $paginator, Collection $fields): array
    {
        return [
            'records' => collect($paginator->items())->map(fn ($record) => $this->transform($record, $fields))->values(),
            'pagination' => ['current_page' => $paginator->currentPage(), 'last_page' => $paginator->lastPage(), 'per_page' => $paginator->perPage(), 'total' => $paginator->total(), 'from' => $paginator->firstItem(), 'to' => $paginator->lastItem()],
        ];
    }
}
