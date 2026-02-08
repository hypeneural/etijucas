<?php

namespace App\Http\Middleware;

use App\Support\Tenant;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Request ID Middleware
 * 
 * Generates or propagates a unique request ID for tracing.
 * Also adds tenant context to all logs for debugging.
 */
class RequestIdMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get or generate request ID
        $requestId = $request->header('X-Request-Id') ?? Str::uuid()->toString();
        $request->attributes->set('request_id', $requestId);
        app()->instance('request.id', $requestId);

        // Share context with all log calls in this request
        Log::shareContext([
            'request_id' => $requestId,
            'tenant_city_id' => Tenant::cityId(),
            'tenant_slug' => Tenant::citySlug(),
        ]);

        // Process request
        $response = $next($request);

        // Add request ID to response for client tracing
        return $response->header('X-Request-Id', $requestId);
    }
}
