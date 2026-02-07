<?php

namespace App\Support;

use App\Models\TenantIncident;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class TenantIncidentReporter
{
    /**
     * Persist and log a structured tenancy incident.
     */
    public static function record(
        string $type,
        array $context = [],
        ?string $cityId = null,
        string $severity = 'warning',
        ?string $source = null,
        ?string $moduleKey = null,
        ?string $requestId = null,
        ?string $traceId = null
    ): void {
        $payload = [
            'city_id' => $cityId,
            'type' => $type,
            'severity' => $severity,
            'source' => $source,
            'module_key' => $moduleKey,
            'request_id' => $requestId,
            'trace_id' => $traceId,
            'context' => $context,
        ];

        try {
            TenantIncident::query()->create($payload);
        } catch (\Throwable $exception) {
            Log::error('tenant_incident_persist_failed', [
                'type' => $type,
                'severity' => $severity,
                'error' => $exception->getMessage(),
            ]);
        }

        $level = match (strtolower($severity)) {
            'critical', 'error' => 'error',
            default => 'warning',
        };

        Log::{$level}($type, array_filter($payload, static fn($value) => $value !== null));
    }

    /**
     * Track and alert URL-vs-header tenant mismatches.
     */
    public static function recordHeaderPathMismatch(
        Request $request,
        string $headerSlug,
        string $pathSlug,
        ?string $resolvedCityId = null,
        ?string $resolvedCitySlug = null
    ): void {
        $windowSeconds = (int) config('tenancy.observability.tenant_mismatch_window_seconds', 300);
        $threshold = (int) config('tenancy.observability.tenant_mismatch_alert_threshold', 5);
        $cacheKey = 'tenant_incident:header_path_mismatch:' . sha1(
            strtolower($request->getHost()) . '|' . $headerSlug . '|' . $pathSlug
        );

        if (!Cache::has($cacheKey)) {
            Cache::put($cacheKey, 0, now()->addSeconds($windowSeconds));
        }

        $count = (int) Cache::increment($cacheKey);
        $severity = $count >= $threshold ? 'critical' : 'warning';

        self::record(
            type: 'tenant_header_path_mismatch',
            context: [
                'host' => strtolower($request->getHost()),
                'path' => $request->getPathInfo(),
                'x_city' => $headerSlug,
                'path_city' => $pathSlug,
                'count_in_window' => $count,
                'window_seconds' => $windowSeconds,
                'threshold' => $threshold,
                'resolved_city_slug' => $resolvedCitySlug,
            ],
            cityId: $resolvedCityId,
            severity: $severity,
            source: 'tenant_context',
            requestId: $request->header('X-Request-Id')
        );
    }
}
