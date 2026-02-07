<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\CityModule;
use App\Models\Module;
use Illuminate\Database\Seeder;

class CityModulesSeeder extends Seeder
{
    /**
     * Seed city_modules table to enable modules per city.
     * 
     * By default:
     * - Tijucas gets ALL modules enabled
     * - Other cities get only core modules enabled
     */
    public function run(): void
    {
        $modules = Module::all();

        if ($modules->isEmpty()) {
            $this->command->warn('No modules found. Run ModulesSeeder first.');
            return;
        }

        $this->command->info('Found ' . $modules->count() . ' modules');

        // Get Tijucas (our main city)
        $tijucas = City::where('slug', 'tijucas-sc')
            ->orWhere('ibge_code', 4218004)
            ->first();

        if (!$tijucas) {
            $this->command->warn('Tijucas not found in cities table.');
        }

        // Enable ALL modules for Tijucas
        if ($tijucas) {
            $this->command->info("Enabling all modules for Tijucas...");

            foreach ($modules as $module) {
                CityModule::updateOrCreate(
                    [
                        'city_id' => $tijucas->id,
                        'module_id' => $module->id,
                    ],
                    [
                        'enabled' => true,
                        'settings' => null,
                    ]
                );
            }

            $this->command->info("✅ {$modules->count()} modules enabled for Tijucas");
        }

        // Enable CORE modules for all other active cities
        $coreModules = $modules->where('is_core', true);

        $otherCities = City::where('status', 'active')
            ->when($tijucas, fn($q) => $q->where('id', '!=', $tijucas->id))
            ->get();

        if ($otherCities->isNotEmpty()) {
            $this->command->info("Enabling core modules for {$otherCities->count()} other active cities...");

            foreach ($otherCities as $city) {
                foreach ($coreModules as $module) {
                    CityModule::updateOrCreate(
                        [
                            'city_id' => $city->id,
                            'module_id' => $module->id,
                        ],
                        [
                            'enabled' => true,
                            'settings' => null,
                        ]
                    );
                }
            }

            $this->command->info("✅ Core modules enabled for {$otherCities->count()} cities");
        }

        // Summary
        $totalRelations = CityModule::count();
        $this->command->info("📊 Total city-module relations: {$totalRelations}");
    }

    /**
     * Enable specific modules for a city.
     * 
     * @param City $city
     * @param array $moduleSlugs Array of module slugs to enable
     */
    public static function enableModulesForCity(City $city, array $moduleSlugs): int
    {
        $modules = Module::whereIn('slug', $moduleSlugs)->get();
        $enabled = 0;

        foreach ($modules as $module) {
            CityModule::updateOrCreate(
                [
                    'city_id' => $city->id,
                    'module_id' => $module->id,
                ],
                [
                    'enabled' => true,
                ]
            );
            $enabled++;
        }

        return $enabled;
    }

    /**
     * Disable all modules for a city.
     */
    public static function disableAllForCity(City $city): int
    {
        return CityModule::where('city_id', $city->id)
            ->update(['enabled' => false]);
    }
}
