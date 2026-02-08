<?php

declare(strict_types=1);

namespace App\Domains\Weather\Support;

class WeatherRollout
{
    /**
     * @return array<int, string>
     */
    public static function canaryCities(): array
    {
        $configured = config('weather.v2.canary_cities', []);
        if (!is_array($configured)) {
            return [];
        }

        $normalized = array_values(array_unique(array_filter(array_map(
            static fn($slug): string => strtolower(trim((string) $slug)),
            $configured
        ))));
        sort($normalized);

        return $normalized;
    }

    public static function mode(): string
    {
        $mode = strtolower((string) config('weather.v2.rollout_mode', 'all'));
        return in_array($mode, ['all', 'canary', 'off'], true) ? $mode : 'all';
    }

    public static function isV2EnabledForCity(?string $citySlug): bool
    {
        if (!(bool) config('weather.v2.enabled', true)) {
            return false;
        }

        $mode = self::mode();
        if ($mode === 'off') {
            return false;
        }

        if ($mode === 'all') {
            return true;
        }

        if (!is_string($citySlug) || trim($citySlug) === '') {
            return false;
        }

        $slug = strtolower(trim($citySlug));

        return in_array($slug, self::canaryCities(), true);
    }
}

