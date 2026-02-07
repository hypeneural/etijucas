<?php

namespace Tests\Unit\Http\Middleware;

use App\Http\Middleware\FilamentTenantContext;
use App\Models\City;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Session\ArraySessionHandler;
use Illuminate\Session\Store;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Mockery;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class FilamentTenantContextTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('cities');
        Schema::create('cities', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        DB::table('cities')->insert([
            [
                'id' => '00000000-0000-0000-0000-0000000000c1',
                'name' => 'Cidade A',
                'slug' => 'cidade-a',
                'active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => '00000000-0000-0000-0000-0000000000c2',
                'name' => 'Cidade B',
                'slug' => 'cidade-b',
                'active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        app()->forgetInstance('tenant.city');
        app()->forgetInstance('tenant.resolution_source');
        Schema::dropIfExists('cities');

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

    public function test_moderator_is_locked_to_own_city_even_with_different_request_tenant(): void
    {
        $middleware = new FilamentTenantContext();

        $requestTenant = new City();
        $requestTenant->forceFill([
            'id' => '00000000-0000-0000-0000-0000000000c2',
            'slug' => 'cidade-b',
            'name' => 'Cidade B',
            'active' => true,
        ]);

        $user = Mockery::mock(User::class)->makePartial();
        $user->forceFill(['id' => 'user-mod-1']);
        $user->city_id = '00000000-0000-0000-0000-0000000000c1';
        $user->shouldReceive('hasRole')->with('moderator')->andReturn(true);

        $request = Request::create('/admin?tenant_city=cidade-b', 'GET');
        $request->attributes->set('tenant_city', $requestTenant);
        $request->setUserResolver(static fn() => $user);
        $request->setLaravelSession(new Store('test', new ArraySessionHandler(120)));
        $request->session()->put('filament.tenant_city_id', '00000000-0000-0000-0000-0000000000c2');

        $response = $middleware->handle($request, static fn() => new Response('ok', 200));

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('00000000-0000-0000-0000-0000000000c1', $request->attributes->get('tenant_city_id'));
        $this->assertSame('filament_user_lock', $request->attributes->get('tenant_resolution_source'));
    }

    public function test_admin_switcher_changes_tenant_by_query_slug(): void
    {
        $middleware = new FilamentTenantContext();

        $user = Mockery::mock(User::class)->makePartial();
        $user->forceFill(['id' => 'user-admin-1']);
        $user->city_id = null;
        $user->shouldReceive('hasRole')->with('moderator')->andReturn(false);
        $user->shouldReceive('hasRole')->with('admin')->andReturn(true);

        $request = Request::create('/admin?tenant_city=cidade-b', 'GET');
        $request->setUserResolver(static fn() => $user);
        $request->setLaravelSession(new Store('test', new ArraySessionHandler(120)));
        $request->session()->put('filament.tenant_city_id', '00000000-0000-0000-0000-0000000000c1');

        $response = $middleware->handle($request, static fn() => new Response('ok', 200));

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('00000000-0000-0000-0000-0000000000c2', $request->session()->get('filament.tenant_city_id'));
        $this->assertSame('00000000-0000-0000-0000-0000000000c2', $request->attributes->get('tenant_city_id'));
        $this->assertSame('filament_admin_switcher', $request->attributes->get('tenant_resolution_source'));
    }
}
