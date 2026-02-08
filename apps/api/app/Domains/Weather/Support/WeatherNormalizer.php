<?php

declare(strict_types=1);

namespace App\Domains\Weather\Support;

class WeatherNormalizer
{
    /**
     * @param array<mixed> $payload
     * @return array<string, mixed>
     */
    public function normalizeForecast(array $payload): array
    {
        return [
            'current' => (array) ($payload['current'] ?? []),
            'hourly' => (array) ($payload['hourly'] ?? []),
            'daily' => (array) ($payload['daily'] ?? []),
            'meta' => [
                'timezone' => $payload['timezone'] ?? null,
                'elevation' => $payload['elevation'] ?? null,
                'latitude' => $payload['latitude'] ?? null,
                'longitude' => $payload['longitude'] ?? null,
            ],
            'raw' => $payload,
        ];
    }

    /**
     * @param array<mixed> $payload
     * @return array<string, mixed>
     */
    public function normalizeMarine(array $payload): array
    {
        return [
            'hourly' => (array) ($payload['hourly'] ?? []),
            'daily' => (array) ($payload['daily'] ?? []),
            'meta' => [
                'timezone' => $payload['timezone'] ?? null,
                'latitude' => $payload['latitude'] ?? null,
                'longitude' => $payload['longitude'] ?? null,
            ],
            'raw' => $payload,
        ];
    }
}
