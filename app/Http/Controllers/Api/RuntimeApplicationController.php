<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Services\DynamicRecordService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class RuntimeApplicationController extends Controller
{
    public function __construct(private readonly DynamicRecordService $records) {}

    public function show(Application $application): JsonResponse
    {
        Gate::authorize('view', $application);
        abort_if($application->status !== 'active', 404, 'Application is inactive.');
        $modules = $application->modules()->where('status', 'active')->where('schema_status', 'published')->orderBy('sort_order')->orderBy('id')->get()
            ->filter(fn ($module) => preg_match('/^app_[0-9]+_[a-z0-9_]+$/', $module->table_name) && Schema::hasTable($module->table_name))
            ->map(fn ($module) => [
                'id' => $module->id, 'name' => $module->name,
                'singular_name' => $module->singular_name ?: Str::singular($module->name),
                'slug' => $module->slug, 'icon' => $module->icon,
                'sort_order' => $module->sort_order, 'record_count' => $this->records->count($module),
            ])->values();

        return response()->json(['success' => true, 'data' => [
            'application' => ['id' => $application->id, 'name' => $application->name, 'icon' => $application->icon, 'workspace_id' => $application->workspace_id],
            'modules' => $modules,
        ]]);
    }
}
