<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CacheHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $cacheType = 'dynamic'): Response
    {
        $response = $next($request);

        // Only apply cache headers to successful responses
        if (!$response->isSuccessful()) {
            return $response;
        }

        switch ($cacheType) {
            case 'static':
                // Bairros, tipos de lixo, telefones úteis - cache for 24 hours
                $response->headers->set('Cache-Control', 'public, max-age=86400');
                $response->headers->set('ETag', $this->generateEtag($response));
                break;

            case 'semi-static':
                // Eventos, missas - cache for 1 hour
                $response->headers->set('Cache-Control', 'public, max-age=3600');
                $response->headers->set('ETag', $this->generateEtag($response));
                break;

            case 'user':
                // User data - private, no shared cache
                $response->headers->set('Cache-Control', 'private, max-age=300');
                break;

            case 'dynamic':
            default:
                // Reports, topics, alerts - no cache
                $response->headers->set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
                $response->headers->set('Pragma', 'no-cache');
                $response->headers->set('Expires', '0');
                break;
        }

        return $response;
    }

    /**
     * Generate an ETag based on response content.
     */
    protected function generateEtag(Response $response): string
    {
        return '"' . md5($response->getContent()) . '"';
    }
}
