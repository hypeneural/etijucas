<?php

namespace Tests\Unit\Services;

use App\Services\ModuleResolver;
use Tests\TestCase;

class ModuleResolverTest extends TestCase
{
    public function test_city_override_true_always_enables_module(): void
    {
        $this->assertTrue(ModuleResolver::resolveEnabledState(true, false));
        $this->assertTrue(ModuleResolver::resolveEnabledState(true, true));
    }

    public function test_city_override_false_always_disables_module(): void
    {
        $this->assertFalse(ModuleResolver::resolveEnabledState(false, false));
        $this->assertFalse(ModuleResolver::resolveEnabledState(false, true));
    }

    public function test_core_module_is_enabled_when_no_city_override_exists(): void
    {
        $this->assertTrue(ModuleResolver::resolveEnabledState(null, true));
    }

    public function test_optional_module_is_disabled_when_no_city_override_exists(): void
    {
        $this->assertFalse(ModuleResolver::resolveEnabledState(null, false));
    }
}
