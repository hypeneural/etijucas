<?php

namespace App\Support;

use App\Domains\Weather\Support\WeatherRollout;
use App\Models\Bairro;
use App\Models\City;
use App\Services\ModuleResolver;
use BackedEnum;

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
     * Get the current tenant city timezone (IANA).
     */
    public static function timezone(): ?string
    {
        return self::city()?->timezone;
    }

    /**
     * Get canonical tenant key for current context.
     */
    public static function key(): ?string
    {
        if (app()->bound('tenant.key')) {
            return (string) app('tenant.key');
        }

        $city = self::city();
        return $city ? self::buildKey($city) : null;
    }

    /**
     * Build canonical tenant key for a city.
     * Format: slug|timezone|status|brand_hash
     */
    public static function buildKey(City $city): string
    {
        $timezone = (string) ($city->timezone ?: 'America/Sao_Paulo');
        $status = self::cityStatusValue($city);
        $brandHash = self::cityBrandHash($city);

        return "{$city->slug}|{$timezone}|{$status}|{$brandHash}";
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
                'status' => self::cityStatusValue($city),
                'ibgeCode' => $city->ibge_code,
                'timezone' => $city->timezone ?? 'America/Sao_Paulo',
                'isCoastal' => (bool) ($city->is_coastal ?? false),
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
                'weatherV2' => WeatherRollout::isV2EnabledForCity($city->slug),
                'weatherV2RolloutMode' => WeatherRollout::mode(),
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
     * Resolve city status as scalar value for headers/cache keys.
     */
    private static function cityStatusValue(City $city): string
    {
        $status = $city->status;

        if ($status instanceof BackedEnum) {
            return (string) $status->value;
        }

        if (is_string($status) && $status !== '') {
            return $status;
        }

        return $city->active ? 'active' : 'draft';
    }

    /**
     * Build deterministic hash for city brand payload.
     */
    private static function cityBrandHash(City $city): string
    {
        $brand = $city->brand;
        if (!is_array($brand)) {
            $brand = [];
        }

        $sorted = self::sortRecursive($brand);
        $json = json_encode($sorted, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $json = is_string($json) ? $json : '{}';

        return hash('sha256', $json);
    }

    /**
     * Sort nested arrays recursively to stabilize hash generation.
     *
     * @param array<mixed> $input
     * @return array<mixed>
     */
    private static function sortRecursive(array $input): array
    {
        foreach ($input as $key => $value) {
            if (is_array($value)) {
                $input[$key] = self::sortRecursive($value);
            }
        }

        if (array_is_list($input)) {
            return $input;
        }

        ksort($input);
        return $input;
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
