<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Backward-compatible entry point for module synchronization.
 * Keeps old command/seeder name while delegating to canonical seeders.
 */
class SyncModulesSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ModulesSeeder::class,
            CityModulesSeeder::class,
        ]);
    }
}
