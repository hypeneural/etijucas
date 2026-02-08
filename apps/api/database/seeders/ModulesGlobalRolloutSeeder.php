<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\CityModule;
use App\Models\Module;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * ModulesGlobalRolloutSeeder
 *
 * Enables reports, weather, and forum modules for ALL active cities in Brazil.
 * This seeder is idempotent - it will skip cities that already have the modules enabled.
 */
class ModulesGlobalRolloutSeeder extends Seeder
{
    /**
     * Modules to enable globally for all cities.
     */
    private const MODULES_TO_ENABLE = [
        'reports',  // Boca no Trombone (Denúncias)
        'weather',  // Previsão do Tempo
        'forum',    // Fórum da Cidade
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🌍 Starting global module rollout...');

        // Get module IDs
        $modules = Module::whereIn('module_key', self::MODULES_TO_ENABLE)->get();

        if ($modules->isEmpty()) {
            $this->command->error('❌ No modules found with keys: ' . implode(', ', self::MODULES_TO_ENABLE));
            return;
        }

        $this->command->info("📦 Found {$modules->count()} modules to enable");

        // Get all active cities
        $cities = City::where('active', true)->get();
        $this->command->info("🏙️ Found {$cities->count()} active cities");

        $created = 0;
        $skipped = 0;

        // Use transaction for atomic operation
        DB::transaction(function () use ($cities, $modules, &$created, &$skipped) {
            foreach ($cities as $city) {
                foreach ($modules as $module) {
                    $existing = CityModule::where('city_id', $city->id)
                        ->where('module_id', $module->id)
                        ->first();

                    if ($existing) {
                        // Already exists, skip
                        $skipped++;
                        continue;
                    }

                    CityModule::create([
                        'city_id' => $city->id,
                        'module_id' => $module->id,
                        'enabled' => true,
                        'version' => 1,
                        'settings' => [],
                    ]);
                    $created++;
                }
            }
        });

        $this->command->info("✅ Created {$created} new city_modules records");
        $this->command->info("⏭️ Skipped {$skipped} existing records");
        $this->command->info('🎉 Global module rollout complete!');
    }
}
