<?php

use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DynamicRecordController;
use App\Http\Controllers\Api\FieldTypeController;
use App\Http\Controllers\Api\ModuleController;
use App\Http\Controllers\Api\ModuleFieldController;
use App\Http\Controllers\Api\ModuleListViewController;
use App\Http\Controllers\Api\ModuleSchemaController;
use App\Http\Controllers\Api\RuntimeApplicationController;
use App\Http\Controllers\Api\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/field-types', FieldTypeController::class);
    Route::get('applications/{application}/runtime', [RuntimeApplicationController::class, 'show']);
    Route::apiResource('workspaces', WorkspaceController::class);
    Route::scopeBindings()->group(function () {
        Route::apiResource('workspaces.applications', ApplicationController::class);
        Route::put('workspaces/{workspace}/applications/{application}/modules/reorder', [ModuleController::class, 'reorder'])
            ->name('workspaces.applications.modules.reorder');
        Route::apiResource('workspaces.applications.modules', ModuleController::class);
        Route::get('workspaces/{workspace}/applications/{application}/modules/{module}/schema', [ModuleSchemaController::class, 'show'])
            ->name('workspaces.applications.modules.schema.show');
        Route::post('workspaces/{workspace}/applications/{application}/modules/{module}/schema/publish', [ModuleSchemaController::class, 'publish'])
            ->name('workspaces.applications.modules.schema.publish');
        Route::get('workspaces/{workspace}/applications/{application}/modules/{module}/schema/history', [ModuleSchemaController::class, 'history'])
            ->name('workspaces.applications.modules.schema.history');
        Route::get('workspaces/{workspace}/applications/{application}/modules/{module}/list-view', [ModuleListViewController::class, 'show']);
        Route::put('workspaces/{workspace}/applications/{application}/modules/{module}/list-view', [ModuleListViewController::class, 'update']);
        Route::get('workspaces/{workspace}/applications/{application}/modules/{module}/runtime', [DynamicRecordController::class, 'metadata']);
        Route::get('workspaces/{workspace}/applications/{application}/modules/{module}/records', [DynamicRecordController::class, 'index']);
        Route::post('workspaces/{workspace}/applications/{application}/modules/{module}/records', [DynamicRecordController::class, 'store']);
        Route::get('workspaces/{workspace}/applications/{application}/modules/{module}/records/{recordId}', [DynamicRecordController::class, 'show'])->whereNumber('recordId');
        Route::put('workspaces/{workspace}/applications/{application}/modules/{module}/records/{recordId}', [DynamicRecordController::class, 'update'])->whereNumber('recordId');
        Route::delete('workspaces/{workspace}/applications/{application}/modules/{module}/records/{recordId}', [DynamicRecordController::class, 'destroy'])->whereNumber('recordId');
        Route::put('workspaces/{workspace}/applications/{application}/modules/{module}/fields/reorder', [ModuleFieldController::class, 'reorder'])
            ->name('workspaces.applications.modules.fields.reorder');
        Route::put('workspaces/{workspace}/applications/{application}/modules/{module}/form', [ModuleFieldController::class, 'saveForm'])
            ->name('workspaces.applications.modules.form.update');
        Route::apiResource('workspaces.applications.modules.fields', ModuleFieldController::class);
    });
});
