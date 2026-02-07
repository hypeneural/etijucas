<?php

namespace Tests\Unit\Http\Middleware;

use App\Http\Middleware\FilamentTenantContext;
use App\Models\City;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Session\ArraySessionHandler;
use Illuminate\Session\Store;
use Mockery;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class FilamentTenantContextTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();

        parent::tearDown();
    }

    public function test_admin_uses_request_tenant_as_fallback_and_persists_session(): void
    {
        $middleware = new FilamentTenantContext();
        $city = new City();
        $city->forceFill([
            'id' => 'city-1',
            'slug' => 'tijucas-sc',
            'name' => 'Tijucas',
            'active' => true,
        ]);

        $user = Mockery::mock(User::class)->makePartial();
        $user->forceFill(['id' => 'user-1']);
        $user->city_id = null;
        $user->shouldReceive('hasRole')->with('moderator')->andReturn(false);
        $user->shouldReceive('hasRole')->with('admin')->andReturn(true);

        $request = Request::create('/admin', 'GET');
        $request->attributes->set('tenant_city', $city);
        $request->setUserResolver(static fn() => $user);
        $request->setLaravelSession(new Store('test', new ArraySessionHandler(120)));

        $response = $middleware->handle($request, static fn() => new Response('ok', 200));

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('city-1', $request->session()->get('filament.tenant_city_id'));
        $this->assertSame('city-1', $request->attributes->get('tenant_city_id'));
        $this->assertSame('filament_admin_switcher', $request->attributes->get('tenant_resolution_source'));
    }
}
