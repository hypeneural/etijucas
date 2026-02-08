<?php

declare(strict_types=1);

namespace App\Domains\Weather\Http\Controllers;

use App\Domains\Weather\Contracts\WeatherOptions;
use App\Domains\Weather\Services\WeatherInsightsService;
use App\Domains\Weather\Services\WeatherServiceV2;
use App\Http\Controllers\Controller;
use App\Models\City;
use App\Support\Tenant;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Throwable;

class WeatherController extends Controller
{
    public function __construct(
        private WeatherServiceV2 $weatherService,
        private WeatherInsightsService $insightsService
    ) {
    }

    /**
     * GET /api/v1/weather/home
     * Lightweight endpoint for home card.
     */
    public function home(Request $request): JsonResponse|Response
    {
        $city = $this->tenantCity();
        if (!$city) {
            return $this->tenantRequired();
        }

        $hours = min(max((int) $request->input('hours', 8), 1), 24);
        $includes = $this->requestedInclude($request, ['location', 'cache', 'current', 'today', 'next_hours', 'marine_preview']);

        try {
            $options = $this->weatherOptions(
                $city,
                (int) $request->input('days', 2),
                (string) $request->input('units', 'metric')
            );

            $forecastEnvelope = $this->weatherService->getSection($city, $options, 'forecast');
            $forecastData = $this->envelopeData($forecastEnvelope);
            $forecastCache = $this->envelopeCache($forecastEnvelope);

            $marineData = [];
            $marineCache = [];
            if ((bool) ($city->is_coastal ?? false)) {
                $marineEnvelope = $this->weatherService->getSection($city, $options, 'marine');
                $marineData = $this->envelopeData($marineEnvelope);
                $marineCache = $this->envelopeCache($marineEnvelope);
            }

            $combinedEtag = md5(
                (string) ($forecastCache['etag'] ?? '') .
                (string) ($marineCache['etag'] ?? '')
            );

            if ($request->header('If-None-Match') === "\"{$combinedEtag}\"") {
                return response()->noContent(304);
            }

            $response = [];

            if (in_array('location', $includes, true)) {
                $response['location'] = $this->locationPayload($city);
            }

            if (in_array('cache', $includes, true)) {
                $response['cache'] = [
                    'provider' => $this->weatherService->providerName(),
                    'cached' => (bool) ($forecastCache['cached'] ?? false),
                    'stale' => (bool) (($forecastCache['stale'] ?? false) || ($marineCache['stale'] ?? false)),
                    'fetched_at' => (string) ($forecastCache['generated_at_utc'] ?? CarbonImmutable::now('UTC')->toIso8601String()),
                    'expires_at' => (string) ($forecastCache['expires_at_utc'] ?? CarbonImmutable::now('UTC')->toIso8601String()),
                ];
            }

            if (in_array('current', $includes, true)) {
                $response['current'] = $this->mapCurrent((array) ($forecastData['current'] ?? []));
            }

            if (in_array('today', $includes, true)) {
                $today = $this->mapToday((array) ($forecastData['daily'] ?? []));
                if ($today !== null) {
                    $response['today'] = $today;
                }
            }

            if (in_array('next_hours', $includes, true)) {
                $response['next_hours'] = $this->mapForecastHourly(
                    (array) ($forecastData['hourly'] ?? []),
                    $this->timezone($city),
                    $hours
                );
            }

            if (
                in_array('marine_preview', $includes, true) &&
                (bool) ($city->is_coastal ?? false)
            ) {
                $marinePreview = $this->mapMarinePreview(
                    (array) ($marineData['hourly'] ?? []),
                    $this->timezone($city)
                );

                if ($marinePreview !== null) {
                    $response['marine_preview'] = $marinePreview;
                }
            }

            return response()
                ->json($response)
                ->header('ETag', "\"{$combinedEtag}\"")
                ->header('Cache-Control', 'public, max-age=60')
                ->header(
                    'X-Cache',
                    $this->cacheHeaderStatus($forecastCache)
                );
        } catch (Throwable $error) {
            \Log::error('[WeatherController] home failed', ['error' => $error->getMessage()]);

            return response()->json([
                'error' => 'UPSTREAM_FAILURE',
                'message' => 'Nao foi possivel obter dados do tempo agora.',
                'status' => 502,
            ], 502);
        }
    }

