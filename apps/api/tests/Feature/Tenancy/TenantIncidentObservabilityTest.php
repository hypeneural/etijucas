<?php

namespace Tests\Feature\Tenancy;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TenantIncidentObservabilityTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('tenant_incidents');
        Schema::dropIfExists('city_domains');
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

        Schema::create('tenant_incidents', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('city_id')->nullable();
            $table->string('type', 120);
            $table->string('severity', 20)->default('warning');
            $table->string('source', 50)->nullable();
            $table->string('module_key', 50)->nullable();
            $table->string('request_id', 64)->nullable();
            $table->string('trace_id', 64)->nullable();
            $table->json('context')->nullable();
            $table->timestamp('acknowledged_at')->nullable();
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

        Cache::forget('city_domains:map');
    }

    protected function tearDown(): void
    {
        Cache::forget('city_domains:map');
        app()->forgetInstance('tenant.city');
        app()->forgetInstance('tenant.resolution_source');

        Schema::dropIfExists('tenant_incidents');
        Schema::dropIfExists('city_domains');
        Schema::dropIfExists('cities');

        parent::tearDown();
    }

    public function test_header_and_path_mismatch_creates_tenant_incident(): void
    {
        $response = $this
            ->withHeaders(['X-City' => 'itajai-sc'])
            ->get('http://localhost/sc/tijucas');

        $response->assertOk();

        $this->assertDatabaseHas('tenant_incidents', [
            'type' => 'tenant_header_path_mismatch',
            'city_id' => '00000000-0000-0000-0000-0000000000b1',
            'source' => 'tenant_context',
        ]);
    }

    public function test_incident_summary_command_groups_by_city_and_type(): void
    {
        DB::table('tenant_incidents')->insert([
            [
                'id' => '00000000-0000-0000-0000-0000000000i1',
                'city_id' => '00000000-0000-0000-0000-0000000000a1',
                'type' => 'tenant_header_path_mismatch',
                'severity' => 'warning',
                'source' => 'tenant_context',
                'context' => json_encode(['sample' => true]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => '00000000-0000-0000-0000-0000000000i2',
                'city_id' => '00000000-0000-0000-0000-0000000000a1',
                'type' => 'tenant_header_path_mismatch',
                'severity' => 'warning',
                'source' => 'tenant_context',
                'context' => json_encode(['sample' => true]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $this
            ->artisan('tenancy:incidents:summary', ['--minutes' => 60])
            ->expectsOutputToContain('tenant_header_path_mismatch')
            ->assertSuccessful();
    }
}
