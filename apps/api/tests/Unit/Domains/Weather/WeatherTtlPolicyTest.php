<?php

namespace Tests\Unit\Domains\Weather;

use App\Domains\Weather\Support\WeatherTtlPolicy;
use Tests\TestCase;

class WeatherTtlPolicyTest extends TestCase
{
    public function test_returns_expected_ttl_for_forecast_and_marine(): void
    {
        $policy = new WeatherTtlPolicy();

        $forecast = $policy->forSection('forecast');
        $marine = $policy->forSection('marine');

        $this->assertSame(['soft' => 900, 'hard' => 14400], $forecast);
        $this->assertSame(['soft' => 2700, 'hard' => 21600], $marine);
    }

    public function test_combines_ttl_for_multiple_sections(): void
    {
        $policy = new WeatherTtlPolicy();

        $ttl = $policy->forSections(['forecast', 'daily', 'marine']);

        $this->assertSame(900, $ttl['soft']);
        $this->assertSame(21600, $ttl['hard']);
    }
}
