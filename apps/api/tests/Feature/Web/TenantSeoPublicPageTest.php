<?php

namespace Tests\Feature\Web;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TenantSeoPublicPageTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

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

        DB::table('cities')->insert([
            'id' => '00000000-0000-0000-0000-0000000000c1',
            'name' => 'Tijucas',
            'slug' => 'tijucas-sc',
            'uf' => 'SC',
            'active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Cache::forget('city_domains:map');
    }

    protected function tearDown(): void
    {
        Cache::forget('city_domains:map');
        app()->forgetInstance('tenant.city');
        app()->forgetInstance('tenant.resolution_source');

        Schema::dropIfExists('city_domains');
        Schema::dropIfExists('cities');

        parent::tearDown();
    }

    public function test_public_city_route_renders_indexable_html_with_canonical_url(): void
    {
        $response = $this->get('http://localhost/sc/tijucas/agenda');

        $response->assertOk();
        $response->assertHeader('X-App-Renderer', 'seo');
        $response->assertSee('meta name="robots" content="index,follow"', false);
        $response->assertSee('link rel="canonical" href="http://localhost/sc/tijucas/agenda"', false);
        $response->assertSee('Agenda de Eventos - Tijucas/SC');
    }

    public function test_authenticated_area_path_stays_in_spa_mode(): void
    {
        $response = $this->get('http://localhost/sc/tijucas/perfil');

        $response->assertOk();
        $response->assertHeader('X-App-Renderer', 'spa');
    }
}
