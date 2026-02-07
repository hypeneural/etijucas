<?php

namespace Tests\Feature\Tenancy;

use App\Http\Controllers\Api\V1\ConfigController;
use App\Http\Middleware\TenantContext;
use App\Http\Middleware\FilamentTenantContext;
use App\Models\City;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Session\ArraySessionHandler;
use Illuminate\Session\Store;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Mockery;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class MultiCityIsolationE2ETest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('city_modules');
        Schema::dropIfExists('modules');
        Schema::dropIfExists('city_domains');
        Schema::dropIfExists('bairros');
        Schema::dropIfExists('cities');

        Schema::create('cities', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('uf', 2)->default('SC');
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('city_domains', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('city_id');
            $table->string('domain');
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
        });

        Schema::create('modules', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('module_key')->unique();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('name_ptbr')->nullable();
            $table->string('route_slug_ptbr')->nullable();
            $table->string('icon')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_core')->default(false);
            $table->unsignedInteger('current_version')->default(1);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('city_modules', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('city_id');
            $table->uuid('module_id');
            $table->boolean('enabled')->default(false);
            $table->unsignedInteger('version')->default(1);
            $table->json('settings')->nullable();
            $table->timestamps();
            $table->unique(['city_id', 'module_id']);
        });

        Schema::create('bairros', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('city_id');
            $table->string('nome');
            $table->string('slug')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        DB::table('cities')->insert([
            [
                'id' => '00000000-0000-0000-0000-0000000000a1',
                'name' => 'Tijucas',
                'slug' => 'tijucas-sc',
                'uf' => 'SC',
                'active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => '00000000-0000-0000-0000-0000000000b1',
                'name' => 'Itajai',
                'slug' => 'itajai-sc',
                'uf' => 'SC',
                'active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        DB::table('modules')->insert([
            'id' => '00000000-0000-0000-0000-0000000000m1',
            'module_key' => 'forum',
            'slug' => 'forum',
            'name' => 'Forum',
            'name_ptbr' => 'Forum',
            'route_slug_ptbr' => 'forum',
            'is_core' => 0,
            'current_version' => 1,
            'sort_order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('city_modules')->insert([
            'id' => '00000000-0000-0000-0000-0000000000cm',
            'city_id' => '00000000-0000-0000-0000-0000000000a1',
            'module_id' => '00000000-0000-0000-0000-0000000000m1',
            'enabled' => 1,
            'version' => 1,
            'settings' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Cache::forget('city_domains:map');
    }

    protected function tearDown(): void
    {
        Mockery::close();
        Cache::forget('city_domains:map');
        app()->forgetInstance('tenant.city');
        app()->forgetInstance('tenant.resolution_source');

        Schema::dropIfExists('city_modules');
        Schema::dropIfExists('modules');
        Schema::dropIfExists('city_domains');
        Schema::dropIfExists('bairros');
        Schema::dropIfExists('cities');

        parent::tearDown();
    }

    public function test_api_and_web_routes_keep_city_isolation(): void
    {
        $tenantContext = new TenantContext();
        $configController = new ConfigController();

        $requestA = Request::create('/api/v1/config', 'GET');
        $requestA->headers->set('Host', 'localhost');
        $requestA->headers->set('X-City', 'tijucas-sc');

        $responseA = $tenantContext->handle(
            $requestA,
            static fn(Request $request) => $configController->bootstrap($request)
        );

        $this->assertSame(200, $responseA->getStatusCode());
        $payloadA = json_decode((string) $responseA->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('tijucas-sc', $payloadA['data']['city']['slug'] ?? null);
        $this->assertContains('forum', array_column($payloadA['data']['modules'] ?? [], 'key'));

        app()->forgetInstance('tenant.city');
        app()->forgetInstance('tenant.resolution_source');

        $requestB = Request::create('/api/v1/config', 'GET');
        $requestB->headers->set('Host', 'localhost');
        $requestB->headers->set('X-City', 'itajai-sc');

        $responseB = $tenantContext->handle(
            $requestB,
            static fn(Request $request) => $configController->bootstrap($request)
        );

        $this->assertSame(200, $responseB->getStatusCode());
        $payloadB = json_decode((string) $responseB->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('itajai-sc', $payloadB['data']['city']['slug'] ?? null);
        $this->assertNotContains('forum', array_column($payloadB['data']['modules'] ?? [], 'key'));

        $this->get('http://localhost/sc/tijucas')->assertOk();
        $this->get('http://localhost/sc/itajai')->assertOk();
    }

    public function test_filament_moderator_stays_locked_to_own_city(): void
    {
        $middleware = new FilamentTenantContext();

        $requestTenant = new City();
        $requestTenant->forceFill([
            'id' => '00000000-0000-0000-0000-0000000000b1',
            'slug' => 'itajai-sc',
            'name' => 'Itajai',
            'active' => true,
        ]);

        $moderator = Mockery::mock(User::class)->makePartial();
        $moderator->forceFill(['id' => 'user-mod-1']);
        $moderator->city_id = '00000000-0000-0000-0000-0000000000a1';
        $moderator->shouldReceive('hasRole')->with('moderator')->andReturn(true);

        $request = Request::create('/admin?tenant_city=itajai-sc', 'GET');
        $request->attributes->set('tenant_city', $requestTenant);
        $request->setUserResolver(static fn() => $moderator);
        $request->setLaravelSession(new Store('test', new ArraySessionHandler(120)));
        $request->session()->put('filament.tenant_city_id', '00000000-0000-0000-0000-0000000000b1');

        $response = $middleware->handle($request, static fn() => new Response('ok', 200));

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('00000000-0000-0000-0000-0000000000a1', $request->attributes->get('tenant_city_id'));
        $this->assertSame('filament_user_lock', $request->attributes->get('tenant_resolution_source'));
    }
}
