<?php

namespace Tests\Unit\Http;

use App\Http\Controllers\Api\V1\ConfigController;
use App\Http\Middleware\ModuleEnabled;
use App\Models\City;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class ModuleAccessContractTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('city_modules');
        Schema::dropIfExists('modules');
        Schema::dropIfExists('bairros');

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
    }

    protected function tearDown(): void
    {
        app()->forgetInstance('tenant.city');
        app()->forgetInstance('tenant.resolution_source');
        Cache::flush();

        Schema::dropIfExists('city_modules');
        Schema::dropIfExists('modules');
        Schema::dropIfExists('bairros');

        parent::tearDown();
    }

    public function test_route_middleware_and_config_agree_for_enabled_module_key(): void
    {
        DB::table('modules')->insert([
            'id' => '00000000-0000-0000-0000-0000000000m1',
            'module_key' => 'forum',
            'slug' => 'forum',
            'name' => 'Forum',
            'name_ptbr' => 'Forum',
            'route_slug_ptbr' => 'forum',
            'icon' => 'chat',
            'description' => 'Forum module',
            'is_core' => 0,
            'current_version' => 1,
            'sort_order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('city_modules')->insert([
            'id' => '00000000-0000-0000-0000-0000000000cm',
            'city_id' => '00000000-0000-0000-0000-0000000000c1',
            'module_id' => '00000000-0000-0000-0000-0000000000m1',
            'enabled' => 1,
            'version' => 1,
            'settings' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->bindTenant('00000000-0000-0000-0000-0000000000c1', 'cidade-a');

        $middleware = new ModuleEnabled();
        $middlewareRequest = Request::create('/api/v1/forum/topics', 'GET');
        $middlewareResponse = $middleware->handle(
            $middlewareRequest,
            static fn() => new Response('ok', 200),
            'forum'
        );

        $this->assertSame(200, $middlewareResponse->getStatusCode());

        $controller = new ConfigController();
        $configRequest = Request::create('/api/v1/config', 'GET');
        $configResponse = $controller->bootstrap($configRequest);

        $payload = $configResponse->getData(true);
        $this->assertTrue($payload['success']);
        $this->assertSame('Host, X-City', $configResponse->headers->get('Vary'));

        $moduleKeys = array_column($payload['data']['modules'], 'key');
        $this->assertContains('forum', $moduleKeys);
    }

    public function test_route_middleware_and_config_agree_for_disabled_module_key(): void
    {
        DB::table('modules')->insert([
            'id' => '00000000-0000-0000-0000-0000000000m2',
            'module_key' => 'forum',
            'slug' => 'forum',
            'name' => 'Forum',
            'name_ptbr' => 'Forum',
            'route_slug_ptbr' => 'forum',
            'icon' => 'chat',
            'description' => 'Forum module',
            'is_core' => 0,
            'current_version' => 1,
            'sort_order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->bindTenant('00000000-0000-0000-0000-0000000000c2', 'cidade-b');

        $middleware = new ModuleEnabled();
        $middlewareRequest = Request::create('/api/v1/forum/topics', 'GET');
        $middlewareResponse = $middleware->handle(
            $middlewareRequest,
            static fn() => new Response('ok', 200),
            'forum'
        );

        $this->assertSame(403, $middlewareResponse->getStatusCode());

        $controller = new ConfigController();
        $configRequest = Request::create('/api/v1/config', 'GET');
        $configResponse = $controller->bootstrap($configRequest);
        $payload = $configResponse->getData(true);

        $this->assertTrue($payload['success']);
        $moduleKeys = array_column($payload['data']['modules'], 'key');
        $this->assertNotContains('forum', $moduleKeys);
    }

    private function bindTenant(string $cityId, string $slug): void
    {
        $city = new City();
        $city->forceFill([
            'id' => $cityId,
            'name' => strtoupper($slug),
            'slug' => $slug,
            'uf' => 'SC',
            'status' => 'active',
            'lat' => null,
            'lon' => null,
            'active' => true,
        ]);

        app()->instance('tenant.city', $city);
        app()->instance('tenant.resolution_source', 'test');
    }
}

