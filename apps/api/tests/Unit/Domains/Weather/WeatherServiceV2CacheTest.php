<?php

namespace Tests\Unit\Domains\Weather;

use App\Domains\Weather\Contracts\WeatherOptions;
use App\Domains\Weather\Contracts\WeatherProviderInterface;
use App\Domains\Weather\Services\WeatherServiceV2;
use App\Domains\Weather\Support\WeatherCacheKeyFactory;
use App\Domains\Weather\Support\WeatherCircuitBreaker;
use App\Domains\Weather\Support\WeatherNormalizer;
use App\Domains\Weather\Support\WeatherTtlJitter;
use App\Domains\Weather\Support\WeatherTtlPolicy;
use App\Models\City;
use App\Support\TenantCache;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Mockery;
use Tests\TestCase;

class WeatherServiceV2CacheTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
        Schema::dropIfExists('external_api_cache');
        Schema::create('external_api_cache', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('key')->unique();
            $table->string('provider', 50)->index();
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lon', 10, 7)->nullable();
            $table->string('timezone', 50)->nullable();
            $table->json('payload');
            $table->char('payload_hash', 64)->nullable();
            $table->timestamp('fetched_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->text('last_error')->nullable();
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Cache::flush();
        Schema::dropIfExists('external_api_cache');

        parent::tearDown();
    }

    public function test_first_call_is_miss_and_second_call_is_hit_from_hot_cache(): void
    {
        $provider = new class implements WeatherProviderInterface {
            public int $forecastCalls = 0;

            public function name(): string
            {
                return 'fake_provider';
            }

            public function capabilities(): array
            {
                return ['hasMarine' => true, 'supportsTimezone' => true, 'maxDays' => 10];
            }

            public function forecast(float $lat, float $lon, WeatherOptions $options): array
            {
                $this->forecastCalls++;
                return ['current' => ['temperature_2m' => 26], 'hourly' => [], 'daily' => []];
            }

            public function marine(float $lat, float $lon, WeatherOptions $options): array
            {
                return ['hourly' => [], 'daily' => []];
            }
        };

        $keys = new WeatherCacheKeyFactory();
        $breaker = new WeatherCircuitBreaker($keys);
        $service = new WeatherServiceV2(
            provider: $provider,
            normalizer: new WeatherNormalizer(),
            keys: $keys,
            ttlPolicy: new WeatherTtlPolicy(),
            ttlJitter: new WeatherTtlJitter(0.0),
            circuitBreaker: $breaker,
        );

        $city = $this->makeCity('tijucas-sc', true);
        $options = new WeatherOptions();

        $first = $service->getSection($city, $options, 'forecast');
        $second = $service->getSection($city, $options, 'forecast');

        $this->assertSame('miss', $first['cache']['status']);
        $this->assertSame('provider', $first['cache']['source']);
        $this->assertSame('hit', $second['cache']['status']);
        $this->assertSame('redis', $second['cache']['source']);
        $this->assertSame(1, $provider->forecastCalls);
    }

    public function test_returns_stale_if_busy_when_lock_not_acquired(): void
    {
        $provider = new class implements WeatherProviderInterface {
            public int $forecastCalls = 0;

            public function name(): string
            {
                return 'fake_provider';
            }

            public function capabilities(): array
            {
                return ['hasMarine' => true, 'supportsTimezone' => true, 'maxDays' => 10];
            }

            public function forecast(float $lat, float $lon, WeatherOptions $options): array
            {
                $this->forecastCalls++;
                return ['current' => ['temperature_2m' => 24], 'hourly' => [], 'daily' => []];
            }

            public function marine(float $lat, float $lon, WeatherOptions $options): array
            {
                return ['hourly' => [], 'daily' => []];
            }
        };

        $keys = new WeatherCacheKeyFactory();
        $service = new WeatherServiceV2(
            provider: $provider,
            normalizer: new WeatherNormalizer(),
            keys: $keys,
            ttlPolicy: new WeatherTtlPolicy(),
            ttlJitter: new WeatherTtlJitter(0.0),
            circuitBreaker: new WeatherCircuitBreaker($keys),
        );

        $city = $this->makeCity('tijucas-sc', true);
        $options = new WeatherOptions();

        $service->getSection($city, $options, 'forecast');

        $sectionKey = $keys->section('forecast', 'tijucas-sc', 'America/Sao_Paulo', 'metric', 7);
        TenantCache::forgetForCity('tijucas-sc', $sectionKey);

        DB::table('external_api_cache')
            ->where('key', $sectionKey)
            ->update([
                'fetched_at' => now()->subMinutes(20),
                'expires_at' => now()->addHours(2),
            ]);

        $lock = Cache::lock($keys->lock($sectionKey), 10);
        $this->assertTrue($lock->get());

        $stale = $service->getSection($city, $options, 'forecast');

        $lock->release();

        $this->assertSame('stale', $stale['cache']['status']);
        $this->assertTrue($stale['cache']['degraded']);
        $this->assertSame('stale_if_busy', $stale['cache']['degraded_reason']);
        $this->assertSame(1, $provider->forecastCalls);
    }

    public function test_open_circuit_serves_stale_data_without_calling_provider(): void
    {
        $provider = new class implements WeatherProviderInterface {
            public int $forecastCalls = 0;

            public function name(): string
            {
                return 'fake_provider';
            }

            public function capabilities(): array
            {
                return ['hasMarine' => true, 'supportsTimezone' => true, 'maxDays' => 10];
            }

            public function forecast(float $lat, float $lon, WeatherOptions $options): array
            {
                $this->forecastCalls++;
                return ['current' => ['temperature_2m' => 22], 'hourly' => [], 'daily' => []];
            }

            public function marine(float $lat, float $lon, WeatherOptions $options): array
            {
                return ['hourly' => [], 'daily' => []];
            }
        };

        $keys = new WeatherCacheKeyFactory();
        $breaker = new WeatherCircuitBreaker($keys);
        $service = new WeatherServiceV2(
            provider: $provider,
            normalizer: new WeatherNormalizer(),
            keys: $keys,
            ttlPolicy: new WeatherTtlPolicy(),
            ttlJitter: new WeatherTtlJitter(0.0),
            circuitBreaker: $breaker,
        );

        $city = $this->makeCity('tijucas-sc', true);
        $options = new WeatherOptions();

        $service->getSection($city, $options, 'forecast');

        $sectionKey = $keys->section('forecast', 'tijucas-sc', 'America/Sao_Paulo', 'metric', 7);
        TenantCache::forgetForCity('tijucas-sc', $sectionKey);
        DB::table('external_api_cache')
            ->where('key', $sectionKey)
            ->update([
                'fetched_at' => now()->subMinutes(20),
                'expires_at' => now()->addHours(2),
            ]);

        $breaker->recordFailure('tijucas-sc', 'forecast');
        $breaker->recordFailure('tijucas-sc', 'forecast');
        $breaker->recordFailure('tijucas-sc', 'forecast');

        $stale = $service->getSection($city, $options, 'forecast');

        $this->assertSame('stale', $stale['cache']['status']);
        $this->assertTrue($stale['cache']['degraded']);
        $this->assertSame('circuit_open', $stale['cache']['degraded_reason']);
        $this->assertSame(1, $provider->forecastCalls);
    }

    public function test_emits_cache_and_provider_metrics_on_miss_and_hit(): void
    {
        Log::spy();

        $provider = new class implements WeatherProviderInterface {
            public int $forecastCalls = 0;

            public function name(): string
            {
                return 'fake_provider';
            }

            public function capabilities(): array
            {
                return ['hasMarine' => true, 'supportsTimezone' => true, 'maxDays' => 10];
            }

            public function forecast(float $lat, float $lon, WeatherOptions $options): array
            {
                $this->forecastCalls++;
                return ['current' => ['temperature_2m' => 25], 'hourly' => [], 'daily' => []];
            }

            public function marine(float $lat, float $lon, WeatherOptions $options): array
            {
                return ['hourly' => [], 'daily' => []];
            }
        };

        $keys = new WeatherCacheKeyFactory();
        $service = new WeatherServiceV2(
            provider: $provider,
            normalizer: new WeatherNormalizer(),
            keys: $keys,
            ttlPolicy: new WeatherTtlPolicy(),
            ttlJitter: new WeatherTtlJitter(0.0),
            circuitBreaker: new WeatherCircuitBreaker($keys),
        );

        $city = $this->makeCity('tijucas-sc', true);
        $options = new WeatherOptions();

        $service->getSection($city, $options, 'forecast');
        $service->getSection($city, $options, 'forecast');

        Log::shouldHaveReceived('info')
            ->with('weather_metric', Mockery::on(static function (array $context): bool {
                return ($context['metric'] ?? null) === 'weather_bundle.cache_miss'
                    && ($context['section'] ?? null) === 'forecast';
            }))
            ->once();

        Log::shouldHaveReceived('info')
            ->with('weather_metric', Mockery::on(static function (array $context): bool {
                return ($context['metric'] ?? null) === 'weather_bundle.cache_hit'
                    && ($context['source'] ?? null) === 'redis';
            }))
            ->once();

        Log::shouldHaveReceived('info')
            ->with('weather_metric', Mockery::on(static function (array $context): bool {
                return ($context['metric'] ?? null) === 'provider.latency_ms'
                    && ($context['provider'] ?? null) === 'fake_provider'
                    && ($context['success'] ?? false) === true
                    && is_numeric($context['value'] ?? null);
            }))
            ->once();

        Log::shouldHaveReceived('info')
            ->with('weather_metric', Mockery::on(static function (array $context): bool {
                return ($context['metric'] ?? null) === 'provider.error_rate'
                    && ($context['value'] ?? null) === 0;
            }))
            ->once();
    }

    public function test_emits_provider_error_metric_when_provider_fails(): void
    {
        Log::spy();

        $provider = new class implements WeatherProviderInterface {
            public function name(): string
            {
                return 'fake_provider';
            }

            public function capabilities(): array
            {
                return ['hasMarine' => true, 'supportsTimezone' => true, 'maxDays' => 10];
            }

            public function forecast(float $lat, float $lon, WeatherOptions $options): array
            {
                throw new \RuntimeException('Provider timeout');
            }

            public function marine(float $lat, float $lon, WeatherOptions $options): array
            {
                return ['hourly' => [], 'daily' => []];
            }
        };

        $keys = new WeatherCacheKeyFactory();
        $service = new WeatherServiceV2(
            provider: $provider,
            normalizer: new WeatherNormalizer(),
            keys: $keys,
            ttlPolicy: new WeatherTtlPolicy(),
            ttlJitter: new WeatherTtlJitter(0.0),
            circuitBreaker: new WeatherCircuitBreaker($keys),
        );

        $city = $this->makeCity('canelinha-sc', false);

        try {
            $service->getSection($city, new WeatherOptions(), 'forecast');
            $this->fail('Expected provider failure exception was not thrown.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('Provider timeout', $exception->getMessage());
        }

        Log::shouldHaveReceived('info')
            ->with('weather_metric', Mockery::on(static function (array $context): bool {
                return ($context['metric'] ?? null) === 'provider.error_rate'
                    && ($context['provider'] ?? null) === 'fake_provider'
                    && ($context['value'] ?? null) === 1;
            }))
            ->once();
    }

    private function makeCity(string $slug, bool $isCoastal): City
    {
        $city = new City();
        $city->forceFill([
            'slug' => $slug,
            'lat' => -27.2413,
            'lon' => -48.6317,
            'timezone' => 'America/Sao_Paulo',
            'is_coastal' => $isCoastal,
        ]);

        return $city;
    }
}
