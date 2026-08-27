<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FieldTypeRegistry;
use Illuminate\Http\JsonResponse;

class FieldTypeController extends Controller
{
    public function __invoke(FieldTypeRegistry $registry): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => ['field_types' => $registry->all()],
        ]);
    }
}
