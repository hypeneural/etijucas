<?php

declare(strict_types=1);

namespace App\Domains\Weather\Contracts;

interface WeatherProviderInterface
{
    /**
     * Provider identifier used by payload contract and logs.
     */
    public function name(): string;

    /**
     * Capability map for orchestration and validation.
     *
     * @return array{hasMarine:bool,supportsTimezone:bool,maxDays:int}
     */
    public function capabilities(): array;

    /**
     * Fetch land weather forecast payload.
     *
     * @return array<mixed>
     */
    public function forecast(float $lat, float $lon, WeatherOptions $options): array;

    /**
     * Fetch marine weather payload.
     *
     * @return array<mixed>
     */
    public function marine(float $lat, float $lon, WeatherOptions $options): array;
}
