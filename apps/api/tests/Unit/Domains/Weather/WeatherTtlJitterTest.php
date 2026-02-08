<?php

namespace Tests\Unit\Domains\Weather;

use App\Domains\Weather\Support\WeatherTtlJitter;
use Tests\TestCase;

class WeatherTtlJitterTest extends TestCase
{
    public function test_applies_jitter_within_expected_range(): void
    {
        $jitter = new WeatherTtlJitter(0.10);

        $value = $jitter->apply(1000);

        $this->assertGreaterThanOrEqual(900, $value);
        $this->assertLessThanOrEqual(1100, $value);
    }

    public function test_never_returns_less_than_one_second(): void
    {
        $jitter = new WeatherTtlJitter(0.10);

        $value = $jitter->apply(1);

        $this->assertSame(1, $value);
    }
}
