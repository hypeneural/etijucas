<?php

namespace App\Support;

use App\Models\City;
use App\Models\CityDomain;
use Illuminate\Support\Facades\Cache;

/**
 * TenantUrl Helper
 * 
 * Helps generate tenant-aware URLs with canonical support.
 */
class TenantUrl
{
    /**
     * Generate the canonical URL for a given path within the current tenant.
     * 
     * @param string $path The relative path (e.g., '/forum', '/events')
     * @return string Full canonical URL
     */
    public static function canonical(string $path = ''): string
    {
        $city = Tenant::city();

        if (!$city) {
            return url($path);
        }

        // Find canonical domain for this city
        $canonicalDomain = self::getCanonicalDomain($city->id);

        if ($canonicalDomain) {
            // Use custom domain
            $baseUrl = 'https://' . $canonicalDomain;
            return rtrim($baseUrl, '/') . '/' . ltrim($path, '/');
        }

        // Use path-based URL: /uf/cidade/path
        $basePath = '/' . strtolower($city->uf) . '/' . $city->slug;
        return url(rtrim($basePath, '/') . '/' . ltrim($path, '/'));
    }

    /**
     * Generate the standard path-based URL (always available).
     * 
     * @param string $path The relative path
     * @return string Path-based URL
     */
    public static function path(string $path = ''): string
    {
        $city = Tenant::city();

        if (!$city) {
            return url($path);
        }

        $basePath = '/' . strtolower($city->uf) . '/' . $city->slug;
        return url(rtrim($basePath, '/') . '/' . ltrim($path, '/'));
    }

    /**
     * Get the canonical domain for a city (cached).
     */
    private static function getCanonicalDomain(string $cityId): ?string
    {
        $cacheKey = "city:{$cityId}:canonical_domain";

        return Cache::remember($cacheKey, 3600, function () use ($cityId) {
            $domain = CityDomain::where('city_id', $cityId)
                ->where('is_canonical', true)
                ->first();

            return $domain?->domain;
        });
    }

    /**
     * Get all domains for a city.
     */
    public static function getAllDomains(string $cityId): array
    {
        return CityDomain::where('city_id', $cityId)
            ->pluck('domain')
            ->toArray();
    }
}
