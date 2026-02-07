<?php

namespace App\Support;

use Ramsey\Uuid\Uuid;
use Ramsey\Uuid\UuidInterface;

/**
 * Deterministic UUID Generator
 * 
 * Generates deterministic UUIDs based on IBGE codes.
 * This ensures the same city always gets the same UUID across environments.
 * 
 * Uses UUID v5 (SHA-1 based) with a custom namespace.
 * 
 * Usage:
 * ```php
 * // Generate city UUID from IBGE code
 * $cityId = DeterministicUuid::forCity(4216602); // Tijucas
 * 
 * // Generate bairro UUID
 * $bairroId = DeterministicUuid::forBairro(4216602, 'centro');
 * ```
 */
class DeterministicUuid
{
    /**
     * Custom namespace for ETijucas UUIDs.
     * Generated once and never changed.
     */
    private const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c0ffee0000';

    /**
     * Generate deterministic UUID for a city based on IBGE code.
     */
    public static function forCity(int $ibgeCode): UuidInterface
    {
        return Uuid::uuid5(
            self::NAMESPACE ,
            "city:{$ibgeCode}"
        );
    }

    /**
     * Generate deterministic UUID for a bairro.
     */
    public static function forBairro(int $cityIbgeCode, string $bairroSlug): UuidInterface
    {
        return Uuid::uuid5(
            self::NAMESPACE ,
            "bairro:{$cityIbgeCode}:{$bairroSlug}"
        );
    }

    /**
     * Generate deterministic UUID for a module.
     */
    public static function forModule(string $moduleSlug): UuidInterface
    {
        return Uuid::uuid5(
            self::NAMESPACE ,
            "module:{$moduleSlug}"
        );
    }

    /**
     * Generate deterministic UUID for a city-module relationship.
     */
    public static function forCityModule(int $cityIbgeCode, string $moduleSlug): UuidInterface
    {
        return Uuid::uuid5(
            self::NAMESPACE ,
            "city_module:{$cityIbgeCode}:{$moduleSlug}"
        );
    }

    /**
     * Generate deterministic UUID for any custom entity.
     */
    public static function forEntity(string $type, string $identifier): UuidInterface
    {
        return Uuid::uuid5(
            self::NAMESPACE ,
            "{$type}:{$identifier}"
        );
    }

    /**
     * Get UUID as string.
     */
    public static function forCityString(int $ibgeCode): string
    {
        return self::forCity($ibgeCode)->toString();
    }
}
