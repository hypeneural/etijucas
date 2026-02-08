<?php

declare(strict_types=1);

namespace App\Domains\Weather\Http\Controllers;

use App\Domains\Weather\Contracts\WeatherOptions;
use App\Domains\Weather\Http\Requests\WeatherBundleRequest;
use App\Domains\Weather\Http\Resources\WeatherBundleResource;
use App\Domains\Weather\Services\WeatherInsightsService;
use App\Domains\Weather\Services\WeatherServiceV2;
use App\Domains\Weather\Support\WeatherRollout;
use App\Domains\Weather\Support\WeatherTelemetry;
use App\Http\Controllers\Controller;
use App\Models\City;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class WeatherBundleController extends Controller
{
    private const CONTRACT_VERSION = '2.0';

    public function __construct(
        private readonly WeatherServiceV2 $weatherService,
        private readonly WeatherInsightsService $insightsService,
        private readonly WeatherTelemetry $telemetry,
    ) {
    }

    public function __invoke(WeatherBundleRequest $request): JsonResponse
    {
        $city = $request->attributes->get('tenant_city');
        if (!$city instanceof City && app()->bound('tenant.city')) {
            $boundCity = app('tenant.city');
            if ($boundCity instanceof City) {
                $city = $boundCity;
            }
        }

        if (!$city instanceof City) {
            return response()->json([
                'error' => 'TENANT_REQUIRED',
                'message' => 'Tenant city is required for weather bundle.',
            ], 400);
        }

        if (!WeatherRollout::isV2EnabledForCity((string) ($city->slug ?? ''))) {
            return response()->json([
                'error' => 'WEATHER_V2_DISABLED',
                'message' => 'Weather bundle v2 is disabled for this city.',
                'city_slug' => (string) ($city->slug ?? ''),
            ], 404);
        }

        $sections = $request->sections();
        $options = new WeatherOptions(
            forecastDays: $request->days(),
            units: $request->units(),
            timezone: (string) ($city->timezone ?: 'America/Sao_Paulo'),
        );

        $data = [];
        $errors = [
            'forecast' => null,
            'marine' => null,
            'insights' => null,
        ];

        $sectionCaches = [];
        $forecastData = null;
        $marineData = null;

        if ($this->needsForecast($sections)) {
            try {
                $forecast = $this->weatherService->getSection($city, $options, 'forecast');
                $forecastData = is_array($forecast['data'] ?? null) ? $forecast['data'] : [];
                $sectionCaches[] = is_array($forecast['cache'] ?? null) ? $forecast['cache'] : [];

                if (in_array('current', $sections, true)) {
                    $data['current'] = $forecastData['current'] ?? null;
                }
                if (in_array('hourly', $sections, true)) {
                    $data['hourly'] = $forecastData['hourly'] ?? [];
                }
                if (in_array('daily', $sections, true)) {
                    $data['daily'] = $forecastData['daily'] ?? [];
                }
            } catch (Throwable $error) {
                Log::warning('Weather bundle forecast section failed', [
                    'city' => $city->slug,
                    'error' => $error->getMessage(),
                ]);

                $errors['forecast'] = $this->sectionError(
                    code: 'FORECAST_UNAVAILABLE',
                    error: $error,
                    fallbackMessage: 'Unable to load forecast section.',
                );

                if (in_array('current', $sections, true)) {
                    $data['current'] = null;
                }
                if (in_array('hourly', $sections, true)) {
                    $data['hourly'] = [];
                }
                if (in_array('daily', $sections, true)) {
                    $data['daily'] = [];
                }
            }
        }

        $wantsMarine = in_array('marine', $sections, true);
        $isCoastal = (bool) ($city->is_coastal ?? false);
        if ($wantsMarine && $isCoastal) {
            try {
                $marine = $this->weatherService->getSection($city, $options, 'marine');
                $marineData = is_array($marine['data'] ?? null) ? $marine['data'] : [];
                $sectionCaches[] = is_array($marine['cache'] ?? null) ? $marine['cache'] : [];
                $data['marine'] = $marineData;
            } catch (Throwable $error) {
                Log::warning('Weather bundle marine section failed', [
                    'city' => $city->slug,
                    'error' => $error->getMessage(),
                ]);

                $errors['marine'] = $this->sectionError(
                    code: 'MARINE_UNAVAILABLE',
                    error: $error,
                    fallbackMessage: 'Unable to load marine section.',
                );
                $data['marine'] = null;
            }
        }

        if (in_array('insights', $sections, true)) {
            try {
                if (!is_array($forecastData)) {
                    throw new \RuntimeException('Forecast data unavailable for insights.');
                }

                $data['insights'] = $this->insightsService->generateInsights(
                    ['data' => $forecastData],
                    ['data' => is_array($marineData) ? $marineData : []],
                    (string) ($city->timezone ?? 'America/Sao_Paulo'),
                );
            } catch (Throwable $error) {
                Log::warning('Weather bundle insights section failed', [
                    'city' => $city->slug,
                    'error' => $error->getMessage(),
                ]);

                $errors['insights'] = $this->sectionError(
                    code: 'INSIGHTS_UNAVAILABLE',
                    error: $error,
                    fallbackMessage: 'Unable to generate insights section.',
                );
                $data['insights'] = [];
            }
        }

        $requestId = $this->resolveRequestId($request);
        $payload = [
            'contract_version' => self::CONTRACT_VERSION,
            'provider' => $this->weatherService->providerName(),
            'request_id' => $requestId,
            'location' => [
                'city_slug' => (string) ($city->slug ?? ''),
                'lat' => isset($city->lat) ? (float) $city->lat : null,
                'lon' => isset($city->lon) ? (float) $city->lon : null,
                'timezone' => (string) ($city->timezone ?? 'America/Sao_Paulo'),
                'is_coastal' => $isCoastal,
            ],
            'cache' => $this->aggregateCacheMeta($sectionCaches, $errors),
            'errors' => $errors,
            'data' => $data,
        ];

        $resourcePayload = (new WeatherBundleResource($payload))->toArray($request);
        $this->telemetry->recordBundleRequest(
            citySlug: (string) ($city->slug ?? ''),
            sections: $sections,
            payloadBytes: $this->payloadBytes($resourcePayload),
        );

        $response = response()->json($resourcePayload)
            ->header('Cache-Control', 'public, max-age=60');

        if (!$response->headers->has('X-Request-Id')) {
            $response->headers->set('X-Request-Id', $requestId);
        }

        return $response;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function payloadBytes(array $payload): int
    {
        return strlen((string) (json_encode(
            $payload,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        ) ?: ''));
    }

    /**
     * @param array<int, string> $sections
     */
    private function needsForecast(array $sections): bool
    {
        return array_intersect($sections, ['current', 'hourly', 'daily', 'insights']) !== [];
    }

    /**
     * @param array<string, mixed> $errors
     * @param array<int, array<string, mixed>> $sectionCaches
     * @return array{
     *   generated_at_utc:string,
     *   expires_at_utc:string,
     *   stale_until_utc:string,
     *   degraded:bool,
     *   degraded_reason:?string
     * }
     */
    private function aggregateCacheMeta(array $sectionCaches, array $errors): array
    {
        $now = CarbonImmutable::now('UTC');

        if ($sectionCaches === []) {
            $degraded = $this->hasSectionErrors($errors);

            return [
                'generated_at_utc' => $now->toIso8601String(),
                'expires_at_utc' => $now->toIso8601String(),
                'stale_until_utc' => $now->toIso8601String(),
                'degraded' => $degraded,
                'degraded_reason' => $degraded ? 'section_error_without_cache' : null,
            ];
        }

        $generatedTimes = [];
        $expiresTimes = [];
        $staleUntilTimes = [];
        $degradedReasons = [];
        $isDegraded = false;

        foreach ($sectionCaches as $cache) {
            $generatedTimes[] = $this->parseUtc((string) ($cache['generated_at_utc'] ?? ''), $now);
            $expiresTimes[] = $this->parseUtc((string) ($cache['expires_at_utc'] ?? ''), $now);
            $staleUntilTimes[] = $this->parseUtc((string) ($cache['stale_until_utc'] ?? ''), $now);

            if (($cache['degraded'] ?? false) === true) {
                $isDegraded = true;
                $reason = $cache['degraded_reason'] ?? null;
                if (is_string($reason) && $reason !== '') {
                    $degradedReasons[] = $reason;
                }
            }
        }

        if ($this->hasSectionErrors($errors)) {
            $isDegraded = true;
            $degradedReasons[] = 'section_error';
        }

        return [
            'generated_at_utc' => $this->minTime($generatedTimes, $now)->toIso8601String(),
            'expires_at_utc' => $this->minTime($expiresTimes, $now)->toIso8601String(),
            'stale_until_utc' => $this->minTime($staleUntilTimes, $now)->toIso8601String(),
            'degraded' => $isDegraded,
            'degraded_reason' => $degradedReasons !== [] ? implode(',', array_values(array_unique($degradedReasons))) : null,
        ];
    }

    private function resolveRequestId(Request $request): string
    {
        $fromRequest = $request->attributes->get('request_id');
        if (is_string($fromRequest) && $fromRequest !== '') {
            return $fromRequest;
        }

        if (app()->bound('request.id')) {
            $fromContainer = app('request.id');
            if (is_string($fromContainer) && $fromContainer !== '') {
                return $fromContainer;
            }
        }

        $fromHeader = $request->header('X-Request-Id');
        if (is_string($fromHeader) && $fromHeader !== '') {
            return $fromHeader;
        }

        return (string) Str::uuid();
    }

    private function parseUtc(string $value, CarbonImmutable $fallback): CarbonImmutable
    {
        if ($value === '') {
            return $fallback;
        }

        try {
            return CarbonImmutable::parse($value, 'UTC');
        } catch (Throwable) {
            return $fallback;
        }
    }

    /**
     * @param array<int, CarbonImmutable> $items
     */
    private function minTime(array $items, CarbonImmutable $fallback): CarbonImmutable
    {
        if ($items === []) {
            return $fallback;
        }

        usort($items, static function (CarbonImmutable $a, CarbonImmutable $b): int {
            if ($a->equalTo($b)) {
                return 0;
            }

            return $a->lessThan($b) ? -1 : 1;
        });

        return $items[0] ?? $fallback;
    }

    /**
     * @param array<string, mixed> $errors
     */
    private function hasSectionErrors(array $errors): bool
    {
        foreach ($errors as $error) {
            if (is_array($error) && isset($error['code'])) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array{code:string,msg:string}
     */
    private function sectionError(string $code, Throwable $error, string $fallbackMessage): array
    {
        $message = trim($error->getMessage());

        return [
            'code' => $code,
            'msg' => $message !== '' ? $message : $fallbackMessage,
        ];
    }
}