    /**
     * GET /api/v1/weather/forecast
     * Full weather forecast (land).
     */
    public function forecast(Request $request): JsonResponse|Response
    {
        $city = $this->tenantCity();
        if (!$city) {
            return $this->tenantRequired();
        }

        $days = min(max((int) $request->input('days', 10), 1), 16);
        $hours = min(max((int) $request->input('hours', 72), 1), 240);
        $includes = $this->requestedInclude($request, ['location', 'cache', 'current', 'hourly', 'daily']);

        try {
            $options = $this->weatherOptions($city, $days, (string) $request->input('units', 'metric'));
            $forecastEnvelope = $this->weatherService->getSection($city, $options, 'forecast');
            $forecastData = $this->envelopeData($forecastEnvelope);
            $forecastCache = $this->envelopeCache($forecastEnvelope);
            $etag = (string) ($forecastCache['etag'] ?? md5(json_encode($forecastData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: ''));

            if ($request->header('If-None-Match') === "\"{$etag}\"") {
                return response()->noContent(304);
            }

            $response = [];

            if (in_array('location', $includes, true)) {
                $response['location'] = $this->locationPayload($city);
            }

            if (in_array('cache', $includes, true)) {
                $response['cache'] = [
                    'provider' => $this->weatherService->providerName(),
                    'cached' => (bool) ($forecastCache['cached'] ?? false),
                    'stale' => (bool) ($forecastCache['stale'] ?? false),
                    'fetched_at' => (string) ($forecastCache['generated_at_utc'] ?? CarbonImmutable::now('UTC')->toIso8601String()),
                    'expires_at' => (string) ($forecastCache['expires_at_utc'] ?? CarbonImmutable::now('UTC')->toIso8601String()),
                ];
            }

            if (in_array('current', $includes, true)) {
                $response['current'] = $this->mapCurrent((array) ($forecastData['current'] ?? []));
            }

            if (in_array('hourly', $includes, true)) {
                $response['hourly'] = $this->mapForecastHourly(
                    (array) ($forecastData['hourly'] ?? []),
                    $this->timezone($city),
                    $hours
                );
            }

            if (in_array('daily', $includes, true)) {
                $response['daily'] = $this->mapForecastDaily((array) ($forecastData['daily'] ?? []), $days);
            }

            $response['icon_hints'] = $this->getIconHints();

            return response()
                ->json($response)
                ->header('ETag', "\"{$etag}\"")
                ->header('Cache-Control', 'public, max-age=60')
                ->header(
                    'X-Cache',
                    $this->cacheHeaderStatus($forecastCache)
                );
        } catch (Throwable $error) {
            \Log::error('[WeatherController] forecast failed', ['error' => $error->getMessage()]);

            return response()->json([
                'error' => 'UPSTREAM_FAILURE',
                'message' => 'Nao foi possivel obter dados do tempo agora.',
                'status' => 502,
            ], 502);
        }
    }

    /**
     * GET /api/v1/weather/marine
     * Marine forecast (waves, currents, sea temp).
     */
    public function marine(Request $request): JsonResponse|Response
    {
        $city = $this->tenantCity();
        if (!$city) {
            return $this->tenantRequired();
        }

        $days = min(max((int) $request->input('days', 10), 1), 16);
        $hours = min(max((int) $request->input('hours', 72), 1), 240);
        $includes = $this->requestedInclude($request, ['location', 'cache', 'hourly', 'daily']);

        try {
            $response = [];
            $cacheMeta = [
                'provider' => $this->weatherService->providerName(),
                'cached' => true,
                'stale' => false,
                'fetched_at' => CarbonImmutable::now('UTC')->toIso8601String(),
                'expires_at' => CarbonImmutable::now('UTC')->addMinutes(10)->toIso8601String(),
            ];

            if (in_array('location', $includes, true)) {
                $response['location'] = $this->locationPayload($city);
            }

            if (!(bool) ($city->is_coastal ?? false)) {
                if (in_array('cache', $includes, true)) {
                    $response['cache'] = $cacheMeta;
                }
                if (in_array('hourly', $includes, true)) {
                    $response['hourly'] = [];
                }
                if (in_array('daily', $includes, true)) {
                    $response['daily'] = [];
                }

                $response['icon_hints'] = [
                    'wave' => 'mdi:waves',
                    'swell' => 'mdi:wave',
                    'current' => 'mdi:current-ac',
                    'temperature' => 'mdi:thermometer',
                ];

                return response()
                    ->json($response)
                    ->header('Cache-Control', 'public, max-age=60')
                    ->header('X-Cache', 'hit; stale=false');
            }

            $options = $this->weatherOptions($city, $days, (string) $request->input('units', 'metric'));
            $marineEnvelope = $this->weatherService->getSection($city, $options, 'marine');
            $marineData = $this->envelopeData($marineEnvelope);
            $marineCache = $this->envelopeCache($marineEnvelope);
            $etag = (string) ($marineCache['etag'] ?? md5(json_encode($marineData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: ''));

            if ($request->header('If-None-Match') === "\"{$etag}\"") {
                return response()->noContent(304);
            }

            if (in_array('cache', $includes, true)) {
                $response['cache'] = [
                    'provider' => $this->weatherService->providerName(),
                    'cached' => (bool) ($marineCache['cached'] ?? false),
                    'stale' => (bool) ($marineCache['stale'] ?? false),
                    'fetched_at' => (string) ($marineCache['generated_at_utc'] ?? CarbonImmutable::now('UTC')->toIso8601String()),
                    'expires_at' => (string) ($marineCache['expires_at_utc'] ?? CarbonImmutable::now('UTC')->toIso8601String()),
                ];
            }

            if (in_array('hourly', $includes, true)) {
                $response['hourly'] = $this->mapMarineHourly(
                    (array) ($marineData['hourly'] ?? []),
                    $this->timezone($city),
                    $hours
                );
            }

            if (in_array('daily', $includes, true)) {
                $response['daily'] = $this->mapMarineDaily((array) ($marineData['daily'] ?? []), $days);
            }

            $response['icon_hints'] = [
                'wave' => 'mdi:waves',
                'swell' => 'mdi:wave',
                'current' => 'mdi:current-ac',
                'temperature' => 'mdi:thermometer',
            ];

            return response()
                ->json($response)
                ->header('ETag', "\"{$etag}\"")
                ->header('Cache-Control', 'public, max-age=60')
                ->header(
                    'X-Cache',
                    $this->cacheHeaderStatus($marineCache)
                );
        } catch (Throwable $error) {
            \Log::error('[WeatherController] marine failed', ['error' => $error->getMessage()]);

            return response()->json([
                'error' => 'UPSTREAM_FAILURE',
                'message' => 'Nao foi possivel obter dados do mar agora.',
                'status' => 502,
            ], 502);
        }
    }

    /**
     * GET /api/v1/weather/insights
     * Human-readable insights: "vai chover?", "da praia?", etc.
     */
    public function insights(Request $request): JsonResponse
    {
        $city = $this->tenantCity();
        if (!$city) {
            return $this->tenantRequired();
        }

        try {
            $timezone = $this->timezone($city);
            $options = $this->weatherOptions($city, (int) $request->input('days', 2), (string) $request->input('units', 'metric'));

            $forecastEnvelope = $this->weatherService->getSection($city, $options, 'forecast');
            $forecastData = $this->envelopeData($forecastEnvelope);
            $forecastCache = $this->envelopeCache($forecastEnvelope);

            $marineData = [];
            $marineCache = [];
            if ((bool) ($city->is_coastal ?? false)) {
                $marineEnvelope = $this->weatherService->getSection($city, $options, 'marine');
                $marineData = $this->envelopeData($marineEnvelope);
                $marineCache = $this->envelopeCache($marineEnvelope);
            }

            $insights = $this->insightsService->generateInsights(
                ['data' => $forecastData],
                ['data' => $marineData],
                $timezone
            );

            return response()->json([
                'location' => $this->locationPayload($city),
                'cache' => [
                    'fetched_at' => (string) ($forecastCache['generated_at_utc'] ?? CarbonImmutable::now('UTC')->toIso8601String()),
                    'stale' => (bool) (($forecastCache['stale'] ?? false) || ($marineCache['stale'] ?? false)),
                ],
                'insights' => $insights,
            ]);
        } catch (Throwable $error) {
            \Log::error('[WeatherController] insights failed', ['error' => $error->getMessage()]);

            return response()->json([
                'error' => 'UPSTREAM_FAILURE',
                'message' => 'Nao foi possivel gerar insights agora.',
                'status' => 502,
            ], 502);
        }
    }

    /**
     * GET /api/v1/weather/preset/{type}
     * Activity-specific forecasts: going_out, beach, fishing, hiking.
     */
    public function preset(Request $request, string $type): JsonResponse
    {
        $city = $this->tenantCity();
        if (!$city) {
            return $this->tenantRequired();
        }

        $validPresets = ['going_out', 'beach', 'fishing', 'hiking'];
        if (!in_array($type, $validPresets, true)) {
            return response()->json([
                'error' => 'INVALID_PRESET',
                'message' => 'Preset invalido. Use: ' . implode(', ', $validPresets),
                'status' => 400,
            ], 400);
        }

        try {
            $timezone = $this->timezone($city);
            $options = $this->weatherOptions($city, (int) $request->input('days', 2), (string) $request->input('units', 'metric'));

            $forecastEnvelope = $this->weatherService->getSection($city, $options, 'forecast');
            $forecastData = $this->envelopeData($forecastEnvelope);
            $forecastCache = $this->envelopeCache($forecastEnvelope);

            $marineData = [];
            $marineCache = [];
            if ((bool) ($city->is_coastal ?? false)) {
                $marineEnvelope = $this->weatherService->getSection($city, $options, 'marine');
                $marineData = $this->envelopeData($marineEnvelope);
                $marineCache = $this->envelopeCache($marineEnvelope);
            }

            $preset = $this->insightsService->generatePreset(
                $type,
                ['data' => $forecastData],
                ['data' => $marineData],
                $timezone
            );

            return response()->json([
                'location' => $this->locationPayload($city),
                'cache' => [
                    'fetched_at' => (string) ($forecastCache['generated_at_utc'] ?? CarbonImmutable::now('UTC')->toIso8601String()),
                    'stale' => (bool) (($forecastCache['stale'] ?? false) || ($marineCache['stale'] ?? false)),
                ],
                'preset' => $preset,
            ]);
        } catch (Throwable $error) {
            \Log::error('[WeatherController] preset failed', [
                'error' => $error->getMessage(),
                'type' => $type,
            ]);

            return response()->json([
                'error' => 'UPSTREAM_FAILURE',
                'message' => 'Nao foi possivel gerar preset agora.',
                'status' => 502,
            ], 502);
        }
    }

    private function tenantCity(): ?City
    {
        $city = Tenant::city();

        return $city instanceof City ? $city : null;
    }

    private function tenantRequired(): JsonResponse
    {
        return response()->json([
            'error' => 'TENANT_REQUIRED',
            'message' => 'Tenant city is required.',
        ], 400);
    }

    private function timezone(City $city): string
    {
        return (string) ($city->timezone ?? 'America/Sao_Paulo');
    }

    private function weatherOptions(City $city, int $days, string $units): WeatherOptions
    {
        $safeDays = min(max($days, 1), 16);
        $safeUnits = $units === 'imperial' ? 'imperial' : 'metric';

        return new WeatherOptions(
            forecastDays: $safeDays,
            units: $safeUnits,
            timezone: $this->timezone($city),
        );
    }

    /**
     * @param array<string, mixed> $envelope
     * @return array<string, mixed>
     */
    private function envelopeData(array $envelope): array
    {
        $data = $envelope['data'] ?? [];
        return is_array($data) ? $data : [];
    }

    /**
     * @param array<string, mixed> $envelope
     * @return array<string, mixed>
     */
    private function envelopeCache(array $envelope): array
    {
        $cache = $envelope['cache'] ?? [];
        return is_array($cache) ? $cache : [];
    }

    /**
     * @param array<string, mixed> $cache
     */
    private function cacheHeaderStatus(array $cache): string
    {
        $status = strtolower((string) ($cache['status'] ?? (($cache['cached'] ?? false) ? 'hit' : 'miss')));
        $stale = (bool) ($cache['stale'] ?? false);

        return "{$status}; stale=" . ($stale ? 'true' : 'false');
    }

    /**
     * @return array<int, string>
     */
    private function requestedInclude(Request $request, array $default): array
    {
        $includes = $request->input('include', $default);

        if (is_string($includes)) {
            $includes = array_filter(array_map('trim', explode(',', $includes)));
        }

        if (!is_array($includes) || $includes === []) {
            return $default;
        }

        return array_values(array_unique(array_map(static fn($item): string => (string) $item, $includes)));
    }

    /**
     * @return array<string, mixed>
     */
    private function locationPayload(City $city): array
    {
        $key = str_replace('-', '_', (string) $city->slug);
        $name = (string) ($city->full_name ?? ($city->name . '/' . $city->uf));

        return [
            'key' => $key,
            'name' => $name,
            'lat' => isset($city->lat) ? (float) $city->lat : null,
            'lon' => isset($city->lon) ? (float) $city->lon : null,
            'timezone' => $this->timezone($city),
        ];
    }

    /**
     * @param array<string, mixed> $current
     * @return array<string, mixed>
     */
    private function mapCurrent(array $current): array
    {
        $weatherCode = (int) ($current['weather_code'] ?? 0);

        return [
            'temp_c' => $current['temperature_2m'] ?? null,
            'feels_like_c' => $current['apparent_temperature'] ?? null,
            'weather_code' => $weatherCode,
            'description' => $this->getWeatherDescription($weatherCode),
            'precipitation_mm' => $current['precipitation'] ?? 0,
            'wind_kmh' => $current['wind_speed_10m'] ?? 0,
            'gust_kmh' => $current['wind_gusts_10m'] ?? 0,
            'wind_dir_deg' => $current['wind_direction_10m'] ?? 0,
            'cloud_cover_pct' => $current['cloud_cover'] ?? 0,
        ];
    }

    /**
     * @param array<string, mixed> $daily
     * @return array<string, mixed>|null
     */
    private function mapToday(array $daily): ?array
    {
        $dates = is_array($daily['time'] ?? null) ? $daily['time'] : [];
        if ($dates === []) {
            return null;
        }

        return [
            'min_c' => $daily['temperature_2m_min'][0] ?? null,
            'max_c' => $daily['temperature_2m_max'][0] ?? null,
            'rain_prob_max_pct' => $daily['precipitation_probability_max'][0] ?? 0,
            'sunrise' => $daily['sunrise'][0] ?? null,
            'sunset' => $daily['sunset'][0] ?? null,
        ];
    }

    /**
     * @param array<string, mixed> $hourly
     * @return array<int, array<string, mixed>>
     */
    private function mapForecastHourly(array $hourly, string $timezone, int $limit): array
    {
        $times = is_array($hourly['time'] ?? null) ? $hourly['time'] : [];
        $indexes = $this->futureIndexes($times, $timezone, $limit);
        $result = [];

        foreach ($indexes as $index) {
            $weatherCode = (int) ($hourly['weather_code'][$index] ?? 0);
            $result[] = [
                't' => $times[$index] ?? null,
                'temp_c' => $hourly['temperature_2m'][$index] ?? null,
                'rain_prob_pct' => $hourly['precipitation_probability'][$index] ?? 0,
                'precipitation_mm' => $hourly['precipitation'][$index] ?? 0,
                'weather_code' => $weatherCode,
                'wind_kmh' => $hourly['wind_speed_10m'][$index] ?? 0,
                'gust_kmh' => $hourly['wind_gusts_10m'][$index] ?? 0,
                'wind_dir_deg' => $hourly['wind_direction_10m'][$index] ?? 0,
                'uv_index' => $hourly['uv_index'][$index] ?? 0,
                'cloud_cover_pct' => $hourly['cloud_cover'][$index] ?? 0,
            ];
        }

        return $result;
    }

    /**
     * @param array<string, mixed> $daily
     * @return array<int, array<string, mixed>>
     */
    private function mapForecastDaily(array $daily, int $days): array
    {
        $dates = is_array($daily['time'] ?? null) ? $daily['time'] : [];
        $limit = min(count($dates), $days);
        $result = [];

        for ($index = 0; $index < $limit; $index++) {
            $weatherCode = (int) ($daily['weather_code'][$index] ?? 0);
            $result[] = [
                'date' => $dates[$index] ?? null,
                'weather_code' => $weatherCode,
                'description' => $this->getWeatherDescription($weatherCode),
                'min_c' => $daily['temperature_2m_min'][$index] ?? null,
                'max_c' => $daily['temperature_2m_max'][$index] ?? null,
                'precipitation_sum_mm' => $daily['precipitation_sum'][$index] ?? 0,
                'rain_prob_max_pct' => $daily['precipitation_probability_max'][$index] ?? 0,
                'wind_max_kmh' => $daily['wind_speed_10m_max'][$index] ?? 0,
                'gust_max_kmh' => $daily['wind_gusts_10m_max'][$index] ?? 0,
                'wind_dir_dominant_deg' => $daily['wind_direction_10m_dominant'][$index] ?? 0,
                'sunrise' => $daily['sunrise'][$index] ?? null,
                'sunset' => $daily['sunset'][$index] ?? null,
                'uv_max' => $daily['uv_index_max'][$index] ?? 0,
            ];
        }

        return $result;
    }

    /**
     * @param array<string, mixed> $hourly
     * @return array<string, mixed>|null
     */
    private function mapMarinePreview(array $hourly, string $timezone): ?array
    {
        $times = is_array($hourly['time'] ?? null) ? $hourly['time'] : [];
        if ($times === []) {
            return null;
        }

        $index = $this->firstFutureIndex($times, $timezone);

        return [
            'wave_m' => $hourly['wave_height'][$index] ?? 0,
            'wave_period_s' => $hourly['wave_period'][$index] ?? 0,
            'wave_dir_deg' => $hourly['wave_direction'][$index] ?? 0,
            'sea_temp_c' => $hourly['sea_surface_temperature'][$index] ?? null,
        ];
    }

    /**
     * @param array<string, mixed> $hourly
     * @return array<int, array<string, mixed>>
     */
    private function mapMarineHourly(array $hourly, string $timezone, int $limit): array
    {
        $times = is_array($hourly['time'] ?? null) ? $hourly['time'] : [];
        $indexes = $this->futureIndexes($times, $timezone, $limit);
        $result = [];

        foreach ($indexes as $index) {
            $result[] = [
                't' => $times[$index] ?? null,
                'wave_m' => $hourly['wave_height'][$index] ?? 0,
                'wave_period_s' => $hourly['wave_period'][$index] ?? 0,
                'wave_dir_deg' => $hourly['wave_direction'][$index] ?? 0,
                'swell_m' => $hourly['swell_wave_height'][$index] ?? 0,
                'swell_period_s' => $hourly['swell_wave_period'][$index] ?? 0,
                'swell_dir_deg' => $hourly['swell_wave_direction'][$index] ?? 0,
                'wind_wave_m' => $hourly['wind_wave_height'][$index] ?? 0,
                'wind_wave_period_s' => $hourly['wind_wave_period'][$index] ?? 0,
                'wind_wave_dir_deg' => $hourly['wind_wave_direction'][$index] ?? 0,
                'sea_temp_c' => $hourly['sea_surface_temperature'][$index] ?? null,
                'current_ms' => $hourly['ocean_current_velocity'][$index] ?? 0,
                'current_dir_deg' => $hourly['ocean_current_direction'][$index] ?? 0,
            ];
        }

        return $result;
    }

    /**
     * @param array<string, mixed> $daily
     * @return array<int, array<string, mixed>>
     */
    private function mapMarineDaily(array $daily, int $days): array
    {
        $dates = is_array($daily['time'] ?? null) ? $daily['time'] : [];
        $limit = min(count($dates), $days);
        $result = [];

        for ($index = 0; $index < $limit; $index++) {
            $result[] = [
                'date' => $dates[$index] ?? null,
                'wave_max_m' => $daily['wave_height_max'][$index] ?? 0,
                'wave_period_max_s' => $daily['wave_period_max'][$index] ?? 0,
                'wave_dir_dominant_deg' => $daily['wave_direction_dominant'][$index] ?? 0,
                'swell_max_m' => $daily['swell_wave_height_max'][$index] ?? 0,
                'swell_period_max_s' => $daily['swell_wave_period_max'][$index] ?? 0,
                'swell_dir_dominant_deg' => $daily['swell_wave_direction_dominant'][$index] ?? 0,
            ];
        }

        return $result;
    }

    /**
     * @param array<int, mixed> $times
     * @return array<int, int>
     */
    private function futureIndexes(array $times, string $timezone, int $limit): array
    {
        $now = CarbonImmutable::now($timezone);
        $indexes = [];

        foreach ($times as $index => $time) {
            if (!is_string($time) || trim($time) === '') {
                continue;
            }

            try {
                $instant = CarbonImmutable::parse($time, $timezone);
            } catch (Throwable) {
                continue;
            }

            if ($instant->lt($now)) {
                continue;
            }

            $indexes[] = (int) $index;

            if (count($indexes) >= $limit) {
                break;
            }
        }

        return $indexes;
    }

    /**
     * @param array<int, mixed> $times
     */
    private function firstFutureIndex(array $times, string $timezone): int
    {
        $indexes = $this->futureIndexes($times, $timezone, 1);
        return $indexes[0] ?? 0;
    }

    /**
     * Get weather description in Portuguese.
     */
    private function getWeatherDescription(int $code): string
    {
        return match ($code) {
            0 => 'Ceu limpo',
            1 => 'Predominantemente limpo',
            2 => 'Parcialmente nublado',
            3 => 'Nublado',
            45, 48 => 'Neblina',
            51, 53, 55 => 'Garoa',
            56, 57 => 'Garoa congelante',
            61, 63, 65 => 'Chuva',
            66, 67 => 'Chuva congelante',
            71, 73, 75 => 'Neve',
            77 => 'Graos de neve',
            80, 81, 82 => 'Pancadas de chuva',
            85, 86 => 'Pancadas de neve',
            95 => 'Tempestade',
            96, 99 => 'Tempestade com granizo',
            default => 'Desconhecido',
        };
    }

    /**
     * Get icon hints for weather codes.
     *
     * @return array<string, string>
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
