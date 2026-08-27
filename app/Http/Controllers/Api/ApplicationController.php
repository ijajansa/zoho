<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Application\StoreApplicationRequest;
use App\Http\Requests\Application\UpdateApplicationRequest;
use App\Http\Resources\ApplicationResource;
use App\Models\Application;
use App\Models\Workspace;
use App\Services\ApplicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class ApplicationController extends Controller
{
    public function __construct(private readonly ApplicationService $applicationService) {}

    public function index(Workspace $workspace): JsonResponse
    {
        Gate::authorize('view', $workspace);
        $applications = $workspace->applications()->latest()->paginate(12);

        return response()->json([
            'success' => true,
            'data' => [
                'applications' => ApplicationResource::collection($applications->getCollection()),
                'pagination' => [
                    'current_page' => $applications->currentPage(),
                    'last_page' => $applications->lastPage(),
                    'per_page' => $applications->perPage(),
                    'total' => $applications->total(),
                ],
            ],
        ]);
    }

    public function store(StoreApplicationRequest $request, Workspace $workspace): JsonResponse
    {
        Gate::authorize('view', $workspace);
        $application = $this->applicationService->create($workspace, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Application created successfully',
            'data' => ['application' => new ApplicationResource($application)],
        ], 201);
    }

    public function show(Workspace $workspace, Application $application): JsonResponse
    {
        Gate::authorize('view', $workspace);
        $this->ensureApplicationBelongsToWorkspace($workspace, $application);
        Gate::authorize('view', $application);

        return response()->json([
            'success' => true,
            'data' => ['application' => new ApplicationResource($application)],
        ]);
    }

    public function update(UpdateApplicationRequest $request, Workspace $workspace, Application $application): JsonResponse
    {
        Gate::authorize('view', $workspace);
        $this->ensureApplicationBelongsToWorkspace($workspace, $application);
        Gate::authorize('update', $application);
        $application = $this->applicationService->update($application, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Application updated successfully',
            'data' => ['application' => new ApplicationResource($application)],
        ]);
    }

    public function destroy(Workspace $workspace, Application $application): JsonResponse
    {
        Gate::authorize('view', $workspace);
        $this->ensureApplicationBelongsToWorkspace($workspace, $application);
        Gate::authorize('delete', $application);
        $application->delete();

        return response()->json([
            'success' => true,
            'message' => 'Application deleted successfully',
        ]);
    }

    private function ensureApplicationBelongsToWorkspace(Workspace $workspace, Application $application): void
    {
        abort_unless($application->workspace_id === $workspace->id, 404);
    }
}
