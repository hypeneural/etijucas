<?php

declare(strict_types=1);

namespace App\Domains\Weather\Services;

use App\Domains\Weather\Contracts\WeatherOptions;
use App\Domains\Weather\Contracts\WeatherProviderInterface;
use App\Domains\Weather\Models\ExternalApiCache;
use App\Domains\Weather\Support\WeatherCacheKeyFactory;
use App\Domains\Weather\Support\WeatherCircuitBreaker;
use App\Domains\Weather\Support\WeatherNormalizer;
use App\Domains\Weather\Support\WeatherTelemetry;
use App\Domains\Weather\Support\WeatherTtlJitter;
use App\Domains\Weather\Support\WeatherTtlPolicy;
use App\Models\City;
use App\Support\TenantCache;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Cache\Lock as CacheLock;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class WeatherServiceV2
{
    private WeatherCacheKeyFactory $keys;
    private WeatherTtlPolicy $ttlPolicy;
    private WeatherTtlJitter $ttlJitter;
    private WeatherCircuitBreaker $circuitBreaker;
    private WeatherTelemetry $telemetry;

    public function __construct(
        private readonly WeatherProviderInterface $provider,
        private readonly WeatherNormalizer $normalizer,
        ?WeatherCacheKeyFactory $keys = null,
        ?WeatherTtlPolicy $ttlPolicy = null,
        ?WeatherTtlJitter $ttlJitter = null,
        ?WeatherCircuitBreaker $circuitBreaker = null,
        ?WeatherTelemetry $telemetry = null,
    ) {
        $this->keys = $keys ?? new WeatherCacheKeyFactory();
        $this->ttlPolicy = $ttlPolicy ?? new WeatherTtlPolicy();
        $this->ttlJitter = $ttlJitter ?? new WeatherTtlJitter();
        $this->circuitBreaker = $circuitBreaker ?? new WeatherCircuitBreaker($this->keys);
        $this->telemetry = $telemetry ?? new WeatherTelemetry();
    }

    /**
     * @return array<string, mixed>
     */
    public function getForecast(City $city, WeatherOptions $options, bool $forceRefresh = false): array
    {
        return (array) $this->getSection($city, $options, 'forecast', $forceRefresh)['data'];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getMarineIfNeeded(City $city, WeatherOptions $options, bool $forceRefresh = false): ?array
    {
        if (!(bool) ($city->is_coastal ?? false)) {
            return null;
        }

        return (array) $this->getSection($city, $options, 'marine', $forceRefresh)['data'];
    }

    /**
     * Cached section getter with anti-stampede and stale fallback.
     *
     * @return array{
     *   data:mixed,
     *   cache:array{
     *     cached:bool,
     *     stale:bool,
     *     status:string,
     *     source:string,
     *     generated_at_utc:string,
     *     expires_at_utc:string,
     *     stale_until_utc:string,
     *     degraded:bool,
     *     degraded_reason:?string,
     *     etag:?string
     *   }
     * }
     */
    public function getSection(City $city, WeatherOptions $options, string $section, bool $forceRefresh = false): array
    {
        $section = strtolower(trim($section));

        if ($section === 'marine' && !(bool) ($city->is_coastal ?? false)) {
            $now = CarbonImmutable::now('UTC');

            return $this->buildTrackedEnvelope(
                citySlug: (string) ($city->slug ?? 'unknown-city'),
                section: $section,
                data: null,
                status: 'miss',
                source: 'none',
                generatedAt: $now,
                softExpiresAt: $now,
                staleUntil: $now,
                degraded: false,
                degradedReason: 'not_applicable_non_coastal',
                etag: null,
            );
        }

        $effective = $this->resolveOptions($city, $options);
        $timezone = (string) ($effective->timezone ?? $city->timezone ?? 'America/Sao_Paulo');
        $citySlug = (string) ($city->slug ?? 'unknown-city');
        $cacheKey = $this->keys->section($section, $citySlug, $timezone, $effective->units, $effective->forecastDays);
        $ttl = $this->ttlPolicy->forSection($section);

        return $this->fetchWithCache($city, $citySlug, $effective, $section, $cacheKey, $ttl, $forceRefresh);
    }

    /**
     * @param array<int, string> $sections
     */
    public function buildBundleCacheKey(City $city, WeatherOptions $options, array $sections): string
    {
        $effective = $this->resolveOptions($city, $options);
        $timezone = (string) ($effective->timezone ?? $city->timezone ?? 'America/Sao_Paulo');

        return $this->keys->bundle(
            (string) ($city->slug ?? 'unknown-city'),
            $timezone,
            $effective->units,
            $effective->forecastDays,
            $sections,
        );
    }

    /**
     * @return array{hasMarine:bool,supportsTimezone:bool,maxDays:int}
     */
    public function capabilities(): array
    {
        return $this->provider->capabilities();
    }

    public function providerName(): string
    {
        return $this->provider->name();
    }

    private function resolveOptions(City $city, WeatherOptions $options): WeatherOptions
    {
        return $options->withTimezone($options->timezone ?? $city->timezone);
    }

    /**
     * @param array{soft:int,hard:int} $ttl
     * @return array{
     *   data:mixed,
     *   cache:array{
     *     cached:bool,
     *     stale:bool,
     *     status:string,
     *     source:string,
     *     generated_at_utc:string,
     *     expires_at_utc:string,
     *     stale_until_utc:string,
     *     degraded:bool,
     *     degraded_reason:?string,
     *     etag:?string
     *   }
     * }
     */
    private function fetchWithCache(
        City $city,
        string $citySlug,
        WeatherOptions $options,
        string $section,
        string $cacheKey,
        array $ttl,
        bool $forceRefresh
    ): array {
        $now = CarbonImmutable::now('UTC');

        $hot = $this->readHotCache($citySlug, $cacheKey, $now);
        if (!$forceRefresh && $hot !== null) {
            return $this->buildTrackedEnvelope(
                citySlug: $citySlug,
                section: $section,
                data: $hot['data'],
                status: 'hit',
                source: 'redis',
                generatedAt: $hot['generated_at'],
                softExpiresAt: $hot['soft_expires_at'],
                staleUntil: $hot['stale_until'],
                degraded: false,
                degradedReason: null,
                etag: $hot['etag'],
                cacheKey: $cacheKey,
            );
        }

        $cold = $this->readColdCache($cacheKey, $ttl, $now);

        if (!$forceRefresh && $cold !== null && $cold['soft_expires_at']->isFuture()) {
            $this->storeHotCache($citySlug, $cacheKey, $cold['data'], $cold['generated_at'], $cold['soft_expires_at'], $cold['stale_until'], $cold['etag'], $ttl['soft']);

            return $this->buildTrackedEnvelope(
                citySlug: $citySlug,
                section: $section,
                data: $cold['data'],
                status: 'hit',
                source: 'db',
                generatedAt: $cold['generated_at'],
                softExpiresAt: $cold['soft_expires_at'],
                staleUntil: $cold['stale_until'],
                degraded: false,
                degradedReason: null,
                etag: $cold['etag'],
                cacheKey: $cacheKey,
            );
        }

        if (!$forceRefresh && $this->circuitBreaker->isOpen($citySlug, $section)) {
            if ($cold !== null && $cold['can_serve_stale']) {
                return $this->buildTrackedEnvelope(
                    citySlug: $citySlug,
                    section: $section,
                    data: $cold['data'],
                    status: 'stale',
                    source: 'db',
                    generatedAt: $cold['generated_at'],
                    softExpiresAt: $cold['soft_expires_at'],
                    staleUntil: $cold['stale_until'],
                    degraded: true,
                    degradedReason: 'circuit_open',
                    etag: $cold['etag'],
                    cacheKey: $cacheKey,
                );
            }

            throw new RuntimeException("Weather circuit open for {$section} without stale cache.");
        }

        $lock = Cache::lock($this->keys->lock($cacheKey), 10);
        $lockAcquired = $lock->get();

        if (!$lockAcquired) {
            if ($cold !== null && $cold['can_serve_stale']) {
                return $this->buildTrackedEnvelope(
                    citySlug: $citySlug,
                    section: $section,
                    data: $cold['data'],
                    status: 'stale',
                    source: 'db',
                    generatedAt: $cold['generated_at'],
                    softExpiresAt: $cold['soft_expires_at'],
                    staleUntil: $cold['stale_until'],
                    degraded: true,
                    degradedReason: 'stale_if_busy',
                    etag: $cold['etag'],
                    cacheKey: $cacheKey,
                );
            }

            throw new RuntimeException("Weather lock busy for {$section} without stale cache.");
        }

        $providerStartedAt = microtime(true);

        try {
            $data = $this->fetchFromProvider($section, $city, $options);
            $this->telemetry->recordProviderResult(
                $this->provider->name(),
                $citySlug,
                $section,
                $this->elapsedMs($providerStartedAt),
                true,
            );

            $generatedAt = CarbonImmutable::now('UTC');
            $softExpiresAt = $generatedAt->addSeconds($ttl['soft']);
            $staleUntil = $generatedAt->addSeconds($ttl['hard']);
            $etag = hash('sha256', json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '');

            $this->storeColdCache($cacheKey, $city, $options, $data, $etag, $generatedAt, $staleUntil);
            $this->storeHotCache($citySlug, $cacheKey, $data, $generatedAt, $softExpiresAt, $staleUntil, $etag, $ttl['soft']);
            $this->circuitBreaker->recordSuccess($citySlug, $section);

            return $this->buildTrackedEnvelope(
                citySlug: $citySlug,
                section: $section,
                data: $data,
                status: 'miss',
                source: 'provider',
                generatedAt: $generatedAt,
                softExpiresAt: $softExpiresAt,
                staleUntil: $staleUntil,
                degraded: false,
                degradedReason: null,
                etag: $etag,
                cacheKey: $cacheKey,
            );
        } catch (Throwable $error) {
            $this->telemetry->recordProviderResult(
                $this->provider->name(),
                $citySlug,
                $section,
                $this->elapsedMs($providerStartedAt),
                false,
            );

            ExternalApiCache::query()
                ->where('key', $cacheKey)
                ->update(['last_error' => $error->getMessage()]);

            $opened = $this->circuitBreaker->recordFailure($citySlug, $section);

            Log::warning('WeatherServiceV2 upstream fetch failed', [
                'city' => $citySlug,
                'section' => $section,
                'cache_key' => $cacheKey,
                'error' => $error->getMessage(),
                'circuit_opened' => $opened,
            ]);

            if ($cold !== null && $cold['can_serve_stale']) {
                return $this->buildTrackedEnvelope(
                    citySlug: $citySlug,
                    section: $section,
                    data: $cold['data'],
                    status: 'stale',
                    source: 'db',
                    generatedAt: $cold['generated_at'],
                    softExpiresAt: $cold['soft_expires_at'],
                    staleUntil: $cold['stale_until'],
                    degraded: true,
                    degradedReason: $opened ? 'circuit_opened_after_error' : 'provider_error',
                    etag: $cold['etag'],
                    cacheKey: $cacheKey,
                );
            }

            throw $error;
        } finally {
            $this->releaseLock($lock, $lockAcquired);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function fetchFromProvider(string $section, City $city, WeatherOptions $options): array
    {
        return match ($section) {
            'forecast' => $this->normalizer->normalizeForecast(
                $this->provider->forecast((float) $city->lat, (float) $city->lon, $options)
            ),
            'marine' => $this->normalizer->normalizeMarine(
                $this->provider->marine((float) $city->lat, (float) $city->lon, $options)
            ),
            default => throw new RuntimeException("Unsupported weather section: {$section}"),
        };
    }

    /**
     * @return array{data:mixed,generated_at:CarbonImmutable,soft_expires_at:CarbonImmutable,stale_until:CarbonImmutable,etag:?string}|null
     */
    private function readHotCache(string $citySlug, string $cacheKey, CarbonImmutable $now): ?array
    {
        $cached = TenantCache::getForCity($citySlug, $cacheKey);

        if (!is_array($cached)) {
            return null;
        }

        if (!isset($cached['data'], $cached['generated_at_utc'], $cached['expires_at_utc'], $cached['stale_until_utc'])) {
            return null;
        }

        $generatedAt = CarbonImmutable::parse((string) $cached['generated_at_utc'], 'UTC');
        $softExpiresAt = CarbonImmutable::parse((string) $cached['expires_at_utc'], 'UTC');
        $staleUntil = CarbonImmutable::parse((string) $cached['stale_until_utc'], 'UTC');

        if ($softExpiresAt->lessThanOrEqualTo($now)) {
            return null;
        }

        return [
            'data' => $cached['data'],
            'generated_at' => $generatedAt,
            'soft_expires_at' => $softExpiresAt,
            'stale_until' => $staleUntil,
            'etag' => isset($cached['etag']) ? (string) $cached['etag'] : null,
        ];
    }

    /**
     * @param array{soft:int,hard:int} $ttl
     * @return array{data:mixed,generated_at:CarbonImmutable,soft_expires_at:CarbonImmutable,stale_until:CarbonImmutable,etag:?string,can_serve_stale:bool}|null
     */
    private function readColdCache(string $cacheKey, array $ttl, CarbonImmutable $now): ?array
    {
        $cached = ExternalApiCache::getByKey($cacheKey);

        if (!$cached || !$cached->fetched_at) {
            return null;
        }

        $generatedAt = CarbonImmutable::instance($cached->fetched_at)->setTimezone('UTC');
        $softExpiresAt = $generatedAt->addSeconds($ttl['soft']);
        $staleUntil = $generatedAt->addSeconds($ttl['hard']);

        if ($cached->expires_at) {
            $recordExpiry = CarbonImmutable::instance($cached->expires_at)->setTimezone('UTC');
            if ($recordExpiry->lessThan($staleUntil)) {
                $staleUntil = $recordExpiry;
            }
        }

        return [
            'data' => $cached->payload,
            'generated_at' => $generatedAt,
            'soft_expires_at' => $softExpiresAt,
            'stale_until' => $staleUntil,
            'etag' => $cached->payload_hash,
            'can_serve_stale' => $now->lessThanOrEqualTo($staleUntil),
        ];
    }

    private function storeColdCache(
        string $cacheKey,
        City $city,
        WeatherOptions $options,
        array $data,
        string $etag,
        CarbonImmutable $generatedAt,
        CarbonImmutable $staleUntil
    ): void {
        ExternalApiCache::query()->updateOrCreate(
            ['key' => $cacheKey],
            [
                'provider' => $this->provider->name(),
                'lat' => (float) $city->lat,
                'lon' => (float) $city->lon,
                'timezone' => $options->timezone,
                'payload' => $data,
                'payload_hash' => $etag,
                'fetched_at' => $generatedAt,
                'expires_at' => $staleUntil,
                'last_error' => null,
            ]
        );
    }

    private function storeHotCache(
        string $citySlug,
        string $cacheKey,
        mixed $data,
        CarbonImmutable $generatedAt,
        CarbonImmutable $softExpiresAt,
        CarbonImmutable $staleUntil,
        ?string $etag,
        int $softTtlSeconds
    ): void {
        TenantCache::putForCity(
            $citySlug,
            $cacheKey,
            [
                'data' => $data,
                'generated_at_utc' => $generatedAt->toIso8601String(),
                'expires_at_utc' => $softExpiresAt->toIso8601String(),
                'stale_until_utc' => $staleUntil->toIso8601String(),
                'etag' => $etag,
            ],
            $this->ttlJitter->apply($softTtlSeconds)
        );
    }

    private function releaseLock(CacheLock $lock, bool $acquired): void
    {
        if (!$acquired) {
            return;
        }

        try {
            $lock->release();
        } catch (Throwable) {
            // Ignore release race conditions.
        }
    }

    private function elapsedMs(float $startedAt): int
    {
        return max(0, (int) round((microtime(true) - $startedAt) * 1000));
    }

    private function buildTrackedEnvelope(
        string $citySlug,
        string $section,
        mixed $data,
        string $status,
        string $source,
        CarbonImmutable $generatedAt,
        CarbonImmutable $softExpiresAt,
        CarbonImmutable $staleUntil,
        bool $degraded,
        ?string $degradedReason,
        ?string $etag,
        ?string $cacheKey = null,
    ): array {
        $envelope = $this->buildEnvelope(
            data: $data,
            status: $status,
            source: $source,
            generatedAt: $generatedAt,
            softExpiresAt: $softExpiresAt,
            staleUntil: $staleUntil,
            degraded: $degraded,
            degradedReason: $degradedReason,
            etag: $etag,
        );

        $this->telemetry->recordCacheStatus(
            citySlug: $citySlug,
            section: $section,
            status: $status,
            source: $source,
            degraded: $degraded,
            degradedReason: $degradedReason,
            cacheKey: $cacheKey,
        );

        return $envelope;
    }

    private function buildEnvelope(
        mixed $data,
        string $status,
        string $source,
        CarbonImmutable $generatedAt,
        CarbonImmutable $softExpiresAt,
        CarbonImmutable $staleUntil,
        bool $degraded,
        ?string $degradedReason,
        ?string $etag
    ): array {
        return [
            'data' => $data,
            'cache' => [
                'cached' => $status !== 'miss',
                'stale' => $status === 'stale',
                'status' => $status,
                'source' => $source,
                'generated_at_utc' => $generatedAt->toIso8601String(),
                'expires_at_utc' => $softExpiresAt->toIso8601String(),
                'stale_until_utc' => $staleUntil->toIso8601String(),
                'degraded' => $degraded,
                'degraded_reason' => $degradedReason,
                'etag' => $etag,
            ],
        ];
    }
}
