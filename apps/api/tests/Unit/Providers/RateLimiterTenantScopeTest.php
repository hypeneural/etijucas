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

    public function test_reports_create_rate_limiter_is_tenant_and_ip_scoped(): void
    {
        $limiter = RateLimiter::limiter('reports-create');
        $this->assertIsCallable($limiter);

        $request = Request::create('/api/v1/reports', 'POST');
        $request->attributes->set('tenant_city_id', 'city-a');
        $request->server->set('REMOTE_ADDR', '203.0.113.50');

        /** @var Limit $limit */
        $limit = $limiter($request);

        $this->assertSame('city-a:reports:create:ip:203.0.113.50', $limit->key);
        $this->assertSame(10, $limit->maxAttempts);
    }

    public function test_reports_media_rate_limiter_is_tenant_and_ip_scoped(): void
    {
        $limiter = RateLimiter::limiter('reports-media');
        $this->assertIsCallable($limiter);

        $request = Request::create('/api/v1/reports/00000000-0000-0000-0000-000000000001/media', 'POST');
        $request->attributes->set('tenant_city_id', 'city-a');
        $request->server->set('REMOTE_ADDR', '203.0.113.51');

        /** @var Limit $limit */
        $limit = $limiter($request);

        $this->assertSame('city-a:reports:media:ip:203.0.113.51', $limit->key);
        $this->assertSame(30, $limit->maxAttempts);
    }

    public function test_reports_create_limit_is_isolated_per_tenant(): void
    {
        RateLimiter::clear('city-a:reports:create:ip:203.0.113.52');
        RateLimiter::clear('city-b:reports:create:ip:203.0.113.52');

        $limiter = RateLimiter::limiter('reports-create');
        $this->assertIsCallable($limiter);

        $requestTenantA = Request::create('/api/v1/reports', 'POST');
        $requestTenantA->attributes->set('tenant_city_id', 'city-a');
        $requestTenantA->server->set('REMOTE_ADDR', '203.0.113.52');

        /** @var Limit $limitTenantA */
        $limitTenantA = $limiter($requestTenantA);

        for ($attempt = 0; $attempt < $limitTenantA->maxAttempts; $attempt++) {
            RateLimiter::hit($limitTenantA->key, 3600);
        }

        $this->assertTrue(
            RateLimiter::tooManyAttempts($limitTenantA->key, $limitTenantA->maxAttempts)
        );

        $requestTenantB = Request::create('/api/v1/reports', 'POST');
        $requestTenantB->attributes->set('tenant_city_id', 'city-b');
        $requestTenantB->server->set('REMOTE_ADDR', '203.0.113.52');

        /** @var Limit $limitTenantB */
        $limitTenantB = $limiter($requestTenantB);

        $this->assertNotSame($limitTenantA->key, $limitTenantB->key);
        $this->assertFalse(
            RateLimiter::tooManyAttempts($limitTenantB->key, $limitTenantB->maxAttempts)
        );
    }
}
