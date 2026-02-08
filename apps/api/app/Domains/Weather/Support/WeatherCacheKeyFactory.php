<?php

declare(strict_types=1);

namespace App\Domains\Weather\Support;

class WeatherCacheKeyFactory
{
    public function __construct(
        private readonly int $schemaVersion = 1,
    ) {
    }

    public function bundle(string $citySlug, string $timezone, string $units, int $days, array $sections): string
    {
        $sectionsToken = $this->sectionsToken($sections);

        return sprintf(
            'weather:bundle:%s:tz:%s:u:%s:days:%d:sections:%s:v%d',
            $citySlug,
            $timezone,
            strtolower($units),
            $days,
            $sectionsToken,
            $this->schemaVersion
        );
    }

    public function section(string $section, string $citySlug, string $timezone, string $units, int $days): string
    {
        $normalizedSection = $this->normalizeToken($section);

        return sprintf(
            'weather:%s:%s:tz:%s:u:%s:days:%d:v%d',
            $normalizedSection,
            $citySlug,
            $timezone,
            strtolower($units),
            $days,
            $this->schemaVersion
        );
    }

    public function lock(string $cacheKey): string
    {
        return "weather:lock:{$cacheKey}";
    }

    public function circuit(string $citySlug, string $section): string
    {
        return sprintf('weather:circuit:%s:%s', $citySlug, $this->normalizeToken($section));
    }

    public function failCount(string $citySlug, string $section): string
    {
        return sprintf('weather:failcount:%s:%s', $citySlug, $this->normalizeToken($section));
    }

    /**
     * @param array<int, string> $sections
     */
    public function sectionsToken(array $sections): string
    {
        $normalized = array_values(array_unique(array_map(
            fn(string $section): string => $this->normalizeToken($section),
            $sections
        )));

        sort($normalized);

        return implode(',', $normalized);
    }

    private function normalizeToken(string $token): string
    {
        $normalized = strtolower(trim($token));
        $normalized = preg_replace('/[^a-z0-9,_-]+/', '-', $normalized);

        return trim((string) $normalized, '-');
    }
}
