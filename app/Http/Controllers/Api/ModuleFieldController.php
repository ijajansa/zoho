<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ModuleField\ReorderModuleFieldsRequest;
use App\Http\Requests\ModuleField\SaveModuleFormRequest;
use App\Http\Requests\ModuleField\StoreModuleFieldRequest;
use App\Http\Requests\ModuleField\UpdateModuleFieldRequest;
use App\Http\Resources\ModuleFieldResource;
use App\Models\Application;
use App\Models\Module;
use App\Models\ModuleField;
use App\Models\Workspace;
use App\Services\FormBuilderService;
use App\Services\ModuleFieldService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class ModuleFieldController extends Controller
{
    public function __construct(
        private readonly ModuleFieldService $fieldService,
        private readonly FormBuilderService $formBuilderService,
    ) {}

    public function index(Workspace $workspace, Application $application, Module $module): JsonResponse
    {
        $this->authorizeParents($workspace, $application, $module);

        return response()->json([
            'success' => true,
            'data' => ['fields' => ModuleFieldResource::collection($module->fields()->get())],
        ]);
    }

    public function store(StoreModuleFieldRequest $request, Workspace $workspace, Application $application, Module $module): JsonResponse
    {
        $this->authorizeParents($workspace, $application, $module);
        $field = $this->fieldService->create($module, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Field created successfully',
            'data' => ['field' => new ModuleFieldResource($field)],
        ], 201);
    }

    public function show(Workspace $workspace, Application $application, Module $module, ModuleField $field): JsonResponse
    {
        $this->authorizeParents($workspace, $application, $module);
        $this->authorizeField($module, $field, 'view');

        return response()->json([
            'success' => true,
            'data' => ['field' => new ModuleFieldResource($field)],
        ]);
    }

    public function update(UpdateModuleFieldRequest $request, Workspace $workspace, Application $application, Module $module, ModuleField $field): JsonResponse
    {
        $this->authorizeParents($workspace, $application, $module);
        $this->authorizeField($module, $field, 'update');
        $field = $this->fieldService->update($field, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Field updated successfully',
            'data' => ['field' => new ModuleFieldResource($field)],
        ]);
    }

    public function destroy(Workspace $workspace, Application $application, Module $module, ModuleField $field): JsonResponse
    {
        $this->authorizeParents($workspace, $application, $module);
        $this->authorizeField($module, $field, 'delete');
        $this->fieldService->remove($field);

        return response()->json([
            'success' => true,
            'message' => 'Field deleted successfully',
        ]);
    }

    public function reorder(ReorderModuleFieldsRequest $request, Workspace $workspace, Application $application, Module $module): JsonResponse
    {
        $this->authorizeParents($workspace, $application, $module);
        $fields = $this->fieldService->reorder($module, $request->validated('fields'));

        return response()->json([
            'success' => true,
            'message' => 'Field order updated successfully',
            'data' => ['fields' => ModuleFieldResource::collection($fields)],
        ]);
    }

    public function saveForm(SaveModuleFormRequest $request, Workspace $workspace, Application $application, Module $module): JsonResponse
    {
        $this->authorizeParents($workspace, $application, $module);
        $fields = $this->formBuilderService->save($module, $request->validated('fields'));

        return response()->json([
            'success' => true,
            'message' => 'Form saved successfully',
            'data' => ['fields' => ModuleFieldResource::collection($fields)],
        ]);
    }

    private function authorizeParents(Workspace $workspace, Application $application, Module $module): void
    {
        Gate::authorize('view', $workspace);
        abort_unless($application->workspace_id === $workspace->id, 404);
        Gate::authorize('view', $application);
        abort_unless($module->application_id === $application->id, 404);
        Gate::authorize('view', $module);
    }

    private function authorizeField(Module $module, ModuleField $field, string $ability): void
    {
        abort_unless($field->module_id === $module->id, 404);
        abort_if($field->is_archived, 404);
        Gate::authorize($ability, $field);
    }
}
