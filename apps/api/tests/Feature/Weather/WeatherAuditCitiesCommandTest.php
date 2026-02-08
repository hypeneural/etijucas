<?php

namespace Tests\Feature\Weather;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class WeatherAuditCitiesCommandTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('cities');
        Schema::create('cities', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('state_id')->nullable();
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
            $table->boolean('is_capital')->default(false);
            $table->integer('siafi_id')->nullable();
            $table->unsignedInteger('population')->nullable();
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('cities');

        parent::tearDown();
    }

    public function test_weather_audit_cities_passes_for_valid_active_city_data(): void
    {
        $this->insertCity([
            'ibge_code' => 4218004,
            'name' => 'Tijucas',
            'slug' => 'tijucas-sc',
            'lat' => -27.2413,
            'lon' => -48.6317,
            'timezone' => 'America/Sao_Paulo',
            'active' => true,
            'status' => 'active',
            'is_coastal' => true,
        ]);

        $this->artisan('weather:audit-cities')
            ->assertExitCode(0);
    }

    public function test_weather_audit_cities_fails_when_active_city_has_invalid_weather_data(): void
    {
        $this->insertCity([
            'ibge_code' => 4203501,
            'name' => 'Canelinha',
            'slug' => 'canelinha-sc',
            'lat' => null,
            'lon' => -48.7660,
            'timezone' => 'Invalid/Timezone',
            'active' => true,
            'status' => 'active',
            'is_coastal' => false,
        ]);

        $this->artisan('weather:audit-cities')
            ->assertExitCode(1);
    }

    /**
     * @param array<string, mixed> $overrides
     */
    private function insertCity(array $overrides): void
    {
        DB::table('cities')->insert(array_merge([
            'id' => (string) Str::uuid(),
            'ibge_code' => 1,
            'name' => 'City',
            'uf' => 'SC',
            'slug' => 'city-sc',
            'status' => 'draft',
            'brand' => null,
            'lat' => -27.0000,
            'lon' => -48.0000,
            'ddd' => '48',
            'timezone' => 'America/Sao_Paulo',
            'is_coastal' => false,
            'active' => false,
            'is_capital' => false,
            'siafi_id' => null,
            'population' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ], $overrides));
    }
}
