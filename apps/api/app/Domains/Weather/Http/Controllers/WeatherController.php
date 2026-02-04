<?php

declare(strict_types=1);

namespace App\Domains\Weather\Http\Controllers;

use App\Domains\Weather\Services\OpenMeteoService;
use App\Domains\Weather\Services\WeatherInsightsService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class WeatherController extends Controller
{
    public function __construct(
        private OpenMeteoService $weatherService,
        private WeatherInsightsService $insightsService
    ) {
    }

    /**
     * GET /api/v1/weather/home
     * Lightweight endpoint for home card
     */
    public function home(Request $request): JsonResponse|Response
    {
        $hours = min((int) $request->input('hours', 8), 24);
        $includes = $request->input('include', ['location', 'cache', 'current', 'today', 'next_hours', 'marine_preview']);

        if (is_string($includes)) {
            $includes = explode(',', $includes);
        }

        try {
            $allData = $this->weatherService->getAll();
            $weather = $allData['weather'];
            $marine = $allData['marine'];

            // Check ETag
            $combinedEtag = md5(($weather['etag'] ?? '') . ($marine['etag'] ?? ''));
            if ($request->header('If-None-Match') === "\"{$combinedEtag}\"") {
                return response()->noContent(304);
            }

            $response = [];

            // Location
            if (in_array('location', $includes)) {
                $response['location'] = OpenMeteoService::getLocation();
            }

            // Cache meta
            if (in_array('cache', $includes)) {
                $response['cache'] = [
                    'provider' => 'open_meteo',
                    'cached' => $weather['cached'],
                    'stale' => $weather['stale'] || $marine['stale'],
                    'fetched_at' => $weather['fetched_at'],
                    'expires_at' => $weather['expires_at'],
                ];
            }

            // Current conditions
            if (in_array('current', $includes) && isset($weather['data']['current'])) {
                $current = $weather['data']['current'];
                $response['current'] = [
                    'temp_c' => $current['temperature_2m'] ?? null,
                    'feels_like_c' => $current['apparent_temperature'] ?? null,
                    'weather_code' => $current['weather_code'] ?? 0,
                    'description' => $this->getWeatherDescription($current['weather_code'] ?? 0),
                    'precipitation_mm' => $current['precipitation'] ?? 0,
                    'wind_kmh' => $current['wind_speed_10m'] ?? 0,
                    'gust_kmh' => $current['wind_gusts_10m'] ?? 0,
                    'wind_dir_deg' => $current['wind_direction_10m'] ?? 0,
                    'cloud_cover_pct' => $current['cloud_cover'] ?? 0,
                ];
            }

            // Today summary
            if (in_array('today', $includes) && isset($weather['data']['daily'])) {
                $daily = $weather['data']['daily'];
                $response['today'] = [
                    'min_c' => $daily['temperature_2m_min'][0] ?? null,
                    'max_c' => $daily['temperature_2m_max'][0] ?? null,
                    'rain_prob_max_pct' => $daily['precipitation_probability_max'][0] ?? 0,
                    'sunrise' => $daily['sunrise'][0] ?? null,
                    'sunset' => $daily['sunset'][0] ?? null,
                ];
            }

            // Next hours
            if (in_array('next_hours', $includes) && isset($weather['data']['hourly'])) {
                $hourly = $weather['data']['hourly'];
                $now = now();
                $nextHours = [];

                $times = $hourly['time'] ?? [];
                for ($i = 0; $i < min(count($times), 240); $i++) {
                    $time = \Carbon\Carbon::parse($times[$i]);
                    if ($time->gte($now) && count($nextHours) < $hours) {
                        $nextHours[] = [
                            't' => $time->toIso8601String(),
                            'temp_c' => $hourly['temperature_2m'][$i] ?? null,
                            'rain_prob_pct' => $hourly['precipitation_probability'][$i] ?? 0,
                            'precipitation_mm' => $hourly['precipitation'][$i] ?? 0,
                            'weather_code' => $hourly['weather_code'][$i] ?? 0,
                            'wind_kmh' => $hourly['wind_speed_10m'][$i] ?? 0,
                        ];
                    }
                }

                $response['next_hours'] = $nextHours;
            }

            // Marine preview
            if (in_array('marine_preview', $includes) && isset($marine['data']['hourly'])) {
                $hourlyMarine = $marine['data']['hourly'];
                $now = now();

                // Find current hour index
                $currentIdx = 0;
                $times = $hourlyMarine['time'] ?? [];
                foreach ($times as $idx => $time) {
                    if (\Carbon\Carbon::parse($time)->gte($now)) {
                        $currentIdx = $idx;
                        break;
                    }
                }

                $response['marine_preview'] = [
                    'wave_m' => $hourlyMarine['wave_height'][$currentIdx] ?? 0,
                    'wave_period_s' => $hourlyMarine['wave_period'][$currentIdx] ?? 0,
                    'wave_dir_deg' => $hourlyMarine['wave_direction'][$currentIdx] ?? 0,
                    'sea_temp_c' => $hourlyMarine['sea_surface_temperature'][$currentIdx] ?? null,
                ];
            }

            return response()->json($response)
                ->header('ETag', "\"{$combinedEtag}\"")
                ->header('Cache-Control', 'public, max-age=60')
                ->header('X-Cache', ($weather['cached'] ? 'HIT' : 'MISS') . '; stale=' . ($weather['stale'] ? 'true' : 'false'));

        } catch (\Throwable $e) {
            \Log::error('[WeatherController] home failed', ['error' => $e->getMessage()]);

            return response()->json([
                'error' => 'UPSTREAM_FAILURE',
                'message' => 'Não foi possível obter dados do tempo agora.',
                'status' => 502,
            ], 502);
        }
    }

    /**
     * GET /api/v1/weather/forecast
     * Full weather forecast (land)
     */
    public function forecast(Request $request): JsonResponse|Response
    {
        $days = min((int) $request->input('days', 10), 16);
        $hours = min((int) $request->input('hours', 72), 240);
        $includes = $request->input('include', ['location', 'cache', 'current', 'hourly', 'daily']);

        if (is_string($includes)) {
            $includes = explode(',', $includes);
        }

        try {
            $weather = $this->weatherService->getWeather();

            // Check ETag
            if ($request->header('If-None-Match') === "\"{$weather['etag']}\"") {
                return response()->noContent(304);
            }

            $response = [];

            // Location
            if (in_array('location', $includes)) {
                $response['location'] = OpenMeteoService::getLocation();
            }

            // Cache meta
            if (in_array('cache', $includes)) {
                $response['cache'] = [
                    'provider' => 'open_meteo',
                    'cached' => $weather['cached'],
                    'stale' => $weather['stale'],
                    'fetched_at' => $weather['fetched_at'],
                    'expires_at' => $weather['expires_at'],
                ];
            }

            // Current
            if (in_array('current', $includes) && isset($weather['data']['current'])) {
                $current = $weather['data']['current'];
                $response['current'] = [
                    'temp_c' => $current['temperature_2m'] ?? null,
                    'feels_like_c' => $current['apparent_temperature'] ?? null,
                    'weather_code' => $current['weather_code'] ?? 0,
                    'description' => $this->getWeatherDescription($current['weather_code'] ?? 0),
                    'precipitation_mm' => $current['precipitation'] ?? 0,
                    'wind_kmh' => $current['wind_speed_10m'] ?? 0,
                    'gust_kmh' => $current['wind_gusts_10m'] ?? 0,
                    'wind_dir_deg' => $current['wind_direction_10m'] ?? 0,
                    'cloud_cover_pct' => $current['cloud_cover'] ?? 0,
                ];
            }

            // Hourly
            if (in_array('hourly', $includes) && isset($weather['data']['hourly'])) {
                $hourly = $weather['data']['hourly'];
                $now = now();
                $hourlyData = [];

                $times = $hourly['time'] ?? [];
                for ($i = 0; $i < min(count($times), 240); $i++) {
                    $time = \Carbon\Carbon::parse($times[$i]);
                    if ($time->gte($now) && count($hourlyData) < $hours) {
                        $hourlyData[] = [
                            't' => $time->toIso8601String(),
                            'temp_c' => $hourly['temperature_2m'][$i] ?? null,
                            'rain_prob_pct' => $hourly['precipitation_probability'][$i] ?? 0,
                            'precipitation_mm' => $hourly['precipitation'][$i] ?? 0,
                            'weather_code' => $hourly['weather_code'][$i] ?? 0,
                            'wind_kmh' => $hourly['wind_speed_10m'][$i] ?? 0,
                            'gust_kmh' => $hourly['wind_gusts_10m'][$i] ?? 0,
                            'wind_dir_deg' => $hourly['wind_direction_10m'][$i] ?? 0,
                            'uv_index' => $hourly['uv_index'][$i] ?? 0,
                            'cloud_cover_pct' => $hourly['cloud_cover'][$i] ?? 0,
                        ];
                    }
                }

                $response['hourly'] = $hourlyData;
            }

            // Daily
            if (in_array('daily', $includes) && isset($weather['data']['daily'])) {
                $daily = $weather['data']['daily'];
                $dailyData = [];

                $dates = $daily['time'] ?? [];
                for ($i = 0; $i < min(count($dates), $days); $i++) {
                    $dailyData[] = [
                        'date' => $dates[$i],
                        'weather_code' => $daily['weather_code'][$i] ?? 0,
                        'description' => $this->getWeatherDescription($daily['weather_code'][$i] ?? 0),
                        'min_c' => $daily['temperature_2m_min'][$i] ?? null,
                        'max_c' => $daily['temperature_2m_max'][$i] ?? null,
                        'precipitation_sum_mm' => $daily['precipitation_sum'][$i] ?? 0,
                        'rain_prob_max_pct' => $daily['precipitation_probability_max'][$i] ?? 0,
                        'wind_max_kmh' => $daily['wind_speed_10m_max'][$i] ?? 0,
                        'gust_max_kmh' => $daily['wind_gusts_10m_max'][$i] ?? 0,
                        'wind_dir_dominant_deg' => $daily['wind_direction_10m_dominant'][$i] ?? 0,
                        'sunrise' => $daily['sunrise'][$i] ?? null,
                        'sunset' => $daily['sunset'][$i] ?? null,
                        'uv_max' => $daily['uv_index_max'][$i] ?? 0,
                    ];
                }

                $response['daily'] = $dailyData;
            }

            // Icon hints
            $response['icon_hints'] = $this->getIconHints();

            return response()->json($response)
                ->header('ETag', "\"{$weather['etag']}\"")
                ->header('Cache-Control', 'public, max-age=60')
                ->header('X-Cache', ($weather['cached'] ? 'HIT' : 'MISS') . '; stale=' . ($weather['stale'] ? 'true' : 'false'));

        } catch (\Throwable $e) {
            \Log::error('[WeatherController] forecast failed', ['error' => $e->getMessage()]);

            return response()->json([
                'error' => 'UPSTREAM_FAILURE',
                'message' => 'Não foi possível obter dados do tempo agora.',
                'status' => 502,
            ], 502);
        }
    }

    /**
     * GET /api/v1/weather/marine
     * Marine forecast (waves, currents, sea temp)
     */
    public function marine(Request $request): JsonResponse|Response
    {
        $days = min((int) $request->input('days', 10), 16);
        $hours = min((int) $request->input('hours', 72), 240);
        $includes = $request->input('include', ['location', 'cache', 'hourly', 'daily']);

        if (is_string($includes)) {
            $includes = explode(',', $includes);
        }

        try {
            $marine = $this->weatherService->getMarine();

            // Check ETag
            if ($request->header('If-None-Match') === "\"{$marine['etag']}\"") {
                return response()->noContent(304);
            }

            $response = [];

            // Location
            if (in_array('location', $includes)) {
                $response['location'] = OpenMeteoService::getLocation();
            }

            // Cache meta
            if (in_array('cache', $includes)) {
                $response['cache'] = [
                    'provider' => 'open_meteo',
                    'cached' => $marine['cached'],
                    'stale' => $marine['stale'],
                    'fetched_at' => $marine['fetched_at'],
                    'expires_at' => $marine['expires_at'],
                ];
            }

            // Hourly
            if (in_array('hourly', $includes) && isset($marine['data']['hourly'])) {
                $hourly = $marine['data']['hourly'];
                $now = now();
                $hourlyData = [];

                $times = $hourly['time'] ?? [];
                for ($i = 0; $i < min(count($times), 240); $i++) {
                    $time = \Carbon\Carbon::parse($times[$i]);
                    if ($time->gte($now) && count($hourlyData) < $hours) {
                        $hourlyData[] = [
                            't' => $time->toIso8601String(),
                            'wave_m' => $hourly['wave_height'][$i] ?? 0,
                            'wave_period_s' => $hourly['wave_period'][$i] ?? 0,
                            'wave_dir_deg' => $hourly['wave_direction'][$i] ?? 0,
                            'swell_m' => $hourly['swell_wave_height'][$i] ?? 0,
                            'swell_period_s' => $hourly['swell_wave_period'][$i] ?? 0,
                            'swell_dir_deg' => $hourly['swell_wave_direction'][$i] ?? 0,
                            'wind_wave_m' => $hourly['wind_wave_height'][$i] ?? 0,
                            'wind_wave_period_s' => $hourly['wind_wave_period'][$i] ?? 0,
                            'wind_wave_dir_deg' => $hourly['wind_wave_direction'][$i] ?? 0,
                            'sea_temp_c' => $hourly['sea_surface_temperature'][$i] ?? null,
                            'current_ms' => $hourly['ocean_current_velocity'][$i] ?? 0,
                            'current_dir_deg' => $hourly['ocean_current_direction'][$i] ?? 0,
                        ];
                    }
                }

                $response['hourly'] = $hourlyData;
            }

            // Daily
            if (in_array('daily', $includes) && isset($marine['data']['daily'])) {
                $daily = $marine['data']['daily'];
                $dailyData = [];

                $dates = $daily['time'] ?? [];
                for ($i = 0; $i < min(count($dates), $days); $i++) {
                    $dailyData[] = [
                        'date' => $dates[$i],
                        'wave_max_m' => $daily['wave_height_max'][$i] ?? 0,
                        'wave_period_max_s' => $daily['wave_period_max'][$i] ?? 0,
                        'wave_dir_dominant_deg' => $daily['wave_direction_dominant'][$i] ?? 0,
                        'swell_max_m' => $daily['swell_wave_height_max'][$i] ?? 0,
                        'swell_period_max_s' => $daily['swell_wave_period_max'][$i] ?? 0,
                        'swell_dir_dominant_deg' => $daily['swell_wave_direction_dominant'][$i] ?? 0,
                    ];
                }

                $response['daily'] = $dailyData;
            }

            // Icon hints
            $response['icon_hints'] = [
                'wave' => 'mdi:waves',
                'swell' => 'mdi:wave',
                'current' => 'mdi:current-ac',
                'temperature' => 'mdi:thermometer',
            ];

            return response()->json($response)
                ->header('ETag', "\"{$marine['etag']}\"")
                ->header('Cache-Control', 'public, max-age=60')
                ->header('X-Cache', ($marine['cached'] ? 'HIT' : 'MISS') . '; stale=' . ($marine['stale'] ? 'true' : 'false'));

        } catch (\Throwable $e) {
            \Log::error('[WeatherController] marine failed', ['error' => $e->getMessage()]);

            return response()->json([
                'error' => 'UPSTREAM_FAILURE',
                'message' => 'Não foi possível obter dados do mar agora.',
                'status' => 502,
            ], 502);
        }
    }

    /**
     * GET /api/v1/weather/insights
     * Human-readable insights: "vai chover?", "dá praia?", etc
     */
    public function insights(Request $request): JsonResponse
    {
        try {
            $allData = $this->weatherService->getAll();
            $weather = $allData['weather'];
            $marine = $allData['marine'];

            $insights = $this->insightsService->generateInsights($weather, $marine);

            return response()->json([
                'location' => OpenMeteoService::getLocation(),
                'cache' => [
                    'fetched_at' => $weather['fetched_at'],
                    'stale' => $weather['stale'] || $marine['stale'],
                ],
                'insights' => $insights,
            ]);

        } catch (\Throwable $e) {
            \Log::error('[WeatherController] insights failed', ['error' => $e->getMessage()]);

            return response()->json([
                'error' => 'UPSTREAM_FAILURE',
                'message' => 'Não foi possível gerar insights agora.',
                'status' => 502,
            ], 502);
        }
    }

    /**
     * GET /api/v1/weather/preset/{type}
     * Activity-specific forecasts: going_out, beach, fishing, hiking
     */
    public function preset(Request $request, string $type): JsonResponse
    {
        $validPresets = ['going_out', 'beach', 'fishing', 'hiking'];

        if (!in_array($type, $validPresets)) {
            return response()->json([
                'error' => 'INVALID_PRESET',
                'message' => 'Preset inválido. Use: ' . implode(', ', $validPresets),
                'status' => 400,
            ], 400);
        }

        try {
            $allData = $this->weatherService->getAll();
            $weather = $allData['weather'];
            $marine = $allData['marine'];

            $preset = $this->insightsService->generatePreset($type, $weather, $marine);

            return response()->json([
                'location' => OpenMeteoService::getLocation(),
                'cache' => [
                    'fetched_at' => $weather['fetched_at'],
                    'stale' => $weather['stale'] || $marine['stale'],
                ],
                'preset' => $preset,
            ]);

        } catch (\Throwable $e) {
            \Log::error('[WeatherController] preset failed', ['error' => $e->getMessage(), 'type' => $type]);

            return response()->json([
                'error' => 'UPSTREAM_FAILURE',
                'message' => 'Não foi possível gerar preset agora.',
                'status' => 502,
            ], 502);
        }
    }

    /**
     * Get weather description in Portuguese
     */
    private function getWeatherDescription(int $code): string
    {
        return match ($code) {
            0 => 'Céu limpo',
            1 => 'Predominantemente limpo',
            2 => 'Parcialmente nublado',
            3 => 'Nublado',
            45, 48 => 'Neblina',
            51, 53, 55 => 'Garoa',
            56, 57 => 'Garoa congelante',
            61, 63, 65 => 'Chuva',
            66, 67 => 'Chuva congelante',
            71, 73, 75 => 'Neve',
            77 => 'Grãos de neve',
            80, 81, 82 => 'Pancadas de chuva',
            85, 86 => 'Pancadas de neve',
            95 => 'Tempestade',
            96, 99 => 'Tempestade com granizo',
            default => 'Desconhecido',
        };
    }

    /**
     * Get icon hints for weather codes
     */
    private function getIconHints(): array
    {
        return [
            '0' => 'mdi:weather-sunny',
            '1' => 'mdi:weather-sunny',
            '2' => 'mdi:weather-partly-cloudy',
            '3' => 'mdi:weather-cloudy',
            '45' => 'mdi:weather-fog',
            '48' => 'mdi:weather-fog',
            '51' => 'mdi:weather-rainy',
            '53' => 'mdi:weather-rainy',
            '55' => 'mdi:weather-rainy',
            '61' => 'mdi:weather-rainy',
            '63' => 'mdi:weather-pouring',
            '65' => 'mdi:weather-pouring',
            '80' => 'mdi:weather-pouring',
            '81' => 'mdi:weather-pouring',
            '82' => 'mdi:weather-pouring',
            '95' => 'mdi:weather-lightning-rainy',
            '96' => 'mdi:weather-lightning-rainy',
            '99' => 'mdi:weather-lightning-rainy',
        ];
    }
}
