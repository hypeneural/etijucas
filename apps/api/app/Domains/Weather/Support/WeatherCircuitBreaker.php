<?php

declare(strict_types=1);

namespace App\Domains\Weather\Support;

use App\Support\TenantCache;
use Carbon\CarbonImmutable;

class WeatherCircuitBreaker
{
    public function __construct(
        private readonly WeatherCacheKeyFactory $keys,
        private readonly int $failureThreshold = 3,
        private readonly int $failureWindowSeconds = 120,
        private readonly int $openSeconds = 120,
    ) {
    }

    public function isOpen(string $citySlug, string $section): bool
    {
        return TenantCache::hasForCity($citySlug, $this->keys->circuit($citySlug, $section));
    }

    /**
     * @return bool True when circuit has been opened by this failure.
     */
    public function recordFailure(string $citySlug, string $section): bool
    {
        $key = $this->keys->failCount($citySlug, $section);
        $entry = TenantCache::getForCity($citySlug, $key);
        $now = CarbonImmutable::now('UTC');

        $count = 0;
        $firstFailureAt = $now;

        if (is_array($entry) && isset($entry['count'], $entry['first_failure_at'])) {
            $parsed = CarbonImmutable::parse((string) $entry['first_failure_at'], 'UTC');
            if ($now->diffInSeconds($parsed) <= $this->failureWindowSeconds) {
                $count = (int) $entry['count'];
                $firstFailureAt = $parsed;
            }
        }

        $count++;
        TenantCache::putForCity($citySlug, $key, [
            'count' => $count,
            'first_failure_at' => $firstFailureAt->toIso8601String(),
        ], $this->failureWindowSeconds);

        if ($count >= $this->failureThreshold) {
            TenantCache::putForCity($citySlug, $this->keys->circuit($citySlug, $section), true, $this->openSeconds);
            return true;
        }

        return false;
    }

    public function recordSuccess(string $citySlug, string $section): void
    {
        TenantCache::forgetForCity($citySlug, $this->keys->failCount($citySlug, $section));
        TenantCache::forgetForCity($citySlug, $this->keys->circuit($citySlug, $section));
    }
}
