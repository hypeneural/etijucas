<?php

namespace Tests\Unit\Domains\Weather;

use App\Domains\Weather\Support\WeatherTelemetry;
use Illuminate\Support\Facades\Log;
use Mockery;
use Tests\TestCase;

class WeatherTelemetryTest extends TestCase
{
    public function test_records_cache_status_metrics_with_expected_name(): void
    {
        Log::spy();

        $telemetry = new WeatherTelemetry();
        $telemetry->recordCacheStatus('tijucas-sc', 'forecast', 'hit', 'redis', false, null, 'cache:key:1');
        $telemetry->recordCacheStatus('tijucas-sc', 'forecast', 'miss', 'provider', false, null, 'cache:key:1');
        $telemetry->recordCacheStatus('tijucas-sc', 'forecast', 'stale', 'db', true, 'stale_if_busy', 'cache:key:1');

        Log::shouldHaveReceived('info')
            ->with('weather_metric', Mockery::on(static function (array $context): bool {
                return ($context['metric'] ?? null) === 'weather_bundle.cache_hit'
                    && ($context['section'] ?? null) === 'forecast'
                    && ($context['city_slug'] ?? null) === 'tijucas-sc';
            }))
            ->once();

        Log::shouldHaveReceived('info')
            ->with('weather_metric', Mockery::on(static function (array $context): bool {
                return ($context['metric'] ?? null) === 'weather_bundle.cache_miss';
            }))
            ->once();

        Log::shouldHaveReceived('info')
            ->with('weather_metric', Mockery::on(static function (array $context): bool {
                return ($context['metric'] ?? null) === 'weather_bundle.cache_stale'
                    && ($context['degraded'] ?? false) === true;
            }))
            ->once();
    }

    public function test_records_provider_latency_and_error_rate_metrics(): void
    {
        Log::spy();

        $telemetry = new WeatherTelemetry();
        $telemetry->recordProviderResult('open_meteo', 'itapema-sc', 'forecast', 187, false);

        Log::shouldHaveReceived('info')
            ->with('weather_metric', Mockery::on(static function (array $context): bool {
                return ($context['metric'] ?? null) === 'provider.latency_ms'
                    && ($context['value'] ?? null) === 187
                    && ($context['provider'] ?? null) === 'open_meteo'
                    && ($context['success'] ?? true) === false;
            }))
            ->once();

        Log::shouldHaveReceived('info')
            ->with('weather_metric', Mockery::on(static function (array $context): bool {
                return ($context['metric'] ?? null) === 'provider.error_rate'
                    && ($context['value'] ?? null) === 1;
            }))
            ->once();
    }

    public function test_records_bundle_payload_and_sections_requested_metrics(): void
    {
        Log::spy();

        $telemetry = new WeatherTelemetry();
        $telemetry->recordBundleRequest('porto-belo-sc', ['daily', 'current', 'daily'], 3072);

        Log::shouldHaveReceived('info')
            ->with('weather_metric', Mockery::on(static function (array $context): bool {
                return ($context['metric'] ?? null) === 'bundle.sections_requested'
                    && ($context['value'] ?? null) === 2
                    && ($context['sections_csv'] ?? null) === 'current,daily';
            }))
            ->once();

        Log::shouldHaveReceived('info')
            ->with('weather_metric', Mockery::on(static function (array $context): bool {
                return ($context['metric'] ?? null) === 'bundle.payload_kb'
                    && ($context['value'] ?? null) === 3.0
                    && ($context['payload_bytes'] ?? null) === 3072;
            }))
            ->once();
    }
}

