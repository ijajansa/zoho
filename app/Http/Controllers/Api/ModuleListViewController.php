<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Module;
use App\Models\Workspace;
use App\Services\ModuleListViewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ModuleListViewController extends Controller
{
    public function __construct(private readonly ModuleListViewService $listViews) {}

    public function show(Workspace $workspace, Application $application, Module $module): JsonResponse
    {
        $this->authorizeParents($workspace, $application, $module);

        return response()->json(['success' => true, 'data' => ['list_view' => $this->listViews->show($module)]]);
    }

    public function update(Request $request, Workspace $workspace, Application $application, Module $module): JsonResponse
    {
        $this->authorizeParents($workspace, $application, $module);
        $data = $request->validate([
            'columns' => ['required', 'array'], 'columns.*.field_id' => ['required', 'integer'],
            'columns.*.visible' => ['required', 'boolean'], 'columns.*.sort_order' => ['nullable', 'integer'],
            'default_sort_field' => ['required', 'string', 'max:64'],
            'default_sort_direction' => ['required', 'string'], 'records_per_page' => ['required', 'integer'],
        ]);

        return response()->json(['success' => true, 'message' => 'List view saved successfully.', 'data' => ['list_view' => $this->listViews->save($module, $data)]]);
    }

    private function authorizeParents(Workspace $workspace, Application $application, Module $module): void
    {
        Gate::authorize('view', $workspace);
        abort_unless($application->workspace_id === $workspace->id, 404);
        Gate::authorize('view', $application);
        abort_unless($module->application_id === $application->id, 404);
        Gate::authorize('view', $module);
    }
}
