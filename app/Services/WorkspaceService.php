<?php

namespace App\Services;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Str;

class WorkspaceService
{
    public function create(User $owner, array $data): Workspace
    {
        return $owner->workspaces()->create([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['name']),
            'description' => $data['description'] ?? null,
            'status' => 'active',
        ]);
    }

    public function update(Workspace $workspace, array $data): Workspace
    {
        $workspace->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
        ]);

        return $workspace->refresh();
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'workspace';
        $slug = $base;
        $suffix = 2;

        while (Workspace::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
