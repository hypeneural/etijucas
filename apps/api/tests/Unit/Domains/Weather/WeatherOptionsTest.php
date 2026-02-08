<?php

namespace Tests\Unit\Domains\Weather;

use App\Domains\Weather\Contracts\WeatherOptions;
use Tests\TestCase;

class WeatherOptionsTest extends TestCase
{
    public function test_defaults_are_applied(): void
    {
        $options = new WeatherOptions();

        $this->assertSame(7, $options->forecastDays);
        $this->assertSame('metric', $options->units);
        $this->assertNull($options->timezone);
        $this->assertSame('pt', $options->lang);
        $this->assertSame('best_match', $options->model);
    }

    public function test_with_timezone_returns_new_instance_with_timezone(): void
    {
        $base = new WeatherOptions(forecastDays: 10, units: 'imperial', timezone: null, lang: 'pt', model: 'best_match');
        $updated = $base->withTimezone('America/Sao_Paulo');

        $this->assertNull($base->timezone);
        $this->assertSame('America/Sao_Paulo', $updated->timezone);
        $this->assertSame(10, $updated->forecastDays);
        $this->assertSame('imperial', $updated->units);
    }
}
