<?php

namespace Tests\Unit\Http\Middleware;

use App\Http\Middleware\RequireTenant;
use App\Models\City;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class RequireTenantTest extends TestCase
{
    public function test_rejects_request_without_tenant_city(): void
    {
        $middleware = new RequireTenant();
        $request = Request::create('/api/v1/home', 'GET');

        $response = $middleware->handle($request, fn() => new Response('ok', 200));

        $this->assertSame(400, $response->getStatusCode());
        $this->assertStringContainsString('TENANT_REQUIRED', $response->getContent());
    }

    public function test_rejects_request_resolved_only_by_fallback(): void
    {
        $middleware = new RequireTenant();
        $request = Request::create('/api/v1/home', 'GET');
        $request->attributes->set('tenant_city', new City());
        $request->attributes->set('tenant_resolution_source', 'fallback');

        $response = $middleware->handle($request, fn() => new Response('ok', 200));

        $this->assertSame(400, $response->getStatusCode());
        $this->assertStringContainsString('TENANT_REQUIRED', $response->getContent());
    }

    public function test_allows_request_with_explicit_tenant_source(): void
    {
        $middleware = new RequireTenant();
        $request = Request::create('/api/v1/home', 'GET');
        $request->attributes->set('tenant_city', new City());
        $request->attributes->set('tenant_resolution_source', 'header');

        $response = $middleware->handle($request, fn() => response()->json([
            'ok' => true,
        ]));

        $this->assertSame(200, $response->getStatusCode());
        $this->assertStringContainsString('"ok":true', $response->getContent());
    }
}
