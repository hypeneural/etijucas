<?php

namespace Tests\Feature\Weather;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class AddIsCoastalToCitiesMigrationTest extends TestCase
{
    private const MIGRATION_PATH = 'database/migrations/2026_02_08_120000_add_is_coastal_to_cities.php';

    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('cities');
        Schema::create('cities', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->integer('ibge_code')->unique();
            $table->string('name');
            $table->char('uf', 2);
            $table->string('slug')->unique();
            $table->decimal('lat', 10, 8)->nullable();
            $table->decimal('lon', 10, 8)->nullable();
            $table->string('ddd', 3)->nullable();
            $table->string('timezone', 50)->default('America/Sao_Paulo');
            $table->boolean('active')->default(false);
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('cities');

        parent::tearDown();
    }

    public function test_migration_up_adds_is_coastal_with_default_false(): void
    {
        $migration = $this->loadMigration();

        $migration->down();
        $this->assertFalse(Schema::hasColumn('cities', 'is_coastal'));

        $migration->up();
        $this->assertTrue(Schema::hasColumn('cities', 'is_coastal'));

        DB::table('cities')->insert([
            'id' => (string) Str::uuid(),
            'ibge_code' => 9999991,
            'name' => 'Test City',
            'uf' => 'SC',
            'slug' => 'test-city-sc',
            'lat' => -27.10000000,
            'lon' => -48.60000000,
            'ddd' => '48',
            'timezone' => 'America/Sao_Paulo',
            'active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->assertDatabaseHas('cities', [
            'ibge_code' => 9999991,
            'is_coastal' => false,
        ]);
    }

    public function test_migration_down_removes_is_coastal_column(): void
    {
        $migration = $this->loadMigration();

        $migration->up();
        $this->assertTrue(Schema::hasColumn('cities', 'is_coastal'));

        $migration->down();

        $this->assertFalse(Schema::hasColumn('cities', 'is_coastal'));
    }

    private function loadMigration(): object
    {
        return require base_path(self::MIGRATION_PATH);
    }
}
