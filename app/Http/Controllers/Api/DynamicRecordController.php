<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Module;
use App\Models\Workspace;
use App\Services\DynamicRecordService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class DynamicRecordController extends Controller
{
    public function __construct(private readonly DynamicRecordService $records) {}

    public function metadata(Workspace $workspace, Application $application, Module $module): JsonResponse
    {
        $this->authorizeParents($workspace, $application, $module);

        return response()->json(['success' => true, 'data' => $this->records->metadata($module)]);
    }

    public function index(Request $request, Workspace $workspace, Application $application, Module $module): JsonResponse
    {
        $this->authorizeParents($workspace, $application, $module);

        return response()->json(['success' => true, 'data' => $this->records->index($module, $request->query())]);
    }

    public function store(Request $request, Workspace $workspace, Application $application, Module $module): JsonResponse
    {
        $this->authorizeParents($workspace, $application, $module);
        $record = $this->records->create($module, $request->all());

        return response()->json(['success' => true, 'message' => 'Record created successfully.', 'data' => ['record' => $record]], 201);
    }

    public function show(Workspace $workspace, Application $application, Module $module, int $recordId): JsonResponse
    {
        $this->authorizeParents($workspace, $application, $module);

        return response()->json(['success' => true, 'data' => ['record' => $this->records->find($module, $recordId)]]);
    }

    public function update(Request $request, Workspace $workspace, Application $application, Module $module, int $recordId): JsonResponse
    {
        $this->authorizeParents($workspace, $application, $module);

        return response()->json(['success' => true, 'message' => 'Record updated successfully.', 'data' => ['record' => $this->records->update($module, $recordId, $request->all())]]);
    }

    public function destroy(Workspace $workspace, Application $application, Module $module, int $recordId): JsonResponse
    {
        $this->authorizeParents($workspace, $application, $module);
        $this->records->delete($module, $recordId);

        return response()->json(['success' => true, 'message' => 'Record deleted successfully.']);
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
