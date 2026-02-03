<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Request ID Middleware
 * 
 * Adiciona X-Request-ID a todas as responses e configura contexto de log.
 * Facilita debugging e rastreamento de requests em produção.
 * 
 * Usage: Adicione como middleware global em bootstrap/app.php
 */
class RequestId
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Gera ou usa Request ID existente (permite passthrough de gateways)
        $requestId = $request->header('X-Request-ID') ?? (string) Str::uuid();

        // Armazena no request para uso posterior
        $request->headers->set('X-Request-ID', $requestId);

        // Configura contexto de log para todas as mensagens
        Log::withContext([
            'request_id' => $requestId,
            'user_id' => $request->user()?->id,
            'ip' => $request->ip(),
            'method' => $request->method(),
            'path' => $request->path(),
        ]);

        // Processa request
        $response = $next($request);

        // Adiciona header na response
        $response->headers->set('X-Request-ID', $requestId);

        // Log da request completa (opcional, pode ser verbose)
        if (config('app.debug')) {
            Log::debug('Request completed', [
                'status' => $response->getStatusCode(),
                'duration_ms' => round((microtime(true) - LARAVEL_START) * 1000, 2),
            ]);
        }

        return $response;
    }
}
