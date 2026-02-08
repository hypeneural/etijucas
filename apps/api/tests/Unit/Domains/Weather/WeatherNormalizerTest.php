<?php

namespace Tests\Unit\Domains\Weather;

use App\Domains\Weather\Support\WeatherNormalizer;
use Tests\TestCase;

class WeatherNormalizerTest extends TestCase
{
    public function test_normalize_forecast_extracts_sections_and_meta(): void
    {
        $normalizer = new WeatherNormalizer();

        $payload = [
            'timezone' => 'America/Sao_Paulo',
            'elevation' => 42,
            'latitude' => -27.24,
            'longitude' => -48.63,
            'current' => ['temperature_2m' => 25],
            'hourly' => ['time' => ['2026-02-08T12:00']],
            'daily' => ['time' => ['2026-02-08']],
        ];

        $normalized = $normalizer->normalizeForecast($payload);

        $this->assertSame(25, $normalized['current']['temperature_2m']);
        $this->assertSame('America/Sao_Paulo', $normalized['meta']['timezone']);
        $this->assertSame($payload, $normalized['raw']);
    }

    public function test_normalize_marine_extracts_sections_and_meta(): void
    {
        $normalizer = new WeatherNormalizer();

        $payload = [
            'timezone' => 'America/Sao_Paulo',
            'latitude' => -27.24,
            'longitude' => -48.63,
            'hourly' => ['wave_height' => [1.1]],
            'daily' => ['wave_height_max' => [1.8]],
        ];

        $normalized = $normalizer->normalizeMarine($payload);

        $this->assertSame([1.1], $normalized['hourly']['wave_height']);
        $this->assertSame([1.8], $normalized['daily']['wave_height_max']);
        $this->assertSame('America/Sao_Paulo', $normalized['meta']['timezone']);
    }
}
