<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Idempotency Key Middleware
 * 
 * Prevents duplicate mutations when clients retry requests.
 * Uses the X-Idempotency-Key header to identify unique requests.
 * 
 * Usage in routes:
 *   Route::post('/reports', [ReportController::class, 'store'])
 *       ->middleware('idempotent');
 * 
 * @see OFFLINE_SYNC.md for frontend integration
 */
class IdempotencyKey
{
    /**
     * Cache TTL for idempotency keys (24 hours)
     */
    protected int $ttlMinutes = 1440;

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only apply to POST, PUT, PATCH requests
        if (!in_array($request->method(), ['POST', 'PUT', 'PATCH'])) {
            return $next($request);
        }

        $idempotencyKey = $request->header('X-Idempotency-Key');

        // If no key provided, proceed normally (optional enforcement)
        if (!$idempotencyKey) {
            return $next($request);
        }

        // Validate key format (should be UUID)
        if (!preg_match('/^[a-f0-9-]{36}$/i', $idempotencyKey)) {
            return response()->json([
                'message' => 'Invalid Idempotency-Key format. Must be UUID.',
                'code' => 'INVALID_IDEMPOTENCY_KEY',
            ], 400);
        }

        $cacheKey = "idempotency:{$idempotencyKey}";

        // Check if we already processed this request
        $cached = Cache::get($cacheKey);

        if ($cached) {
            Log::info('Idempotent request replay', [
                'idempotency_key' => $idempotencyKey,
                'original_status' => $cached['status'],
            ]);

            // Return cached response
            return response()->json(
                $cached['body'],
                $cached['status']
            )->withHeaders([
                        'X-Idempotency-Replay' => 'true',
                    ]);
        }

        // Mark as processing (prevent race conditions)
        Cache::put($cacheKey, ['status' => 'processing'], 60);

        // Process the request
        $response = $next($request);

        // Cache the response for future replays
        if ($response->isSuccessful() || $response->isClientError()) {
            $body = json_decode($response->getContent(), true);

            Cache::put($cacheKey, [
                'status' => $response->getStatusCode(),
                'body' => $body,
                'processed_at' => now()->toIso8601String(),
            ], $this->ttlMinutes * 60);

            Log::info('Idempotent request processed', [
                'idempotency_key' => $idempotencyKey,
                'status' => $response->getStatusCode(),
            ]);
        }

        return $response->withHeaders([
            'X-Idempotency-Key' => $idempotencyKey,
        ]);
    }
}
