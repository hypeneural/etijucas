<?php

namespace App\Support;

use App\Models\City;

/**
 * Tenant Helper
 * 
 * Provides easy access to the current tenant context.
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
}
