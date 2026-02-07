<?php

namespace Tests\Unit\Support;

use App\Models\City;
use App\Support\TenantCache;
use Tests\TestCase;

class TenantCacheTest extends TestCase
{
    protected function tearDown(): void
    {
        app()->forgetInstance('tenant.city');
        app()->forgetInstance('tenant.resolution_source');

        parent::tearDown();
    }

    public function test_returns_global_prefix_when_tenant_is_not_set(): void
    {
        $this->assertSame('global:config', TenantCache::key('config'));
    }

    public function test_cache_values_are_isolated_between_cities_for_same_key(): void
    {
        $this->bindTenant('00000000-0000-0000-0000-0000000000c1', 'cidade-a');
        TenantCache::remember('api:v1:config:host=portal.local', 60, static fn() => ['city' => 'A']);

        $this->bindTenant('00000000-0000-0000-0000-0000000000c2', 'cidade-b');
        TenantCache::remember('api:v1:config:host=portal.local', 60, static fn() => ['city' => 'B']);

        $this->bindTenant('00000000-0000-0000-0000-0000000000c1', 'cidade-a');
        $cityAValue = TenantCache::get('api:v1:config:host=portal.local');
        $this->assertSame(['city' => 'A'], $cityAValue);

        $this->bindTenant('00000000-0000-0000-0000-0000000000c2', 'cidade-b');
        $cityBValue = TenantCache::get('api:v1:config:host=portal.local');
        $this->assertSame(['city' => 'B'], $cityBValue);
    }

    private function bindTenant(string $cityId, string $slug): void
    {
        $city = new City();
        $city->forceFill([
            'id' => $cityId,
            'slug' => $slug,
        ]);

        app()->instance('tenant.city', $city);
        app()->instance('tenant.resolution_source', 'test');
    }
}

