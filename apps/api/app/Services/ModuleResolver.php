<?php

namespace App\Services;

use App\Models\CityModule;
use App\Models\Module;
use App\Support\TenantCache;
use App\Support\Tenant;

class ModuleResolver
{
    private const CACHE_TTL_SECONDS = 300;

    /**
     * Resolve effective enabled state for a module.
     * cityEnabled = null means no explicit city_modules override.
     */
    public static function resolveEnabledState(?bool $cityEnabled, bool $isCore): bool
    {
        if ($cityEnabled !== null) {
            return (bool) $cityEnabled;
        }

        return $isCore;
    }

    /**
     * Check if module is enabled for a city (or current tenant city).
     */
    public static function isEnabled(string $identifier, ?string $cityId = null): bool
    {
        $cityId = $cityId ?: Tenant::cityId();
        if (!$cityId) {
            return false;
        }

        $key = Module::normalizeKey($identifier);
        $effective = self::effectiveModulesMap($cityId);

        return (bool) ($effective[$key]['enabled'] ?? false);
    }

    /**
     * Get effective settings for a module in a city (or current tenant city).
     */
    public static function settings(string $identifier, ?string $cityId = null): array
    {
        $cityId = $cityId ?: Tenant::cityId();
        if (!$cityId) {
            return [];
        }

        $key = Module::normalizeKey($identifier);
        $effective = self::effectiveModulesMap($cityId);

        return (array) ($effective[$key]['settings'] ?? []);
    }

    /**
     * Get all enabled modules for a city (or current tenant city).
     */
    public static function enabledModules(?string $cityId = null): array
    {
        $cityId = $cityId ?: Tenant::cityId();
        if (!$cityId) {
            return [];
        }

        return array_values(array_filter(
            self::effectiveModulesMap($cityId),
            static fn(array $module) => (bool) ($module['enabled'] ?? false)
        ));
    }

    /**
     * Clear module resolution cache for a city.
     */
    public static function clearCache(?string $cityId = null): void
    {
        $cityId = $cityId ?: Tenant::cityId();
        if (!$cityId) {
            return;
        }

        TenantCache::forgetForCity($cityId, 'modules_effective');
    }

    /**
     * Build effective module map for a city with a single source of truth.
     */
    private static function effectiveModulesMap(string $cityId): array
    {
        return TenantCache::rememberForCity($cityId, 'modules_effective', self::CACHE_TTL_SECONDS, function () use ($cityId) {
            $modules = Module::ordered()->get();
            $cityModules = CityModule::query()
                ->where('city_id', $cityId)
                ->get()
                ->keyBy('module_id');

            $effective = [];

            foreach ($modules as $module) {
                $cityModule = $cityModules->get($module->id);
                $moduleKey = $module->module_key ?: Module::normalizeKey($module->slug);
                $enabled = self::resolveEnabledState(
                    $cityModule ? (bool) $cityModule->enabled : null,
                    (bool) $module->is_core
                );

                $effective[$moduleKey] = [
                    'key' => $moduleKey,
                    'slug' => $module->slug,
                    'routeSlugPtbr' => $module->route_slug_ptbr,
                    'name' => $module->name,
                    'namePtbr' => $module->name_ptbr,
                    'icon' => $module->icon,
                    'description' => $module->description,
                    'enabled' => $enabled,
                    'settings' => $cityModule?->settings ?? [],
                ];
            }

            return $effective;
        });
    }
}
