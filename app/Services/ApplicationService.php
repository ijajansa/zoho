<?php

namespace App\Services;

use App\Models\Application;
use App\Models\Workspace;
use Illuminate\Support\Str;

class ApplicationService
{
    public function create(Workspace $workspace, array $data): Application
    {
        return $workspace->applications()->create([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($workspace, $data['name']),
            'description' => $data['description'] ?? null,
            'icon' => $data['icon'] ?? 'app',
            'status' => $data['status'] ?? 'active',
        ]);
    }

    public function update(Application $application, array $data): Application
    {
        $application->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'icon' => $data['icon'] ?? null,
            'status' => $data['status'],
        ]);

        return $application->refresh();
    }

    private function uniqueSlug(Workspace $workspace, string $name): string
    {
        $base = Str::slug($name) ?: 'application';
        $slug = $base;
        $suffix = 2;

        while ($workspace->applications()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
