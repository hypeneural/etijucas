<?php

namespace Tests\Feature\Tenancy;

use App\Http\Middleware\TenantContext;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TenantContextHeadersTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('cities');
        Schema::dropIfExists('city_domains');
        Schema::create('cities', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->integer('ibge_code')->unique();
            $table->string('name');
            $table->char('uf', 2);
            $table->string('slug')->unique();
            $table->string('status', 20)->default('draft');
            $table->json('brand')->nullable();
            $table->decimal('lat', 10, 8)->nullable();
            $table->decimal('lon', 10, 8)->nullable();
            $table->string('ddd', 3)->nullable();
            $table->string('timezone', 50)->default('America/Sao_Paulo');
            $table->boolean('is_coastal')->default(false);
            $table->boolean('active')->default(false);
            $table->timestamps();
        });

        Schema::create('city_domains', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('city_id');
            $table->string('domain');
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
        });

        DB::table('cities')->insert([
            [
                'id' => '00000000-0000-0000-0000-0000000000a1',
                'ibge_code' => 4218004,
                'name' => 'Tijucas',
                'uf' => 'SC',
                'slug' => 'tijucas-sc',
                'status' => 'active',
                'brand' => json_encode(['appName' => 'ETijucas'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'lat' => -27.2413,
                'lon' => -48.6317,
                'ddd' => '48',
                'timezone' => 'America/Sao_Paulo',
                'is_coastal' => true,
                'active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => '00000000-0000-0000-0000-0000000000b1',
                'ibge_code' => 4203501,
                'name' => 'Canelinha',
                'uf' => 'SC',
                'slug' => 'canelinha-sc',
                'status' => 'active',
                'brand' => json_encode(['appName' => 'ECanelinha'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'lat' => -27.2618,
                'lon' => -48.7660,
                'ddd' => '48',
                'timezone' => 'America/Sao_Paulo',
                'is_coastal' => false,
                'active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        DB::table('city_domains')->insert([
            [
                'id' => '00000000-0000-0000-0000-0000000000d1',
                'city_id' => '00000000-0000-0000-0000-0000000000a1',
                'domain' => 'localhost',
                'is_primary' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => '00000000-0000-0000-0000-0000000000d2',
                'city_id' => '00000000-0000-0000-0000-0000000000b1',
                'domain' => '127.0.0.1',
                'is_primary' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        Cache::forget('city_domains:map');
    }

    protected function tearDown(): void
    {
        app()->forgetInstance('tenant.city');
        app()->forgetInstance('tenant.key');
        app()->forgetInstance('tenant.timezone');
        app()->forgetInstance('tenant.resolution_source');

        Cache::forget('city_domains:map');
        Schema::dropIfExists('city_domains');
        Schema::dropIfExists('cities');

        parent::tearDown();
    }

    public function test_sets_x_tenant_headers_on_v1_requests(): void
    {
        $middleware = new TenantContext();
        $request = Request::create('/api/v1/config', 'GET');
        $request->headers->set('Host', 'localhost');
        $request->headers->set('X-City', 'tijucas-sc');

        $response = $middleware->handle($request, static fn() => response()->json(['ok' => true]));

        $this->assertSame('tijucas-sc', $response->headers->get('X-Tenant-City'));
        $this->assertSame('America/Sao_Paulo', $response->headers->get('X-Tenant-Timezone'));
        $this->assertNotEmpty($response->headers->get('X-Tenant-Key'));
    }

    public function test_tenant_key_is_stable_for_same_city(): void
    {
        $middleware = new TenantContext();

        $requestA = Request::create('/api/v1/config', 'GET');
        $requestA->headers->set('Host', 'localhost');
        $requestA->headers->set('X-City', 'tijucas-sc');
        $responseA = $middleware->handle($requestA, static fn() => response()->json(['ok' => true]));
        $keyA = $responseA->headers->get('X-Tenant-Key');

        app()->forgetInstance('tenant.city');
        app()->forgetInstance('tenant.key');
        app()->forgetInstance('tenant.timezone');
        app()->forgetInstance('tenant.resolution_source');

        $requestB = Request::create('/api/v1/config', 'GET');
        $requestB->headers->set('Host', 'localhost');
        $requestB->headers->set('X-City', 'tijucas-sc');
        $responseB = $middleware->handle($requestB, static fn() => response()->json(['ok' => true]));
        $keyB = $responseB->headers->get('X-Tenant-Key');

        $this->assertNotEmpty($keyA);
        $this->assertSame($keyA, $keyB);
    }

    public function test_tenant_key_changes_when_city_changes(): void
    {
        $middleware = new TenantContext();

        $requestA = Request::create('/api/v1/config', 'GET');
        $requestA->headers->set('Host', 'localhost');
        $requestA->headers->set('X-City', 'tijucas-sc');
        $responseA = $middleware->handle($requestA, static fn() => response()->json(['ok' => true]));
        $keyA = $responseA->headers->get('X-Tenant-Key');

        app()->forgetInstance('tenant.city');
        app()->forgetInstance('tenant.key');
        app()->forgetInstance('tenant.timezone');
        app()->forgetInstance('tenant.resolution_source');

        $requestB = Request::create('/api/v1/config', 'GET');
        $requestB->headers->set('Host', '127.0.0.1');
        $requestB->headers->set('X-City', 'canelinha-sc');
        $responseB = $middleware->handle($requestB, static fn() => response()->json(['ok' => true]));
        $keyB = $responseB->headers->get('X-Tenant-Key');

        $this->assertNotEmpty($keyA);
        $this->assertNotEmpty($keyB);
        $this->assertNotSame($keyA, $keyB);
    }
}
