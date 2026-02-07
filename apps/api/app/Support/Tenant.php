<?php

namespace App\Support;

use App\Models\Bairro;
use App\Models\City;
use App\Services\ModuleResolver;

/**
 * Tenant Helper
 * 
 * Provides easy access to the current tenant context.
 * Used throughout the application for tenant-aware operations.
 * 
 * @see App\Http\Middleware\TenantContext for tenant resolution
 */
class Tenant
{
    /**
     * Get the current tenant city.
     */
    public static function city(): ?City
    {
        return app()->bound('tenant.city') ? app('tenant.city') : null;
    }

    /**
     * Get the current tenant city ID.
     */
    public static function cityId(): ?string
    {
        return self::city()?->id;
    }

    /**
     * Get the current tenant city slug.
     */
    public static function citySlug(): ?string
    {
        return self::city()?->slug;
    }

    /**
     * Check if we're in a specific city context.
     */
    public static function is(string $slug): bool
    {
        return self::citySlug() === $slug;
    }

    /**
     * Check if tenant context is set.
     */
    public static function isSet(): bool
    {
        return self::city() !== null;
    }

    /**
     * Check if a module is enabled for the current tenant.
     * Accepts canonical module keys and legacy aliases/slugs.
     */
    public static function moduleEnabled(string $identifier): bool
    {
        return ModuleResolver::isEnabled($identifier, self::cityId());
    }

    /**
     * Get settings for a specific module.
     */
    public static function moduleSettings(string $identifier): array
    {
        return ModuleResolver::settings($identifier, self::cityId());
    }

    /**
     * Get list of enabled modules for the current tenant.
     */
    public static function enabledModules(): array
    {
        return ModuleResolver::enabledModules(self::cityId());
    }

    /**
     * Get full configuration for the current tenant.
     * Used by /api/v1/config endpoint for frontend bootstrap.
     */
    public static function config(): array
    {
        if (!self::isSet()) {
            return [];
        }

        $city = self::city();

        return [
            'city' => [
                'id' => $city->id,
                'name' => $city->name,
                'slug' => $city->slug,
                'uf' => $city->uf,
                'fullName' => $city->full_name,
                'status' => $city->status->value ?? 'active',
                'ibgeCode' => $city->ibge_code,
            ],
            'brand' => self::getBrandConfig($city),
            'modules' => self::enabledModules(),
            'geo' => [
                'defaultBairroId' => self::getDefaultBairroId(),
                'lat' => $city->lat,
                'lon' => $city->lon,
            ],
            'features' => [
                'offlineEnabled' => true,
                'pushNotifications' => true,
            ],
        ];
    }

    /**
     * Get brand configuration for the city.
     */
    private static function getBrandConfig(City $city): array
    {
        // Use brand_dto if available, otherwise build from properties
        if (property_exists($city, 'brand_dto') && $city->brand_dto) {
            return $city->brand_dto->toArray();
        }

        return [
            'appName' => $city->name ?? 'Cidade Conectada',
            'primaryColor' => $city->primary_color ?? '#10B981',
            'secondaryColor' => $city->secondary_color ?? '#059669',
            'logoUrl' => $city->logo_url ?? null,
            'faviconUrl' => $city->favicon_url ?? null,
        ];
    }

    /**
     * Get default bairro ID (usually "Centro").
     */
    private static function getDefaultBairroId(): ?string
    {
        return Bairro::where('city_id', self::cityId())
            ->where(function ($q) {
                $q->where('slug', 'centro')
                    ->orWhere('nome', 'Centro');
            })
            ->first()?->id;
    }

    /**
     * Clear all cached data for the current tenant.
     */
    public static function clearCache(): void
    {
        if (!self::isSet()) {
            return;
        }

        $cityId = self::cityId();

        ModuleResolver::clearCache($cityId);
    }
}
