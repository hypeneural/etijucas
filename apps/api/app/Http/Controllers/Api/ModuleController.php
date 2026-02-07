<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ModuleService;
use Illuminate\Http\JsonResponse;

/**
 * ModuleController
 * 
 * API para frontend consultar módulos disponíveis.
 * Frontend reflete o que o backend diz.
 */
class ModuleController extends Controller
{
    /**
     * List all modules for the current tenant.
     * 
     * GET /api/v1/modules
     * 
     * Response:
     * {
     *   "data": [
     *     { "slug": "forum", "name": "Fórum", "icon": "message-circle", "enabled": true, "settings": {...} },
     *     { "slug": "tourism", "enabled": false }
     *   ]
     * }
     */
    public function index(): JsonResponse
    {
        $modules = ModuleService::getEnabledModules();

        return response()->json([
            'data' => $modules,
            'meta' => [
                'total' => count($modules),
            ],
        ]);
    }

    /**
     * Check if a specific module is enabled.
     * 
     * GET /api/v1/modules/{slug}/status
     */
    public function status(string $slug): JsonResponse
    {
        $isEnabled = ModuleService::isEnabled($slug);
        $settings = $isEnabled ? ModuleService::getSettings($slug) : [];

        return response()->json([
            'data' => [
                'slug' => $slug,
                'enabled' => $isEnabled,
                'settings' => $settings,
            ],
        ]);
    }
}
