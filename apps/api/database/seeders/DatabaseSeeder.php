<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed roles and permissions first
        $this->call([
            RolesAndPermissionsSeeder::class,
            CitiesSeeder::class,        // Cities must be seeded before bairros
            ModulesSeeder::class,       // Canonical modules catalog
            CityModulesSeeder::class,   // Tenant module activation defaults
            BairrosSeeder::class,       // Bairros with city_id
            BairroAliasesSeeder::class, // Aliases for bairro names
            AdminUserSeeder::class,
        ]);
    }
}
