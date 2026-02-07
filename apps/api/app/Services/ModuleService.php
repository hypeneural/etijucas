<?php

namespace App\Services;

use App\Models\CityModule;
use App\Models\Module;
use App\Support\Tenant;
use Illuminate\Support\Facades\Cache;

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
     */
    public static function isEnabled(string $slug): bool
    {
        $cityId = Tenant::cityId();
        if (!$cityId) {
            return false;
        }

        $cacheKey = "city:{$cityId}:module:{$slug}:enabled";

        return Cache::remember($cacheKey, 300, function () use ($slug, $cityId) {
            $module = Module::findBySlug($slug);
            if (!$module) {
                return false;
            }

            $cityModule = CityModule::where('city_id', $cityId)
                ->where('module_id', $module->id)
                ->first();

            // Core modules: enabled by default (unless explicitly disabled)
            if ($module->is_core) {
                return $cityModule?->enabled ?? true;
            }

            // Optional modules: disabled by default (unless explicitly enabled)
            return $cityModule?->enabled ?? false;
        });
    }

    /**
     * Get settings for a module in the current tenant.
     */
    public static function getSettings(string $slug): array
    {
        $cityId = Tenant::cityId();
        if (!$cityId) {
            return [];
        }

        $cacheKey = "city:{$cityId}:module:{$slug}:settings";

        return Cache::remember($cacheKey, 300, function () use ($slug, $cityId) {
            $module = Module::findBySlug($slug);
            if (!$module) {
                return [];
            }

            $cityModule = CityModule::where('city_id', $cityId)
                ->where('module_id', $module->id)
                ->first();

            return $cityModule?->settings ?? [];
        });
    }

    /**
     * Get a specific setting value.
     */
    public static function getSetting(string $slug, string $key, mixed $default = null): mixed
    {
        $settings = self::getSettings($slug);
        return data_get($settings, $key, $default);
    }

    /**
     * Get all enabled modules for the current tenant.
     */
    public static function getEnabledModules(): array
    {
        $cityId = Tenant::cityId();
        if (!$cityId) {
            return [];
        }

        $cacheKey = "city:{$cityId}:modules:enabled";

        return Cache::remember($cacheKey, 300, function () use ($cityId) {
            $modules = Module::ordered()->get();
            $cityModules = CityModule::where('city_id', $cityId)->get()->keyBy('module_id');

            $enabled = [];

            foreach ($modules as $module) {
                $cityModule = $cityModules->get($module->id);

                $isEnabled = $module->is_core
                    ? ($cityModule?->enabled ?? true)
                    : ($cityModule?->enabled ?? false);

                if ($isEnabled) {
                    $enabled[] = [
                        'slug' => $module->slug,
                        'name' => $module->name,
                        'icon' => $module->icon,
                        'settings' => $cityModule?->settings ?? [],
                    ];
                }
            }

            return $enabled;
        });
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

        $modules = Module::pluck('slug');

        foreach ($modules as $slug) {
            Cache::forget("city:{$cityId}:module:{$slug}:enabled");
            Cache::forget("city:{$cityId}:module:{$slug}:settings");
        }

        Cache::forget("city:{$cityId}:modules:enabled");
    }
}
