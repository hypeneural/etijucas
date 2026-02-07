<?php

namespace App\Http\Middleware;

use App\Services\ModuleService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * ModuleEnabled Middleware
 * 
 * Blocks access to routes if the module is not enabled for the current tenant.
 * Backend is the source of truth.
 * 
 * Usage in routes:
 *   Route::middleware('module:forum')->group(...)
 *   Route::middleware('module:events')->group(...)
 */
class ModuleEnabled
{
    public function handle(Request $request, Closure $next, string $slug): Response
    {
        if (!ModuleService::isEnabled($slug)) {
            return response()->json([
                'error' => 'module_disabled',
                'message' => 'Este módulo não está disponível nesta cidade.',
                'module' => $slug,
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
