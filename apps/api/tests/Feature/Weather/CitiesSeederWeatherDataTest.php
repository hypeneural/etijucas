<?php

namespace Tests\Feature\Weather;

use App\Models\City;
use Database\Seeders\CitiesSeeder;
use DateTimeZone;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CitiesSeederWeatherDataTest extends TestCase
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

    public function test_cities_seeder_sets_focus_cities_with_expected_coastal_flags(): void
    {
        $this->seed(CitiesSeeder::class);

        $expected = [
            ['ibge_code' => 4218004, 'slug' => 'tijucas-sc', 'is_coastal' => true],
            ['ibge_code' => 4213807, 'slug' => 'porto-belo-sc', 'is_coastal' => true],
            ['ibge_code' => 4208302, 'slug' => 'itapema-sc', 'is_coastal' => true],
            ['ibge_code' => 4202008, 'slug' => 'balneario-camboriu-sc', 'is_coastal' => true],
            ['ibge_code' => 4203501, 'slug' => 'canelinha-sc', 'is_coastal' => false],
        ];

        foreach ($expected as $city) {
            $this->assertDatabaseHas('cities', [
                'ibge_code' => $city['ibge_code'],
                'slug' => $city['slug'],
                'is_coastal' => $city['is_coastal'],
                'timezone' => 'America/Sao_Paulo',
            ]);
        }
    }

    public function test_active_cities_have_valid_iana_timezone_and_coordinates(): void
    {
        $this->seed(CitiesSeeder::class);

        $validTimezones = array_flip(DateTimeZone::listIdentifiers());
        $activeCities = City::query()->where('active', true)->get();

        $this->assertGreaterThan(0, $activeCities->count());

        foreach ($activeCities as $city) {
            $this->assertNotNull($city->lat, "City {$city->slug} must have lat.");
            $this->assertNotNull($city->lon, "City {$city->slug} must have lon.");
            $this->assertNotNull($city->timezone, "City {$city->slug} must have timezone.");
            $this->assertArrayHasKey($city->timezone, $validTimezones, "City {$city->slug} has invalid timezone.");
        }
    }
}
