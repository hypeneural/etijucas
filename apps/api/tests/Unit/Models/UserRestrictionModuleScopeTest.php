<?php

namespace Tests\Unit\Models;

use App\Domain\Moderation\Enums\RestrictionScope;
use App\Models\UserRestriction;
use Tests\TestCase;

class UserRestrictionModuleScopeTest extends TestCase
{
    public function test_global_scope_resolves_to_null_module_key(): void
    {
        $this->assertNull(UserRestriction::normalizeScopeModuleKey(RestrictionScope::Global, null));
    }

    public function test_scope_defaults_to_expected_module_key(): void
    {
        $this->assertSame('forum', UserRestriction::normalizeScopeModuleKey(RestrictionScope::Forum, null));
        $this->assertSame('reports', UserRestriction::normalizeScopeModuleKey(RestrictionScope::Reports, null));
    }

    public function test_explicit_scope_module_key_is_normalized(): void
    {
        $this->assertSame('forum', UserRestriction::normalizeScopeModuleKey(RestrictionScope::Forum, '  FORUM  '));
    }
}
