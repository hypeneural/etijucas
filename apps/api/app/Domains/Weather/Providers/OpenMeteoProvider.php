<?php

declare(strict_types=1);

namespace App\Domains\Weather\Providers;

use App\Domains\Weather\Contracts\WeatherOptions;
use App\Domains\Weather\Contracts\WeatherProviderInterface;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;

class OpenMeteoProvider implements WeatherProviderInterface
{
    private const FORECAST_API = 'https://api.open-meteo.com/v1/forecast';
    private const MARINE_API = 'https://marine-api.open-meteo.com/v1/marine';

    public function __construct(
        private readonly int $timeoutSeconds = 15,
        private readonly int $retryTimes = 2,
        private readonly int $retrySleepMs = 200,
    ) {
    }

    public function name(): string
    {
        return 'open_meteo';
    }

    public function capabilities(): array
    {
        return [
            'hasMarine' => true,
            'supportsTimezone' => true,
            'maxDays' => 16,
        ];
    }

    public function forecast(float $lat, float $lon, WeatherOptions $options): array
    {
        $unitConfig = $this->resolveUnits($options->units);

        $response = Http::retry($this->retryTimes, $this->retrySleepMs, throw: false)
            ->timeout($this->timeoutSeconds)
            ->get(self::FORECAST_API, [
                'latitude' => $lat,
                'longitude' => $lon,
                'timezone' => $options->timezone,
                'forecast_days' => $options->forecastDays,
                'temperature_unit' => $unitConfig['temperature'],
                'wind_speed_unit' => $unitConfig['windSpeed'],
                'precipitation_unit' => $unitConfig['precipitation'],
                'models' => $options->model ?? 'best_match',
                'current' => implode(',', [
                    'temperature_2m',
                    'apparent_temperature',
                    'precipitation',
                    'weather_code',
                    'is_day',
                    'relative_humidity_2m',
                    'wind_speed_10m',
                    'wind_direction_10m',
                    'wind_gusts_10m',
                    'cloud_cover',
                ]),
                'hourly' => implode(',', [
                    'temperature_2m',
                    'apparent_temperature',
                    'precipitation_probability',
                    'precipitation',
                    'rain',
                    'showers',
                    'weather_code',
                    'relative_humidity_2m',
                    'wind_speed_10m',
                    'wind_gusts_10m',
                    'wind_direction_10m',
                    'uv_index',
                    'cloud_cover',
                ]),
                'daily' => implode(',', [
                    'weather_code',
                    'temperature_2m_max',
                    'temperature_2m_min',
                    'precipitation_sum',
                    'precipitation_probability_max',
                    'wind_speed_10m_max',
                    'wind_gusts_10m_max',
                    'wind_direction_10m_dominant',
                    'sunrise',
                    'sunset',
                    'uv_index_max',
                ]),
            ]);

        if (!$response->successful()) {
            throw new RequestException($response);
        }

        return (array) $response->json();
    }

    public function marine(float $lat, float $lon, WeatherOptions $options): array
    {
        $response = Http::retry($this->retryTimes, $this->retrySleepMs, throw: false)
            ->timeout($this->timeoutSeconds)
            ->get(self::MARINE_API, [
                'latitude' => $lat,
                'longitude' => $lon,
                'timezone' => $options->timezone,
                'forecast_days' => min($options->forecastDays, 10),
                'cell_selection' => 'sea',
                'hourly' => implode(',', [
                    'wave_height',
                    'wave_direction',
                    'wave_period',
                    'swell_wave_height',
                    'swell_wave_direction',
                    'swell_wave_period',
                    'wind_wave_height',
                    'wind_wave_direction',
                    'wind_wave_period',
                    'sea_surface_temperature',
                    'ocean_current_velocity',
                    'ocean_current_direction',
                ]),
                'daily' => implode(',', [
                    'wave_height_max',
                    'wave_direction_dominant',
                    'wave_period_max',
                    'swell_wave_height_max',
                    'swell_wave_direction_dominant',
                    'swell_wave_period_max',
                ]),
            ]);

        if (!$response->successful()) {
            throw new RequestException($response);
        }

        return (array) $response->json();
    }

    /**
     * @return array{temperature:string,windSpeed:string,precipitation:string}
     */
    private function resolveUnits(string $units): array
    {
        if ($units === 'imperial') {
            return [
                'temperature' => 'fahrenheit',
                'windSpeed' => 'mph',
                'precipitation' => 'inch',
            ];
        }

        return [
            'temperature' => 'celsius',
            'windSpeed' => 'kmh',
            'precipitation' => 'mm',
        ];
    }
}
