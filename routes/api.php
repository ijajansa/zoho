<?php

use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FieldTypeController;
use App\Http\Controllers\Api\ModuleController;
use App\Http\Controllers\Api\ModuleFieldController;
use App\Http\Controllers\Api\ModuleSchemaController;
use App\Http\Controllers\Api\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/field-types', FieldTypeController::class);
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
        Route::put('workspaces/{workspace}/applications/{application}/modules/{module}/fields/reorder', [ModuleFieldController::class, 'reorder'])
            ->name('workspaces.applications.modules.fields.reorder');
        Route::put('workspaces/{workspace}/applications/{application}/modules/{module}/form', [ModuleFieldController::class, 'saveForm'])
            ->name('workspaces.applications.modules.form.update');
        Route::apiResource('workspaces.applications.modules.fields', ModuleFieldController::class);
    });
});
