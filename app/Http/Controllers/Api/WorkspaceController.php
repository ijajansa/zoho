<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Workspace\StoreWorkspaceRequest;
use App\Http\Requests\Workspace\UpdateWorkspaceRequest;
use App\Http\Resources\WorkspaceResource;
use App\Models\Workspace;
use App\Services\WorkspaceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class WorkspaceController extends Controller
{
    public function __construct(private readonly WorkspaceService $workspaceService) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Workspace::class);

        $workspaces = $request->user()->workspaces()
            ->with('owner')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => ['workspaces' => WorkspaceResource::collection($workspaces)],
        ]);
    }

    public function store(StoreWorkspaceRequest $request): JsonResponse
    {
        Gate::authorize('create', Workspace::class);
        $workspace = $this->workspaceService->create($request->user(), $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Workspace created successfully',
            'data' => ['workspace' => new WorkspaceResource($workspace->load('owner'))],
        ], 201);
    }

    public function show(Workspace $workspace): JsonResponse
    {
        Gate::authorize('view', $workspace);

        return response()->json([
            'success' => true,
            'data' => ['workspace' => new WorkspaceResource($workspace->load('owner'))],
        ]);
    }

    public function update(UpdateWorkspaceRequest $request, Workspace $workspace): JsonResponse
    {
        Gate::authorize('update', $workspace);
        $workspace = $this->workspaceService->update($workspace, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Workspace updated successfully',
            'data' => ['workspace' => new WorkspaceResource($workspace->load('owner'))],
        ]);
    }

    public function destroy(Workspace $workspace): JsonResponse
    {
        Gate::authorize('delete', $workspace);
        $hasPhysicalSchema = $workspace->applications()->with('modules')->get()->pluck('modules')->flatten()->contains(fn ($module) => preg_match('/^app_[0-9]+_[a-z0-9_]+$/', $module->table_name) && Schema::hasTable($module->table_name));
        if ($hasPhysicalSchema || $workspace->applications()->whereHas('modules', fn ($query) => $query->where(fn ($schemaQuery) => $schemaQuery->where('schema_version', '>', 0)->orWhereIn('schema_status', ['published', 'out_of_sync', 'syncing', 'error'])))->exists()) {
            throw ValidationException::withMessages(['workspace' => 'This workspace contains published modules and cannot be deleted yet.']);
        }
        $workspace->delete();

        return response()->json([
            'success' => true,
            'message' => 'Workspace deleted successfully',
        ]);
    }
}
