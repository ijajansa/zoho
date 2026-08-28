<?php

namespace App\Services;

use App\Models\Module;
use App\Models\ModuleField;
use Illuminate\Validation\ValidationException;

class ModuleListViewService
{
    public function show(Module $module): array
    {
        $fields = $module->fields()->where('status', 'active')->where('is_hidden', false)->where('field_type', '!=', 'password')->get();
        $view = $module->listView;
        $configured = collect($view?->columns ?? []);
        $columns = $fields->map(function (ModuleField $field) use ($configured): array {
            $item = $configured->firstWhere('field_id', $field->id);

            return ['field_id' => $field->id, 'label' => $field->label, 'name' => $field->name, 'field_type' => $field->field_type, 'visible' => $item ? (bool) $item['visible'] : null, 'sort_order' => $item['sort_order'] ?? $field->sort_order];
        });
        if (! $view) {
            $preferredIds = $fields->whereNotIn('field_type', ['textarea'])->take(5)->pluck('id');
            if ($preferredIds->isEmpty()) {
                $preferredIds = $fields->take(5)->pluck('id');
            }
            $columns = $columns->map(fn ($item) => [...$item, 'visible' => $preferredIds->contains($item['field_id'])]);
        }

        return [
            'columns' => $columns->sortBy(fn ($item) => $item['visible'] ? $item['sort_order'] : 100000 + $item['sort_order'])->values(),
            'default_sort_field' => $view?->default_sort_field ?: 'created_at',
            'default_sort_direction' => $view?->default_sort_direction ?: 'desc',
            'records_per_page' => $view?->records_per_page ?: 20,
        ];
    }

    public function save(Module $module, array $data): array
    {
        $columns = collect($data['columns'] ?? []);
        if ($columns->pluck('field_id')->duplicates()->isNotEmpty()) {
            throw ValidationException::withMessages(['columns' => 'Each list field may only be selected once.']);
        }
        $validFields = $module->fields()->where('status', 'active')->where('is_hidden', false)->where('field_type', '!=', 'password')->whereKey($columns->pluck('field_id'))->get()->keyBy('id');
        if ($validFields->count() !== $columns->count()) {
            throw ValidationException::withMessages(['columns' => 'Every list column must be a visible field from this module.']);
        }
        if ($columns->where('visible', true)->isEmpty()) {
            throw ValidationException::withMessages(['columns' => 'Select at least one visible list column.']);
        }
        $sort = $data['default_sort_field'] ?? 'created_at';
        $visibleIds = $columns->where('visible', true)->pluck('field_id')->map(fn ($id) => (int) $id);
        $allowedSorts = $validFields->whereIn('id', $visibleIds)->pluck('name')->push('created_at')->push('updated_at');
        if (! $allowedSorts->contains($sort)) {
            throw ValidationException::withMessages(['default_sort_field' => 'The default sort field must belong to this module.']);
        }
        if (! in_array($data['default_sort_direction'] ?? 'desc', ['asc', 'desc'], true)) {
            throw ValidationException::withMessages(['default_sort_direction' => 'The default sort direction is invalid.']);
        }
        if (! in_array((int) ($data['records_per_page'] ?? 20), [10, 20, 50, 100], true)) {
            throw ValidationException::withMessages(['records_per_page' => 'Rows per page must be 10, 20, 50, or 100.']);
        }
        $module->listView()->updateOrCreate([], [
            'name' => 'Default',
            'columns' => $columns->values()->map(fn ($item, $index) => ['field_id' => (int) $item['field_id'], 'visible' => (bool) ($item['visible'] ?? false), 'sort_order' => $index + 1])->all(),
            'default_sort_field' => $sort,
            'default_sort_direction' => $data['default_sort_direction'] ?? 'desc',
            'records_per_page' => (int) ($data['records_per_page'] ?? 20),
        ]);

        return $this->show($module->refresh());
    }
}
