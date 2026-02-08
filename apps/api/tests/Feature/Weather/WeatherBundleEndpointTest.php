<?php

namespace Tests\Feature\Weather;

use App\Domains\Weather\Services\WeatherInsightsService;
use App\Domains\Weather\Services\WeatherServiceV2;
use App\Http\Middleware\RequireTenant;
use App\Http\Middleware\TenantContext;
use App\Models\City;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class WeatherBundleEndpointTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware([
            TenantContext::class,
            RequireTenant::class,
        ]);

        config()->set('tenancy.trusted_hosts', ['localhost', '127.0.0.1', 'example.com']);
        config()->set('tenancy.allow_header_override', true);
        config()->set('weather.v2.enabled', true);
        config()->set('weather.v2.rollout_mode', 'all');
        config()->set('weather.v2.canary_cities', []);

        Schema::dropIfExists('city_domains');
        Schema::dropIfExists('cities');

        Schema::create('cities', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->integer('ibge_code')->unique();
            $table->string('name');
            $table->char('uf', 2);
            $table->string('slug')->unique();
            $table->string('status', 20)->default('active');
            $table->json('brand')->nullable();
            $table->decimal('lat', 10, 8)->nullable();
            $table->decimal('lon', 10, 8)->nullable();
            $table->string('timezone', 50)->default('America/Sao_Paulo');
            $table->boolean('is_coastal')->default(false);
            $table->boolean('active')->default(false);
            $table->timestamps();
        });

        Schema::create('city_domains', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('city_id');
            $table->string('domain');
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
        });

        DB::table('cities')->insert([
            [
                'id' => '00000000-0000-0000-0000-0000000000a1',
                'ibge_code' => 4218004,
                'name' => 'Tijucas',
                'uf' => 'SC',
                'slug' => 'tijucas-sc',
                'status' => 'active',
                'brand' => json_encode(['appName' => 'ETijucas'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'lat' => -27.2413,
                'lon' => -48.6317,
                'timezone' => 'America/Sao_Paulo',
                'is_coastal' => true,
                'active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => '00000000-0000-0000-0000-0000000000b1',
                'ibge_code' => 4203501,
                'name' => 'Canelinha',
                'uf' => 'SC',
                'slug' => 'canelinha-sc',
                'status' => 'active',
                'brand' => json_encode(['appName' => 'ECanelinha'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'lat' => -27.2618,
                'lon' => -48.7660,
                'timezone' => 'America/Sao_Paulo',
                'is_coastal' => false,
                'active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        DB::table('city_domains')->insert([
            [
                'id' => '00000000-0000-0000-0000-0000000000d1',
                'city_id' => '00000000-0000-0000-0000-0000000000a1',
                'domain' => 'localhost',
                'is_primary' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => '00000000-0000-0000-0000-0000000000d2',
                'city_id' => '00000000-0000-0000-0000-0000000000b1',
                'domain' => '127.0.0.1',
                'is_primary' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        Cache::forget('city_domains:map');
    }

    protected function tearDown(): void
    {
        Mockery::close();
        Cache::forget('city_domains:map');

        app()->forgetInstance('tenant.city');
        app()->forgetInstance('tenant.key');
        app()->forgetInstance('tenant.timezone');
        app()->forgetInstance('tenant.resolution_source');

        Schema::dropIfExists('city_domains');
        Schema::dropIfExists('cities');

        parent::tearDown();
    }

    public function test_bundle_returns_contract_v2_and_requested_sections_only(): void
    {
        $this->bindTenant('tijucas-sc');

        $service = Mockery::mock(WeatherServiceV2::class);
        $service->shouldReceive('providerName')->andReturn('open_meteo');
        $service->shouldReceive('getSection')->once()->andReturn($this->forecastEnvelope());

        $insights = Mockery::mock(WeatherInsightsService::class);
        $insights->shouldReceive('generateInsights')->never();

        $this->app->instance(WeatherServiceV2::class, $service);
        $this->app->instance(WeatherInsightsService::class, $insights);

        $response = $this->getJson('/api/v1/weather/bundle?sections=current');

        $this->assertSame(200, $response->status(), $response->getContent());
        $response->assertJsonPath('contract_version', '2.0');
        $response->assertJsonPath('provider', 'open_meteo');
        $response->assertJsonPath('location.city_slug', 'tijucas-sc');
        $response->assertJsonPath('location.timezone', 'America/Sao_Paulo');
        $response->assertJsonPath('location.is_coastal', true);
        $response->assertJsonPath('errors.forecast', null);

        $payload = $response->json();
        $requestId = $response->headers->get('X-Request-Id');

        $this->assertNotEmpty($requestId);
        $this->assertSame($requestId, $payload['request_id'] ?? null);
        $this->assertArrayHasKey('current', $payload['data'] ?? []);
        $this->assertArrayNotHasKey('hourly', $payload['data'] ?? []);
        $this->assertArrayNotHasKey('daily', $payload['data'] ?? []);
        $this->assertArrayNotHasKey('marine', $payload['data'] ?? []);
        $this->assertArrayNotHasKey('insights', $payload['data'] ?? []);

    }

    public function test_bundle_skips_marine_for_non_coastal_city_even_if_requested(): void
    {
        $this->bindTenant('canelinha-sc');

        $service = Mockery::mock(WeatherServiceV2::class);
        $service->shouldReceive('providerName')->andReturn('open_meteo');
        $service->shouldReceive('getSection')->never();

        $insights = Mockery::mock(WeatherInsightsService::class);
        $insights->shouldReceive('generateInsights')->never();

        $this->app->instance(WeatherServiceV2::class, $service);
        $this->app->instance(WeatherInsightsService::class, $insights);

        $response = $this->getJson('/api/v1/weather/bundle?sections=marine');

        $this->assertSame(200, $response->status(), $response->getContent());
        $response->assertJsonPath('location.city_slug', 'canelinha-sc');
        $response->assertJsonPath('location.is_coastal', false);
        $response->assertJsonPath('errors.marine', null);

        $payload = $response->json();
        $this->assertArrayNotHasKey('marine', $payload['data'] ?? []);
    }

    public function test_bundle_keeps_payload_when_one_section_fails(): void
    {
        $this->bindTenant('tijucas-sc');

        $service = Mockery::mock(WeatherServiceV2::class);
        $service->shouldReceive('providerName')->andReturn('open_meteo');
        $service->shouldReceive('getSection')->twice()->andReturnUsing(function ($city, $options, $section): array {
            if ($section === 'forecast') {
                return $this->forecastEnvelope();
            }

            throw new RuntimeException('Marine provider timeout');
        });

        $insights = Mockery::mock(WeatherInsightsService::class);
        $insights->shouldReceive('generateInsights')->never();

        $this->app->instance(WeatherServiceV2::class, $service);
        $this->app->instance(WeatherInsightsService::class, $insights);

        $response = $this->getJson('/api/v1/weather/bundle?sections=current,marine');

        $this->assertSame(200, $response->status(), $response->getContent());
        $response->assertJsonPath('errors.forecast', null);
        $response->assertJsonPath('errors.marine.code', 'MARINE_UNAVAILABLE');
        $response->assertJsonPath('data.current.temperature_2m', 26.4);
        $response->assertJsonPath('data.marine', null);
        $response->assertJsonPath('cache.degraded', true);

        $reason = (string) ($response->json('cache.degraded_reason') ?? '');
        $this->assertStringContainsString('section_error', $reason);
    }

    public function test_bundle_emits_sections_and_payload_metrics(): void
    {
        Log::spy();

        $this->bindTenant('tijucas-sc');

        $service = Mockery::mock(WeatherServiceV2::class);
        $service->shouldReceive('providerName')->andReturn('open_meteo');
        $service->shouldReceive('getSection')->once()->andReturn($this->forecastEnvelope());

        $insights = Mockery::mock(WeatherInsightsService::class);
        $insights->shouldReceive('generateInsights')->never();

        $this->app->instance(WeatherServiceV2::class, $service);
        $this->app->instance(WeatherInsightsService::class, $insights);

        $response = $this->getJson('/api/v1/weather/bundle?sections=current,hourly');

        $this->assertSame(200, $response->status(), $response->getContent());

        Log::shouldHaveReceived('info')
            ->with('weather_metric', Mockery::on(static function (array $context): bool {
                return ($context['metric'] ?? null) === 'bundle.sections_requested'
                    && ($context['value'] ?? null) === 2
                    && ($context['sections_csv'] ?? null) === 'current,hourly'
                    && ($context['city_slug'] ?? null) === 'tijucas-sc';
            }))
            ->once();

        Log::shouldHaveReceived('info')
            ->with('weather_metric', Mockery::on(static function (array $context): bool {
                return ($context['metric'] ?? null) === 'bundle.payload_kb'
                    && is_numeric($context['value'] ?? null)
                    && ($context['payload_bytes'] ?? 0) > 0;
            }))
            ->once();
    }

    public function test_bundle_returns_404_when_weather_v2_rollout_is_disabled_for_city(): void
    {
        config()->set('weather.v2.enabled', true);
        config()->set('weather.v2.rollout_mode', 'canary');
        config()->set('weather.v2.canary_cities', ['porto-belo-sc']);

        $this->bindTenant('tijucas-sc');

        $service = Mockery::mock(WeatherServiceV2::class);
        $service->shouldReceive('providerName')->never();
        $service->shouldReceive('getSection')->never();

        $insights = Mockery::mock(WeatherInsightsService::class);
        $insights->shouldReceive('generateInsights')->never();

        $this->app->instance(WeatherServiceV2::class, $service);
        $this->app->instance(WeatherInsightsService::class, $insights);

        $response = $this->getJson('/api/v1/weather/bundle?sections=current');

        $this->assertSame(404, $response->status(), $response->getContent());
        $response->assertJsonPath('error', 'WEATHER_V2_DISABLED');
        $response->assertJsonPath('city_slug', 'tijucas-sc');
    }

    /**
     * @return array{
     *   data:array<string, mixed>,
     *   cache:array<string, mixed>
     * }
     */
    private function forecastEnvelope(): array
    {
        return [
            'data' => [
                'current' => [
                    'temperature_2m' => 26.4,
                    'weather_code' => 0,
                ],
                'hourly' => [
                    'time' => ['2026-02-08T12:00'],
                    'temperature_2m' => [26.4],
                ],
                'daily' => [
                    'time' => ['2026-02-08'],
                    'temperature_2m_max' => [29.0],
                    'temperature_2m_min' => [21.0],
                ],
            ],
            'cache' => [
                'generated_at_utc' => '2026-02-08T12:00:00Z',
                'expires_at_utc' => '2026-02-08T12:15:00Z',
                'stale_until_utc' => '2026-02-08T16:00:00Z',
                'degraded' => false,
                'degraded_reason' => null,
            ],
        ];
    }

    private function bindTenant(string $citySlug): void
    {
        /** @var City|null $city */
        $city = City::query()->where('slug', $citySlug)->first();
        $this->assertNotNull($city);

        app()->instance('tenant.city', $city);
        app()->instance('tenant.key', 'test-tenant-key');
        app()->instance('tenant.timezone', (string) ($city->timezone ?? 'America/Sao_Paulo'));
    }
}
