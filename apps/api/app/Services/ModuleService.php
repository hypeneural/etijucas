<?php

namespace App\Services;

use App\Support\Tenant;

/**
 * ModuleService
 * 
 * Central service for checking module status and getting settings.
 * Backend is the source of truth for module enablement.
 */
class ModuleService
{
    /**
     * Check if a module is enabled for the current tenant.
     * Accepts canonical module keys and legacy aliases/slugs.
     */
    public static function isEnabled(string $identifier): bool
    {
        return ModuleResolver::isEnabled($identifier);
    }

    /**
     * Get settings for a module in the current tenant.
     */
    public static function getSettings(string $identifier): array
    {
        return ModuleResolver::settings($identifier);
    }

    /**
     * Get a specific setting value.
     */
    public static function getSetting(string $identifier, string $key, mixed $default = null): mixed
    {
        $settings = self::getSettings($identifier);
        return data_get($settings, $key, $default);
    }

    /**
     * Get all enabled modules for the current tenant.
     */
    public static function getEnabledModules(): array
    {
        return ModuleResolver::enabledModules();
    }

    /**
     * Clear module cache for a city.
     */
    public static function clearCache(?string $cityId = null): void
    {
        $cityId = $cityId ?? Tenant::cityId();
        if (!$cityId) {
            return;
        }

        ModuleResolver::clearCache($cityId);
    }
}
