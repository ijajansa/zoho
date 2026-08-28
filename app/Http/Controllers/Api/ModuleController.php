<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Module\ReorderModulesRequest;
use App\Http\Requests\Module\StoreModuleRequest;
use App\Http\Requests\Module\UpdateModuleRequest;
use App\Http\Resources\ModuleResource;
use App\Models\Application;
use App\Models\Module;
use App\Models\Workspace;
use App\Services\ModuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class ModuleController extends Controller
{
    public function __construct(private readonly ModuleService $moduleService) {}

    public function index(Workspace $workspace, Application $application): JsonResponse
    {
        $this->authorizeParents($workspace, $application);
        $modules = $application->modules()->withCount('fields')->orderBy('sort_order')->orderBy('id')->get();

        return response()->json([
            'success' => true,
            'data' => ['modules' => ModuleResource::collection($modules)],
        ]);
    }

    public function store(StoreModuleRequest $request, Workspace $workspace, Application $application): JsonResponse
    {
        $this->authorizeParents($workspace, $application);
        $module = $this->moduleService->create($workspace, $application, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Module created successfully',
            'data' => ['module' => new ModuleResource($module->loadCount('fields'))],
        ], 201);
    }

    public function show(Workspace $workspace, Application $application, Module $module): JsonResponse
    {
        $this->authorizeParents($workspace, $application);
        $this->authorizeModule($application, $module, 'view');

        return response()->json([
            'success' => true,
            'data' => ['module' => new ModuleResource($module->loadCount('fields'))],
        ]);
    }

    public function update(UpdateModuleRequest $request, Workspace $workspace, Application $application, Module $module): JsonResponse
    {
        $this->authorizeParents($workspace, $application);
        $this->authorizeModule($application, $module, 'update');
        $module = $this->moduleService->update($module, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Module updated successfully',
            'data' => ['module' => new ModuleResource($module->loadCount('fields'))],
        ]);
    }

    public function destroy(Workspace $workspace, Application $application, Module $module): JsonResponse
    {
        $this->authorizeParents($workspace, $application);
        $this->authorizeModule($application, $module, 'delete');
        $hasPhysicalSchema = preg_match('/^app_[0-9]+_[a-z0-9_]+$/', $module->table_name) && Schema::hasTable($module->table_name);
        if ($hasPhysicalSchema || $module->schema_version > 0 || in_array($module->schema_status, ['published', 'out_of_sync', 'syncing', 'error'], true)) {
            throw ValidationException::withMessages(['module' => 'This module has a published physical schema and cannot be deleted yet.']);
        }
        $module->delete();

        return response()->json([
            'success' => true,
            'message' => 'Module deleted successfully',
        ]);
    }

    public function reorder(ReorderModulesRequest $request, Workspace $workspace, Application $application): JsonResponse
    {
        $this->authorizeParents($workspace, $application);
        $this->moduleService->reorder($application, $request->validated('modules'));
        $modules = $application->modules()->withCount('fields')->orderBy('sort_order')->orderBy('id')->get();

        return response()->json([
            'success' => true,
            'message' => 'Module order updated successfully',
            'data' => ['modules' => ModuleResource::collection($modules)],
        ]);
    }

    private function authorizeParents(Workspace $workspace, Application $application): void
    {
        Gate::authorize('view', $workspace);
        abort_unless($application->workspace_id === $workspace->id, 404);
        Gate::authorize('view', $application);
    }

    private function authorizeModule(Application $application, Module $module, string $ability): void
    {
        abort_unless($module->application_id === $application->id, 404);
        Gate::authorize($ability, $module);
    }
}
