<?php

namespace Tests\Unit\Domains\Weather;

use App\Domains\Weather\Providers\OpenMeteoProvider;
use Tests\TestCase;

class OpenMeteoProviderTest extends TestCase
{
    public function test_reports_capabilities_contract(): void
    {
        $provider = new OpenMeteoProvider();

        $this->assertSame('open_meteo', $provider->name());
        $this->assertSame([
            'hasMarine' => true,
            'supportsTimezone' => true,
            'maxDays' => 16,
        ], $provider->capabilities());
    }
}
