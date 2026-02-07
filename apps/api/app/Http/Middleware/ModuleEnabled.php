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
    public function handle(Request $request, Closure $next, string $identifier): Response
    {
        if (!ModuleService::isEnabled($identifier)) {
            return response()->json([
                'error' => 'module_disabled',
                'message' => 'Este modulo nao esta disponivel nesta cidade.',
                'module' => $identifier,
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
