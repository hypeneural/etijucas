<?php

namespace Tests\Unit\Domains\Weather;

use App\Domains\Weather\Support\WeatherRollout;
use Tests\TestCase;

class WeatherRolloutTest extends TestCase
{
    public function test_all_mode_enables_v2_for_any_city_when_globally_enabled(): void
    {
        config()->set('weather.v2.enabled', true);
        config()->set('weather.v2.rollout_mode', 'all');
        config()->set('weather.v2.canary_cities', ['tijucas-sc']);

        $this->assertTrue(WeatherRollout::isV2EnabledForCity('tijucas-sc'));
        $this->assertTrue(WeatherRollout::isV2EnabledForCity('canelinha-sc'));
    }

    public function test_canary_mode_only_enables_listed_cities(): void
    {
        config()->set('weather.v2.enabled', true);
        config()->set('weather.v2.rollout_mode', 'canary');
        config()->set('weather.v2.canary_cities', ['tijucas-sc', 'porto-belo-sc']);

        $this->assertTrue(WeatherRollout::isV2EnabledForCity('tijucas-sc'));
        $this->assertTrue(WeatherRollout::isV2EnabledForCity('porto-belo-sc'));
        $this->assertFalse(WeatherRollout::isV2EnabledForCity('canelinha-sc'));
    }

    public function test_off_mode_or_global_disabled_returns_false(): void
    {
        config()->set('weather.v2.enabled', true);
        config()->set('weather.v2.rollout_mode', 'off');
        $this->assertFalse(WeatherRollout::isV2EnabledForCity('tijucas-sc'));

        config()->set('weather.v2.enabled', false);
        config()->set('weather.v2.rollout_mode', 'all');
        $this->assertFalse(WeatherRollout::isV2EnabledForCity('tijucas-sc'));
    }
}

