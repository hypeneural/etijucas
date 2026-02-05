<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to ensure proper UTF-8 encoding for Portuguese content.
 * 
 * This middleware:
 * 1. Sets proper Content-Type header with charset=utf-8
 * 2. Prevents mojibake (garbled characters) for PT-BR strings
 * 3. Ensures JSON responses use UTF-8 without escaping unicode
 */
class Utf8Response
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Set proper UTF-8 content type for JSON responses
        if ($response instanceof \Illuminate\Http\JsonResponse) {
            $response->setEncodingOptions(
                $response->getEncodingOptions() | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            );
        }

        // Ensure charset is set in Content-Type
        $contentType = $response->headers->get('Content-Type');
        if ($contentType && str_contains($contentType, 'application/json')) {
            if (!str_contains($contentType, 'charset')) {
                $response->headers->set('Content-Type', 'application/json; charset=utf-8');
            }
        }

        return $response;
    }
}
