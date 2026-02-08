<?php

declare(strict_types=1);

namespace App\Domains\Weather\Support;

use Illuminate\Support\Facades\Log;

class WeatherTelemetry
{
    public function recordCacheStatus(
        string $citySlug,
        string $section,
        string $status,
        string $source,
        bool $degraded,
        ?string $degradedReason = null,
        ?string $cacheKey = null,
    ): void {
        $metric = match ($status) {
            'hit' => 'weather_bundle.cache_hit',
            'stale' => 'weather_bundle.cache_stale',
            default => 'weather_bundle.cache_miss',
        };

        Log::info('weather_metric', [
            'metric' => $metric,
            'value' => 1,
            'city_slug' => $citySlug,
            'section' => $section,
            'status' => $status,
            'source' => $source,
            'degraded' => $degraded,
            'degraded_reason' => $degradedReason,
            'cache_key' => $cacheKey,
        ]);
    }

    public function recordProviderResult(
        string $provider,
        string $citySlug,
        string $section,
        int $latencyMs,
        bool $success,
    ): void {
        Log::info('weather_metric', [
            'metric' => 'provider.latency_ms',
            'value' => $latencyMs,
            'provider' => $provider,
            'city_slug' => $citySlug,
            'section' => $section,
            'success' => $success,
        ]);

        Log::info('weather_metric', [
            'metric' => 'provider.error_rate',
            'value' => $success ? 0 : 1,
            'provider' => $provider,
            'city_slug' => $citySlug,
            'section' => $section,
        ]);
    }

    /**
     * @param array<int, string> $sections
     */
    public function recordBundleRequest(string $citySlug, array $sections, int $payloadBytes): void
    {
        $normalizedSections = array_values(array_unique(array_filter(array_map(
            static fn(string $section): string => strtolower(trim($section)),
            $sections
        ))));
        sort($normalizedSections);

        Log::info('weather_metric', [
            'metric' => 'bundle.sections_requested',
            'value' => count($normalizedSections),
            'city_slug' => $citySlug,
            'sections' => $normalizedSections,
            'sections_csv' => implode(',', $normalizedSections),
        ]);

        Log::info('weather_metric', [
            'metric' => 'bundle.payload_kb',
            'value' => round($payloadBytes / 1024, 3),
            'payload_bytes' => $payloadBytes,
            'city_slug' => $citySlug,
            'sections' => $normalizedSections,
            'sections_csv' => implode(',', $normalizedSections),
        ]);
    }
}

