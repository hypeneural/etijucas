<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * RequireTenant Middleware
 *
 * Ensures a real tenant context is present for tenant-required routes.
 * Requests resolved only by fallback city are rejected.
 */
class RequireTenant
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $city = $request->attributes->get('tenant_city');
        $source = $request->attributes->get('tenant_resolution_source');

        if (!$city) {
            return response()->json([
                'success' => false,
                'error' => 'TENANT_REQUIRED',
                'message' => 'Cidade obrigatoria para esta rota.',
            ], 400);
        }

        if ($source === 'fallback') {
            return response()->json([
                'success' => false,
                'error' => 'TENANT_REQUIRED',
                'message' => 'Cidade obrigatoria. Informe a cidade por dominio, URL ou header X-City.',
            ], 400);
        }

        return $next($request);
    }
}
