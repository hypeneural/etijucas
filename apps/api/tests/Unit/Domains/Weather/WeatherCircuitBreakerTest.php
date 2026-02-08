<?php

namespace Tests\Unit\Domains\Weather;

use App\Domains\Weather\Support\WeatherCacheKeyFactory;
use App\Domains\Weather\Support\WeatherCircuitBreaker;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class WeatherCircuitBreakerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
    }

    public function test_opens_circuit_after_three_failures_within_window(): void
    {
        $breaker = new WeatherCircuitBreaker(new WeatherCacheKeyFactory());

        $this->assertFalse($breaker->isOpen('tijucas-sc', 'forecast'));
        $this->assertFalse($breaker->recordFailure('tijucas-sc', 'forecast'));
        $this->assertFalse($breaker->recordFailure('tijucas-sc', 'forecast'));
        $this->assertTrue($breaker->recordFailure('tijucas-sc', 'forecast'));
        $this->assertTrue($breaker->isOpen('tijucas-sc', 'forecast'));
    }

    public function test_record_success_resets_open_circuit_and_fail_counter(): void
    {
        $breaker = new WeatherCircuitBreaker(new WeatherCacheKeyFactory());

        $breaker->recordFailure('tijucas-sc', 'forecast');
        $breaker->recordFailure('tijucas-sc', 'forecast');
        $breaker->recordFailure('tijucas-sc', 'forecast');
        $this->assertTrue($breaker->isOpen('tijucas-sc', 'forecast'));

        $breaker->recordSuccess('tijucas-sc', 'forecast');
        $this->assertFalse($breaker->isOpen('tijucas-sc', 'forecast'));
    }
}
