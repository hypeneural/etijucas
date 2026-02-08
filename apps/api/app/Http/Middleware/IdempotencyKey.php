<?php

namespace App\Http\Middleware;

use App\Support\Tenant;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
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
     * Cache TTL for idempotency records (24 hours).
     */
    protected int $ttlSeconds = 86400;

    /**
     * Lock TTL to avoid duplicate processing in concurrent retries.
     */
    protected int $lockSeconds = 10;

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!in_array($request->method(), ['POST', 'PUT', 'PATCH'], true)) {
            return $next($request);
        }

        $idempotencyKey = trim((string) $request->header('X-Idempotency-Key', ''));

        // Idempotency is opt-in per request.
        if ($idempotencyKey === '') {
            return $next($request);
        }

        if (!Str::isUuid($idempotencyKey)) {
            return response()->json([
                'message' => 'Invalid Idempotency-Key format. Must be UUID.',
                'code' => 'INVALID_IDEMPOTENCY_KEY',
            ], 400);
        }

        $endpoint = strtoupper($request->method()) . ':' . ltrim($request->path(), '/');
        $tenantId = Tenant::cityId() ?? 'global';
        $actor = $request->user()?->getAuthIdentifier()
            ? 'user:' . $request->user()->getAuthIdentifier()
            : 'ip:' . ($request->ip() ?? 'unknown');
        $payloadHash = $this->payloadHash($request);

        $context = [
            'tenant_id' => $tenantId,
            'endpoint' => $endpoint,
            'actor' => $actor,
            'idempotency_key' => $idempotencyKey,
        ];

        $cacheKey = $this->cacheKey($tenantId, $endpoint, $actor, $idempotencyKey);
        $lockKey = "{$cacheKey}:lock";

        $cached = Cache::get($cacheKey);
        if (is_array($cached)) {
            return $this->buildReplayOrConflictResponse($cached, $payloadHash, $idempotencyKey, $context);
        }

        $lock = Cache::lock($lockKey, $this->lockSeconds);

        if (!$lock->get()) {
            $cachedAfterLockFail = Cache::get($cacheKey);
            if (is_array($cachedAfterLockFail)) {
                return $this->buildReplayOrConflictResponse($cachedAfterLockFail, $payloadHash, $idempotencyKey, $context);
            }

            return response()->json([
                'message' => 'Request with this Idempotency-Key is currently processing.',
                'code' => 'IDEMPOTENCY_REQUEST_IN_PROGRESS',
            ], 409)->withHeaders([
                        'X-Idempotency-Key' => $idempotencyKey,
                    ]);
        }

        try {
            // Double-check after lock acquisition.
            $cachedAfterLock = Cache::get($cacheKey);
            if (is_array($cachedAfterLock)) {
                return $this->buildReplayOrConflictResponse($cachedAfterLock, $payloadHash, $idempotencyKey, $context);
            }

            $response = $next($request);

            if ($this->shouldCacheResponse($response)) {
                Cache::put(
                    $cacheKey,
                    [
                        'payload_hash' => $payloadHash,
                        'status' => $response->getStatusCode(),
                        'body' => $this->extractResponseBody($response),
                        'processed_at' => now()->toIso8601String(),
                    ],
                    now()->addSeconds($this->ttlSeconds)
                );

                Log::info('Idempotent request processed', [
                    ...$context,
                    'status' => $response->getStatusCode(),
                ]);
            }

            return $response->withHeaders([
                'X-Idempotency-Key' => $idempotencyKey,
            ]);
        } finally {
            $lock->release();
        }
    }

    /**
     * Build deterministic cache key scoped by tenant + actor + endpoint + key.
     */
    private function cacheKey(string $tenantId, string $endpoint, string $actor, string $idempotencyKey): string
    {
        $fingerprint = "{$tenantId}|{$endpoint}|{$actor}|{$idempotencyKey}";

        return 'idempotency:' . hash('sha256', $fingerprint);
    }

    /**
     * Return cached response, or 409 when same key is reused with different payload.
     *
     * @param array<string, mixed> $cached
     * @param array<string, mixed> $context
     */
    private function buildReplayOrConflictResponse(
        array $cached,
        string $incomingPayloadHash,
        string $idempotencyKey,
        array $context
    ): Response {
        if (($cached['payload_hash'] ?? null) !== $incomingPayloadHash) {
            Log::warning('Idempotency key reused with different payload', $context);

            return response()->json([
                'message' => 'Idempotency key was already used with a different payload.',
                'code' => 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH',
            ], 409)->withHeaders([
                        'X-Idempotency-Key' => $idempotencyKey,
                    ]);
        }

        Log::info('Idempotent request replay', [
            ...$context,
            'original_status' => $cached['status'] ?? null,
            'processed_at' => $cached['processed_at'] ?? null,
        ]);

        return response()->json(
            $cached['body'] ?? null,
            (int) ($cached['status'] ?? 200)
        )->withHeaders([
                    'X-Idempotency-Key' => $idempotencyKey,
                    'X-Idempotency-Replay' => 'true',
                ]);
    }

    /**
     * Determine if the response should be cached for replay.
     */
    private function shouldCacheResponse(Response $response): bool
    {
        return $response->isSuccessful() || $response->isClientError();
    }

    /**
     * Extract JSON body payload when possible, fallback to raw content.
     */
    private function extractResponseBody(Response $response): mixed
    {
        $content = $response->getContent();
        if (!is_string($content) || $content === '') {
            return null;
        }

        $decoded = json_decode($content, true);

        return json_last_error() === JSON_ERROR_NONE ? $decoded : $content;
    }

    /**
     * Build a payload fingerprint that is stable across retries.
     */
    private function payloadHash(Request $request): string
    {
        $payload = [
            'input' => $this->sortRecursive($request->input()),
            'files' => $this->normalizeFiles($request->allFiles()),
        ];

        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return hash('sha256', $json ?: '{}');
    }

    /**
     * Normalize uploaded files to deterministic metadata.
     *
     * @param array<string, mixed> $files
     * @return array<string, mixed>
     */
    private function normalizeFiles(array $files): array
    {
        $normalized = [];

        foreach ($files as $field => $file) {
            $normalized[$field] = $this->normalizeFileValue($file);
        }

        ksort($normalized);

        return $normalized;
    }

    /**
     * @return mixed
     */
    private function normalizeFileValue(mixed $value): mixed
    {
        if ($value instanceof UploadedFile) {
            return [
                'name' => $value->getClientOriginalName(),
                'size' => $value->getSize(),
                'mime' => $value->getClientMimeType() ?: $value->getMimeType(),
            ];
        }

        if (is_array($value)) {
            return array_map(fn(mixed $item) => $this->normalizeFileValue($item), $value);
        }

        return null;
    }

    /**
     * Recursively sort associative arrays to generate stable payload hashes.
     *
     * @param mixed $value
     * @return mixed
     */
    private function sortRecursive(mixed $value): mixed
    {
        if (!is_array($value)) {
            return $value;
        }

        $sorted = [];
        foreach ($value as $key => $item) {
            $sorted[$key] = $this->sortRecursive($item);
        }

        if (!array_is_list($sorted)) {
            ksort($sorted);
        }

        return $sorted;
    }
}
