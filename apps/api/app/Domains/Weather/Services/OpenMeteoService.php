<?php

declare(strict_types=1);

namespace App\Domains\Weather\Services;

use App\Domains\Weather\Models\ExternalApiCache;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenMeteoService
{
    // Tijucas/SC fixed coordinates
    private const LAT = -27.2414;
    private const LON = -48.6336;
    private const TIMEZONE = 'America/Sao_Paulo';
    private const CACHE_TTL_HOURS = 6;

    // API URLs
    private const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
    private const MARINE_API = 'https://marine-api.open-meteo.com/v1/marine';

    // Cache keys
    private const CACHE_KEY_WEATHER = 'weather:tijucas:v1';
    private const CACHE_KEY_MARINE = 'marine:tijucas:v1';

    /**
     * Get weather data (with cache)
     */
    public function getWeather(bool $forceRefresh = false): array
    {
        return $this->getCachedOrFetch(
            self::CACHE_KEY_WEATHER,
            fn() => $this->fetchWeatherFromApi(),
            $forceRefresh
        );
    }

    /**
     * Get marine data (with cache)
     */
    public function getMarine(bool $forceRefresh = false): array
    {
        return $this->getCachedOrFetch(
            self::CACHE_KEY_MARINE,
            fn() => $this->fetchMarineFromApi(),
            $forceRefresh
        );
    }

    /**
     * Get both weather and marine (for home endpoint)
     */
    public function getAll(bool $forceRefresh = false): array
    {
        return [
            'weather' => $this->getWeather($forceRefresh),
            'marine' => $this->getMarine($forceRefresh),
        ];
    }

    /**
     * Generic cache-or-fetch logic with anti-stampede lock
     */
    private function getCachedOrFetch(string $key, callable $fetchFn, bool $forceRefresh): array
    {
        // Check existing cache
        $cached = ExternalApiCache::getByKey($key);

        // Return valid cache if not forcing refresh
        if (!$forceRefresh && $cached?->isValid()) {
            return [
                'data' => $cached->payload,
                'cached' => true,
                'stale' => false,
                'fetched_at' => $cached->fetched_at->toIso8601String(),
                'expires_at' => $cached->expires_at->toIso8601String(),
                'etag' => $cached->payload_hash,
            ];
        }

        // Need to refresh - use lock to prevent stampede
        $lockKey = "lock:{$key}";
        $lock = Cache::lock($lockKey, 30); // 30 second timeout

        try {
            if ($lock->get()) {
                // We got the lock, fetch fresh data
                $freshData = $fetchFn();

                if ($freshData !== null) {
                    $now = now();
                    $hash = hash('sha256', json_encode($freshData));

                    ExternalApiCache::updateOrCreate(
                        ['key' => $key],
                        [
                            'provider' => 'open_meteo',
                            'lat' => self::LAT,
                            'lon' => self::LON,
                            'timezone' => self::TIMEZONE,
                            'payload' => $freshData,
                            'payload_hash' => $hash,
                            'fetched_at' => $now,
                            'expires_at' => $now->copy()->addHours(self::CACHE_TTL_HOURS),
                            'last_error' => null,
                        ]
                    );

                    return [
                        'data' => $freshData,
                        'cached' => false,
                        'stale' => false,
                        'fetched_at' => $now->toIso8601String(),
                        'expires_at' => $now->copy()->addHours(self::CACHE_TTL_HOURS)->toIso8601String(),
                        'etag' => $hash,
                    ];
                }

                // Fetch failed, return stale cache if available
                if ($cached) {
                    return [
                        'data' => $cached->payload,
                        'cached' => true,
                        'stale' => true,
                        'fetched_at' => $cached->fetched_at->toIso8601String(),
                        'expires_at' => $cached->expires_at->toIso8601String(),
                        'etag' => $cached->payload_hash,
                    ];
                }

                throw new \RuntimeException("Failed to fetch data and no cache available for {$key}");
            } else {
                // Couldn't get lock, someone else is refreshing
                // Wait a bit and return whatever cache we have
                sleep(1);
                $cached = ExternalApiCache::getByKey($key);

                if ($cached) {
                    return [
                        'data' => $cached->payload,
                        'cached' => true,
                        'stale' => $cached->isStale(),
                        'fetched_at' => $cached->fetched_at->toIso8601String(),
                        'expires_at' => $cached->expires_at->toIso8601String(),
                        'etag' => $cached->payload_hash,
                    ];
                }

                throw new \RuntimeException("Cache not available and refresh in progress for {$key}");
            }
        } finally {
            $lock->release();
        }
    }

    /**
     * Fetch weather data from Open-Meteo Weather API
     */
    private function fetchWeatherFromApi(): ?array
    {
        try {
            $response = Http::timeout(15)->get(self::WEATHER_API, [
                'latitude' => self::LAT,
                'longitude' => self::LON,
                'timezone' => self::TIMEZONE,
                'forecast_days' => 10,
                'temperature_unit' => 'celsius',
                'wind_speed_unit' => 'kmh',
                'precipitation_unit' => 'mm',
                'models' => 'best_match',
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

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('[OpenMeteoService] Weather API failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (\Throwable $e) {
            Log::error('[OpenMeteoService] Weather API exception', [
                'error' => $e->getMessage(),
            ]);

            // Update last_error in cache
            ExternalApiCache::where('key', self::CACHE_KEY_WEATHER)
                ->update(['last_error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * Fetch marine data from Open-Meteo Marine API
     */
    private function fetchMarineFromApi(): ?array
    {
        try {
            $response = Http::timeout(15)->get(self::MARINE_API, [
                'latitude' => self::LAT,
                'longitude' => self::LON,
                'timezone' => self::TIMEZONE,
                'forecast_days' => 8,
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

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('[OpenMeteoService] Marine API failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (\Throwable $e) {
            Log::error('[OpenMeteoService] Marine API exception', [
                'error' => $e->getMessage(),
            ]);

            // Update last_error in cache
            ExternalApiCache::where('key', self::CACHE_KEY_MARINE)
                ->update(['last_error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * Get location info (fixed for Tijucas)
     */
    public static function getLocation(): array
    {
        return [
            'key' => 'tijucas_sc',
            'name' => 'Tijucas/SC',
            'lat' => self::LAT,
            'lon' => self::LON,
            'timezone' => self::TIMEZONE,
        ];
    }
}
