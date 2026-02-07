<?php

namespace Tests\Feature\Modules;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ModulesRolloutCommandTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('activity_log');
        Schema::dropIfExists('city_modules');
        Schema::dropIfExists('modules');
        Schema::dropIfExists('cities');

        Schema::create('cities', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('modules', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('module_key')->unique();
            $table->string('slug')->unique();
            $table->string('name');
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

        Schema::create('activity_log', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->string('log_name')->nullable();
            $table->text('description');
            $table->string('subject_type')->nullable();
            $table->uuid('subject_id')->nullable();
            $table->string('event')->nullable();
            $table->string('causer_type')->nullable();
            $table->uuid('causer_id')->nullable();
            $table->json('properties')->nullable();
            $table->uuid('batch_uuid')->nullable();
            $table->timestamps();
        });

        DB::table('cities')->insert([
            [
                'id' => '00000000-0000-0000-0000-0000000000c1',
                'name' => 'City A',
                'slug' => 'city-a',
                'active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => '00000000-0000-0000-0000-0000000000c2',
                'name' => 'City B',
                'slug' => 'city-b',
                'active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => '00000000-0000-0000-0000-0000000000c3',
                'name' => 'City C',
                'slug' => 'city-c',
                'active' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        DB::table('modules')->insert([
            'id' => '00000000-0000-0000-0000-0000000000m1',
            'module_key' => 'forum',
            'slug' => 'forum',
            'name' => 'Forum',
            'is_core' => 0,
            'current_version' => 1,
            'sort_order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('activity_log');
        Schema::dropIfExists('city_modules');
        Schema::dropIfExists('modules');
        Schema::dropIfExists('cities');

        parent::tearDown();
    }

    public function test_rollout_targets_all_active_cities(): void
    {
        $this->artisan('modules:rollout', [
            'module' => 'forum',
            'state' => 'on',
        ])->assertExitCode(0);

        $cityModules = DB::table('city_modules')
            ->where('module_id', '00000000-0000-0000-0000-0000000000m1')
            ->orderBy('city_id')
            ->get(['city_id', 'enabled']);

        $this->assertCount(2, $cityModules);
        $this->assertSame('00000000-0000-0000-0000-0000000000c1', $cityModules[0]->city_id);
        $this->assertSame('00000000-0000-0000-0000-0000000000c2', $cityModules[1]->city_id);
        $this->assertEquals(1, $cityModules[0]->enabled);
        $this->assertEquals(1, $cityModules[1]->enabled);
    }

    public function test_rollout_respects_exceptions_filter(): void
    {
        $this->artisan('modules:rollout', [
            'module' => 'forum',
            'state' => 'off',
            '--cities' => ['city-a', 'city-b'],
            '--except' => ['city-b'],
        ])->assertExitCode(0);

        $this->assertDatabaseHas('city_modules', [
            'city_id' => '00000000-0000-0000-0000-0000000000c1',
            'module_id' => '00000000-0000-0000-0000-0000000000m1',
            'enabled' => 0,
        ]);

        $this->assertDatabaseMissing('city_modules', [
            'city_id' => '00000000-0000-0000-0000-0000000000c2',
            'module_id' => '00000000-0000-0000-0000-0000000000m1',
        ]);
    }

    public function test_rollback_restores_previous_state(): void
    {
        DB::table('city_modules')->insert([
            'id' => '00000000-0000-0000-0000-0000000000cm',
            'city_id' => '00000000-0000-0000-0000-0000000000c1',
            'module_id' => '00000000-0000-0000-0000-0000000000m1',
            'enabled' => 0,
            'version' => 1,
            'settings' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->artisan('modules:rollout', [
            'module' => 'forum',
            'state' => 'on',
            '--rollout-id' => 'rollout-test-1',
        ])->assertExitCode(0);

        $this->assertDatabaseHas('city_modules', [
            'city_id' => '00000000-0000-0000-0000-0000000000c1',
            'module_id' => '00000000-0000-0000-0000-0000000000m1',
            'enabled' => 1,
        ]);
        $this->assertDatabaseHas('city_modules', [
            'city_id' => '00000000-0000-0000-0000-0000000000c2',
            'module_id' => '00000000-0000-0000-0000-0000000000m1',
            'enabled' => 1,
        ]);

        $this->artisan('modules:rollout', [
            'module' => 'forum',
            'state' => 'on',
            '--rollback' => 'rollout-test-1',
        ])->assertExitCode(0);

        $this->assertDatabaseHas('city_modules', [
            'city_id' => '00000000-0000-0000-0000-0000000000c1',
            'module_id' => '00000000-0000-0000-0000-0000000000m1',
            'enabled' => 0,
        ]);
        $this->assertDatabaseMissing('city_modules', [
            'city_id' => '00000000-0000-0000-0000-0000000000c2',
            'module_id' => '00000000-0000-0000-0000-0000000000m1',
        ]);
    }
}
