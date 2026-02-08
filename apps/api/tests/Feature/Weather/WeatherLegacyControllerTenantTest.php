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
use Illuminate\Support\Facades\Schema;
use Mockery;
use Tests\TestCase;

class WeatherLegacyControllerTenantTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware([
            TenantContext::class,
            RequireTenant::class,
        ]);

        config()->set('tenancy.trusted_hosts', ['localhost', '127.0.0.1']);
        config()->set('tenancy.allow_header_override', true);

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

        Cache::forget('city_domains:map');
    }

    protected function tearDown(): void
    {
        Mockery::close();
        Cache::forget('city_domains:map');
        app()->forgetInstance('tenant.city');
        app()->forgetInstance('tenant.key');
        app()->forgetInstance('tenant.timezone');
        Schema::dropIfExists('city_domains');
        Schema::dropIfExists('cities');

        parent::tearDown();
    }

    public function test_forecast_uses_tenant_city_location_instead_of_hardcoded_tijucas(): void
    {
        $this->bindTenant('canelinha-sc');

        $weatherService = Mockery::mock(WeatherServiceV2::class);
        $weatherService->shouldReceive('providerName')->andReturn('open_meteo');
        $weatherService->shouldReceive('getSection')
            ->once()
            ->withArgs(function (City $city, $options, string $section): bool {
                return $city->slug === 'canelinha-sc' &&
                    $section === 'forecast' &&
                    $options->timezone === 'America/Sao_Paulo';
            })
            ->andReturn([
                'data' => [
                    'current' => [
                        'temperature_2m' => 24.2,
                        'apparent_temperature' => 25.0,
                        'weather_code' => 1,
                        'precipitation' => 0,
                        'wind_speed_10m' => 12,
                        'wind_gusts_10m' => 20,
                        'wind_direction_10m' => 70,
                        'cloud_cover' => 30,
                    ],
                    'hourly' => [
                        'time' => ['2099-01-01T12:00'],
                        'temperature_2m' => [24.2],
                        'precipitation_probability' => [20],
                        'precipitation' => [0],
                        'weather_code' => [1],
                        'wind_speed_10m' => [12],
                        'wind_gusts_10m' => [20],
                        'wind_direction_10m' => [70],
                        'uv_index' => [5],
                        'cloud_cover' => [30],
                    ],
                    'daily' => [
                        'time' => ['2099-01-01'],
                        'weather_code' => [1],
                        'temperature_2m_min' => [18],
                        'temperature_2m_max' => [28],
                        'precipitation_sum' => [0],
                        'precipitation_probability_max' => [20],
                        'wind_speed_10m_max' => [18],
                        'wind_gusts_10m_max' => [25],
                        'wind_direction_10m_dominant' => [80],
                        'sunrise' => ['2099-01-01T06:00'],
                        'sunset' => ['2099-01-01T19:00'],
                        'uv_index_max' => [8],
                    ],
                ],
                'cache' => [
                    'cached' => true,
                    'stale' => false,
                    'status' => 'hit',
                    'etag' => 'etag-forecast',
                    'generated_at_utc' => '2026-02-08T12:00:00Z',
                    'expires_at_utc' => '2026-02-08T12:30:00Z',
                ],
            ]);

        $insightsService = Mockery::mock(WeatherInsightsService::class);

        $this->app->instance(WeatherServiceV2::class, $weatherService);
        $this->app->instance(WeatherInsightsService::class, $insightsService);

        $response = $this->getJson('/api/v1/weather/forecast?days=1&hours=1');

        $this->assertSame(200, $response->status(), $response->getContent());
        $response->assertJsonPath('location.key', 'canelinha_sc');
        $response->assertJsonPath('location.name', 'Canelinha/SC');
        $response->assertJsonPath('location.timezone', 'America/Sao_Paulo');
        $response->assertJsonPath('current.temp_c', 24.2);
        $this->assertStringNotContainsString('Tijucas', $response->getContent());
    }

    public function test_marine_returns_empty_for_non_coastal_city_without_provider_fetch(): void
    {
        $this->bindTenant('canelinha-sc');

        $weatherService = Mockery::mock(WeatherServiceV2::class);
        $weatherService->shouldReceive('providerName')->andReturn('open_meteo');
        $weatherService->shouldReceive('getSection')->never();

        $insightsService = Mockery::mock(WeatherInsightsService::class);

        $this->app->instance(WeatherServiceV2::class, $weatherService);
        $this->app->instance(WeatherInsightsService::class, $insightsService);

        $response = $this->getJson('/api/v1/weather/marine?days=1&hours=4');

        $this->assertSame(200, $response->status(), $response->getContent());
        $response->assertJsonPath('location.key', 'canelinha_sc');
        $response->assertJsonPath('location.name', 'Canelinha/SC');
        $response->assertJsonPath('hourly', []);
        $response->assertJsonPath('daily', []);
    }

    private function bindTenant(string $slug): void
    {
        /** @var City|null $city */
        $city = City::query()->where('slug', $slug)->first();
        $this->assertNotNull($city);

        app()->instance('tenant.city', $city);
        app()->instance('tenant.key', 'test-tenant-key');
        app()->instance('tenant.timezone', (string) ($city->timezone ?? 'America/Sao_Paulo'));
    }
}
