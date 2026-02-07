<?php

namespace Tests\Unit\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class RateLimiterTenantScopeTest extends TestCase
{
    public function test_forum_rate_limiter_is_tenant_scoped_for_authenticated_users(): void
    {
        $limiter = RateLimiter::limiter('forum');
        $this->assertIsCallable($limiter);

        $request = Request::create('/api/v1/forum/topics', 'GET');
        $request->attributes->set('tenant_city_id', 'city-a');
        $request->setUserResolver(static fn() => (object) ['id' => 'user-123']);

        /** @var Limit $limit */
        $limit = $limiter($request);

        $this->assertSame('city-a:forum:user:user-123', $limit->key);
        $this->assertSame(60, $limit->maxAttempts);
    }

    public function test_forum_rate_limiter_is_tenant_scoped_for_anonymous_users(): void
    {
        $limiter = RateLimiter::limiter('forum');
        $this->assertIsCallable($limiter);

        $request = Request::create('/api/v1/forum/topics', 'GET');
        $request->attributes->set('tenant_city_id', 'city-b');
        $request->server->set('REMOTE_ADDR', '203.0.113.10');

        /** @var Limit $limit */
        $limit = $limiter($request);

        $this->assertSame('city-b:forum:ip:203.0.113.10', $limit->key);
        $this->assertSame(20, $limit->maxAttempts);
    }
}
