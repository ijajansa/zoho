<?php

namespace App\Services;

use App\Models\Application;
use App\Models\Module;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ModuleService
{
    private const MAX_TABLE_NAME_LENGTH = 64;

    public function canCreateModule(Workspace $workspace, Application $application): bool
    {
        return $application->workspace_id === $workspace->id;
    }

    public function create(Workspace $workspace, Application $application, array $data): Module
    {
        abort_unless($this->canCreateModule($workspace, $application), 403);

        return $application->modules()->create([
            'name' => $data['name'],
            'singular_name' => $data['singular_name'] ?? Str::singular($data['name']),
            'slug' => $this->uniqueSlug($application, $data['name']),
            'table_name' => $this->uniqueTableName($application, $data['name']),
            'description' => $data['description'] ?? null,
            'icon' => $data['icon'] ?? 'database',
            'status' => $data['status'] ?? 'active',
            'is_system' => false,
            'sort_order' => ((int) $application->modules()->max('sort_order')) + 1,
        ]);
    }

    public function update(Module $module, array $data): Module
    {
        $module->update([
            'name' => $data['name'],
            'singular_name' => $data['singular_name'] ?? Str::singular($data['name']),
            'description' => $data['description'] ?? null,
            'icon' => $data['icon'] ?? null,
            'status' => $data['status'] ?? 'active',
            'display_field_id' => array_key_exists('display_field_id', $data) ? $data['display_field_id'] : $module->display_field_id,
        ]);

        return $module->refresh();
    }

    public function reorder(Application $application, array $modules): void
    {
        DB::transaction(function () use ($application, $modules): void {
            foreach ($modules as $item) {
                $application->modules()->whereKey($item['id'])->update([
                    'sort_order' => $item['sort_order'],
                ]);
            }
        });
    }

    private function uniqueSlug(Application $application, string $name): string
    {
        $base = Str::slug($name) ?: 'module';
        $slug = $base;
        $suffix = 2;

        while ($application->modules()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }

    private function uniqueTableName(Application $application, string $name): string
    {
        $safeName = Str::of(Str::ascii($name))
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', '_')
            ->trim('_')
            ->value();
        $safeName = $safeName ?: 'module';
        $prefix = 'app_'.$application->id.'_';
        $base = $prefix.substr($safeName, 0, self::MAX_TABLE_NAME_LENGTH - strlen($prefix));
        $tableName = rtrim($base, '_');
        $suffix = 2;

        while (Module::query()->where('table_name', $tableName)->exists()) {
            $ending = '_'.$suffix;
            $tableName = rtrim(substr($base, 0, self::MAX_TABLE_NAME_LENGTH - strlen($ending)), '_').$ending;
            $suffix++;
        }

        return $tableName;
    }
}
