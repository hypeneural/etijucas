<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\Module;
use Illuminate\Database\Seeder;

class EnableAllModulesForTijucasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $city = City::where('slug', 'tijucas-sc')->first();

        if (!$city) {
            $this->command->error("City 'tijucas-sc' not found.");
            return;
        }

        $modules = Module::all();

        if ($modules->isEmpty()) {
            $this->command->error("No modules found.");
            return;
        }

        $this->command->info("Found {$modules->count()} modules.");
        $this->command->info("Enabling all modules for {$city->name}...");

        $syncData = $modules->pluck('id')->mapWithKeys(function ($id) {
            return [
                $id => [
                    'enabled' => true,
                    'version' => 1,
                    'settings' => [],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            ];
        })->toArray();

        $city->modules()->sync($syncData);

        // Verify
        $count = $city->modules()->wherePivot('enabled', true)->count();
        $this->command->info("Successfully enabled {$count} modules for {$city->name}.");

        // Clear cache
        \App\Support\Tenant::clearCache(); // If this method isn't static or public, we might need another way, but from previous view it looked public static.
    }
}
