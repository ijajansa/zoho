<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Module;
use App\Models\Workspace;
use App\Services\DynamicSchemaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class ModuleSchemaController extends Controller
{
    public function __construct(private readonly DynamicSchemaService $schemaService) {}

    public function show(Workspace $workspace, Application $application, Module $module): JsonResponse
    {
        $this->authorizeModule($workspace, $application, $module);

        return response()->json(['success' => true, 'data' => $this->schemaService->status($module)]);
    }

    public function publish(Workspace $workspace, Application $application, Module $module): JsonResponse
    {
        $this->authorizeModule($workspace, $application, $module);
        $result = $this->schemaService->publish($module);

        return response()->json([
            'success' => true,
            'message' => 'Schema synchronized successfully',
            'data' => $result,
        ]);
    }

    public function history(Workspace $workspace, Application $application, Module $module): JsonResponse
    {
        $this->authorizeModule($workspace, $application, $module);
        $changes = $module->schemaChanges()->latest('id')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => [
                'changes' => $changes->getCollection()->map(fn ($change) => [
                    'id' => $change->id,
                    'schema_version' => $change->schema_version,
                    'change_type' => $change->change_type,
                    'field' => $change->payload['field'] ?? $change->payload['name'] ?? $change->payload['after']['name'] ?? null,
                    'status' => $change->status,
                    'message' => $change->error_message,
                    'created_at' => $change->created_at?->toISOString(),
                ])->values(),
                'pagination' => [
                    'current_page' => $changes->currentPage(),
                    'last_page' => $changes->lastPage(),
                    'total' => $changes->total(),
                ],
            ],
        ]);
    }

    private function authorizeModule(Workspace $workspace, Application $application, Module $module): void
    {
        Gate::authorize('view', $workspace);
        abort_unless($application->workspace_id === $workspace->id, 404);
        Gate::authorize('view', $application);
        abort_unless($module->application_id === $application->id, 404);
        Gate::authorize('update', $module);
    }
}
