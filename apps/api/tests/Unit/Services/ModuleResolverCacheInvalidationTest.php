<?php

namespace Tests\Unit\Services;

use App\Services\ModuleResolver;
use App\Support\TenantCache;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class ModuleResolverCacheInvalidationTest extends TestCase
{
    public function test_clears_only_target_city_modules_cache(): void
    {
        TenantCache::rememberForCity('00000000-0000-0000-0000-0000000000c1', 'modules_effective', 60, static fn() => ['forum' => true]);
        TenantCache::rememberForCity('00000000-0000-0000-0000-0000000000c2', 'modules_effective', 60, static fn() => ['forum' => false]);

        $this->assertTrue(Cache::has('city:00000000-0000-0000-0000-0000000000c1:modules_effective'));
        $this->assertTrue(Cache::has('city:00000000-0000-0000-0000-0000000000c2:modules_effective'));

        ModuleResolver::clearCache('00000000-0000-0000-0000-0000000000c1');

        $this->assertFalse(Cache::has('city:00000000-0000-0000-0000-0000000000c1:modules_effective'));
        $this->assertTrue(Cache::has('city:00000000-0000-0000-0000-0000000000c2:modules_effective'));
    }
}

