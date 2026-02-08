<?php

namespace Tests\Unit\Domains\Weather;

use App\Domains\Weather\Support\WeatherCacheKeyFactory;
use Tests\TestCase;

class WeatherCacheKeyFactoryTest extends TestCase
{
    public function test_builds_expected_bundle_key_with_sorted_sections(): void
    {
        $keys = new WeatherCacheKeyFactory();

        $key = $keys->bundle(
            citySlug: 'tijucas-sc',
            timezone: 'America/Sao_Paulo',
            units: 'metric',
            days: 7,
            sections: ['marine', 'current', 'daily']
        );

        $this->assertSame(
            'weather:bundle:tijucas-sc:tz:America/Sao_Paulo:u:metric:days:7:sections:current,daily,marine:v1',
            $key
        );
    }

    public function test_builds_expected_section_key(): void
    {
        $keys = new WeatherCacheKeyFactory();

        $key = $keys->section('forecast', 'porto-belo-sc', 'America/Sao_Paulo', 'metric', 10);

        $this->assertSame(
            'weather:forecast:porto-belo-sc:tz:America/Sao_Paulo:u:metric:days:10:v1',
            $key
        );
    }
}
