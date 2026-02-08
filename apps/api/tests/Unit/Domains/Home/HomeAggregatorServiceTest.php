<?php

namespace Tests\Unit\Domains\Home;

use App\Domains\Home\Services\HomeAggregatorService;
use App\Domains\Weather\Contracts\WeatherOptions;
use App\Domains\Weather\Services\WeatherInsightsService;
use App\Domains\Weather\Services\WeatherServiceV2;
use App\Models\City;
use Illuminate\Support\Facades\Cache;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class HomeAggregatorServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    protected function tearDown(): void
    {
        Cache::flush();
        Mockery::close();

        app()->forgetInstance('tenant.city');
        app()->forgetInstance('tenant.key');
        app()->forgetInstance('tenant.timezone');

        parent::tearDown();
    }

    public function test_weather_block_uses_insight_message_from_list_payload(): void
    {
        $city = $this->tenantCity('tijucas-sc', 'Tijucas', true);
        app()->instance('tenant.city', $city);

        $weatherService = Mockery::mock(WeatherServiceV2::class);
        $weatherService->shouldReceive('getSection')
            ->twice()
            ->andReturnUsing(function (City $receivedCity, WeatherOptions $options, string $section): array {
                $this->assertSame('America/Sao_Paulo', $options->timezone);

                if ($section === 'forecast') {
                    return [
                        'data' => [
                            'current' => [
                                'temperature_2m' => 27.2,
                                'weather_code' => 1,
                            ],
                        ],
                    ];
                }

                return [
                    'data' => [
                        'hourly' => [
                            'time' => ['2026-02-08T12:00'],
                            'wave_height' => [0.5],
                        ],
                    ],
                ];
            });

        $insightsService = Mockery::mock(WeatherInsightsService::class);
        $insightsService->shouldReceive('generateInsights')
            ->once()
            ->andReturn([
                [
                    'type' => 'beach',
                    'message' => 'Excelente para praia',
                    'severity' => 'success',
                ],
            ]);

        $service = new HomeAggregatorService($weatherService, $insightsService);
        $response = $service->getHomeData(include: ['weather']);

        $weatherBlock = collect($response['blocks'] ?? [])->firstWhere('type', 'weather_mini');

        $this->assertIsArray($weatherBlock);
        $this->assertSame(27, $weatherBlock['payload']['temp'] ?? null);
        $this->assertSame('Excelente para praia', $weatherBlock['payload']['frase'] ?? null);
    }

    public function test_weather_block_fallback_phrase_uses_tenant_city_name_when_provider_fails(): void
    {
        $city = $this->tenantCity('canelinha-sc', 'Canelinha', false);
        app()->instance('tenant.city', $city);

        $weatherService = Mockery::mock(WeatherServiceV2::class);
        $weatherService->shouldReceive('getSection')
            ->once()
            ->andThrow(new RuntimeException('provider timeout'));

        $insightsService = Mockery::mock(WeatherInsightsService::class);
        $insightsService->shouldReceive('generateInsights')->never();

        $service = new HomeAggregatorService($weatherService, $insightsService);
        $response = $service->getHomeData(include: ['weather']);

        $weatherBlock = collect($response['blocks'] ?? [])->firstWhere('type', 'weather_mini');

        $this->assertIsArray($weatherBlock);
        $this->assertStringContainsString('Canelinha', (string) ($weatherBlock['payload']['frase'] ?? ''));
        $this->assertStringNotContainsString('Tijucas', (string) ($weatherBlock['payload']['frase'] ?? ''));
    }

    private function tenantCity(string $slug, string $name, bool $isCoastal): City
    {
        $city = new City();
        $city->forceFill([
            'id' => '00000000-0000-0000-0000-00000000' . ($isCoastal ? '0001' : '0002'),
            'slug' => $slug,
            'name' => $name,
            'timezone' => 'America/Sao_Paulo',
            'status' => 'active',
            'is_coastal' => $isCoastal,
        ]);

        return $city;
    }
}
