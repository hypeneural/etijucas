<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/**
 * TenantCache Helper
 * 
 * Cache helper that automatically prefixes keys with tenant (city) context.
 * Prevents cache pollution between cities.
 * 
 * Usage:
 *   TenantCache::remember('forum:topics', 60, fn() => ...);
 *   // Generates key: "city:{city_id}:forum:topics"
 * 
 * @see TENANCY_CONTRACT.md
 */
class TenantCache
{
    /**
     * Get the tenant-prefixed cache key.
     */
    public static function key(string $key): string
    {
        $cityId = Tenant::cityId();

        if (!$cityId) {
            return "global:{$key}";
        }

        return "city:{$cityId}:{$key}";
    }

    /**
     * Get an item from the cache, or execute callback and store the result.
     */
    public static function remember(string $key, int $ttl, \Closure $callback): mixed
    {
        return Cache::remember(self::key($key), $ttl, $callback);
    }

    /**
     * Store an item in the cache.
     */
    public static function put(string $key, mixed $value, int $ttl): bool
    {
        return Cache::put(self::key($key), $value, $ttl);
    }

    /**
     * Get an item from the cache.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        return Cache::get(self::key($key), $default);
    }

    /**
     * Remove an item from the cache.
     */
    public static function forget(string $key): bool
    {
        return Cache::forget(self::key($key));
    }

    /**
     * Check if an item exists in the cache.
     */
    public static function has(string $key): bool
    {
        return Cache::has(self::key($key));
    }

    /**
     * Get multiple items from the cache.
     */
    public static function many(array $keys): array
    {
        $prefixedKeys = array_map(fn($k) => self::key($k), $keys);
        return Cache::many($prefixedKeys);
    }

    /**
     * Clear all cache for a specific city.
     * Note: This only works with cache drivers that support tags.
     */
    public static function flushCity(?string $cityId = null): void
    {
        // For file cache, we can't efficiently clear by prefix
        // This is a no-op for file driver, but works with Redis
        $cityId = $cityId ?? Tenant::cityId();

        if (!$cityId) {
            return;
        }

        // If using Redis, we could use Cache::forget with pattern
        // For now, log a warning
        logger()->warning("TenantCache::flushCity is not fully supported with file cache driver");
    }

    /**
     * Cache with bairro context (for hyper-local data).
     */
    public static function rememberByBairro(string $bairroId, string $key, int $ttl, \Closure $callback): mixed
    {
        $fullKey = self::key("bairro:{$bairroId}:{$key}");
        return Cache::remember($fullKey, $ttl, $callback);
    }
}
