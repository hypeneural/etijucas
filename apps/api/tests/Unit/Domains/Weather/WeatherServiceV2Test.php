<?php

namespace Tests\Unit\Domains\Weather;

use App\Domains\Weather\Contracts\WeatherOptions;
use App\Domains\Weather\Contracts\WeatherProviderInterface;
use App\Domains\Weather\Services\WeatherServiceV2;
use App\Domains\Weather\Support\WeatherNormalizer;
use App\Models\City;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class WeatherServiceV2Test extends TestCase
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

    public function test_get_marine_if_needed_returns_null_for_non_coastal_city(): void
    {
        $provider = new class implements WeatherProviderInterface {
            public function name(): string
            {
                return 'fake';
            }

            public function capabilities(): array
            {
                return ['hasMarine' => true, 'supportsTimezone' => true, 'maxDays' => 10];
            }

            public function forecast(float $lat, float $lon, WeatherOptions $options): array
            {
                return [];
            }

            public function marine(float $lat, float $lon, WeatherOptions $options): array
            {
                return ['hourly' => ['wave_height' => [1.2]], 'daily' => []];
            }
        };

        $service = new WeatherServiceV2($provider, new WeatherNormalizer());
        $city = new City();
        $city->forceFill([
            'slug' => 'canelinha-sc',
            'lat' => -27.24,
            'lon' => -48.63,
            'timezone' => 'America/Sao_Paulo',
            'is_coastal' => false,
        ]);

        $result = $service->getMarineIfNeeded($city, new WeatherOptions());

        $this->assertNull($result);
    }

    public function test_get_forecast_uses_city_timezone_when_not_provided_in_options(): void
    {
        $provider = new class implements WeatherProviderInterface {
            public ?string $receivedTimezone = null;

            public function name(): string
            {
                return 'fake';
            }

            public function capabilities(): array
            {
                return ['hasMarine' => true, 'supportsTimezone' => true, 'maxDays' => 10];
            }

            public function forecast(float $lat, float $lon, WeatherOptions $options): array
            {
                $this->receivedTimezone = $options->timezone;
                return ['current' => ['temperature_2m' => 23]];
            }

            public function marine(float $lat, float $lon, WeatherOptions $options): array
            {
                return [];
            }
        };

        $service = new WeatherServiceV2($provider, new WeatherNormalizer());
        $city = new City();
        $city->forceFill([
            'slug' => 'tijucas-sc',
            'lat' => -27.24,
            'lon' => -48.63,
            'timezone' => 'America/Sao_Paulo',
            'is_coastal' => true,
        ]);

        $forecast = $service->getForecast($city, new WeatherOptions(timezone: null));

        $this->assertSame('America/Sao_Paulo', $provider->receivedTimezone);
        $this->assertSame(23, $forecast['current']['temperature_2m']);
    }
}
