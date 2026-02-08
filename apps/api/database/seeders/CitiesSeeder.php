<?php

namespace Database\Seeders;

use App\Models\City;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CitiesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Seeds Brazilian cities from IBGE data.
     * Only Tijucas is set as active initially.
     */
    public function run(): void
    {
        $this->command->info('Seeding cities...');

        // Main cities to seed (prioritized)
        // Full list can be imported from municipios-brasileiros JSON
        $cities = [
            // Santa Catarina (SC) - Primary focus
            ['ibge_code' => 4218004, 'name' => 'Tijucas', 'uf' => 'SC', 'lat' => -27.2413, 'lon' => -48.6317, 'ddd' => '48', 'active' => true, 'is_coastal' => true],
            ['ibge_code' => 4205407, 'name' => 'Florianopolis', 'uf' => 'SC', 'lat' => -27.5945, 'lon' => -48.5477, 'ddd' => '48', 'active' => false, 'is_coastal' => true],
            ['ibge_code' => 4202008, 'name' => 'Balneario Camboriu', 'uf' => 'SC', 'lat' => -26.9906, 'lon' => -48.6352, 'ddd' => '47', 'active' => false, 'is_coastal' => true],
            ['ibge_code' => 4208302, 'name' => 'Itapema', 'uf' => 'SC', 'lat' => -27.0908, 'lon' => -48.6174, 'ddd' => '47', 'active' => false, 'is_coastal' => true],
            ['ibge_code' => 4208203, 'name' => 'Itajai', 'uf' => 'SC', 'lat' => -26.9101, 'lon' => -48.6616, 'ddd' => '47', 'active' => false, 'is_coastal' => true],
            ['ibge_code' => 4204202, 'name' => 'Criciuma', 'uf' => 'SC', 'lat' => -28.6775, 'lon' => -49.3697, 'ddd' => '48', 'active' => false, 'is_coastal' => false],
            ['ibge_code' => 4209102, 'name' => 'Joinville', 'uf' => 'SC', 'lat' => -26.3045, 'lon' => -48.8487, 'ddd' => '47', 'active' => false],
            ['ibge_code' => 4202305, 'name' => 'Blumenau', 'uf' => 'SC', 'lat' => -26.9195, 'lon' => -49.0661, 'ddd' => '47', 'active' => false],
            ['ibge_code' => 4211900, 'name' => 'Navegantes', 'uf' => 'SC', 'lat' => -26.8985, 'lon' => -48.6543, 'ddd' => '47', 'active' => false],
            ['ibge_code' => 4202909, 'name' => 'Brusque', 'uf' => 'SC', 'lat' => -27.0979, 'lon' => -48.9174, 'ddd' => '47', 'active' => false],
            ['ibge_code' => 4215802, 'name' => 'Sao Jose', 'uf' => 'SC', 'lat' => -27.6136, 'lon' => -48.6366, 'ddd' => '48', 'active' => false],

            // Nearby cities to Tijucas
            ['ibge_code' => 4203501, 'name' => 'Canelinha', 'uf' => 'SC', 'lat' => -27.2618, 'lon' => -48.7660, 'ddd' => '48', 'active' => false, 'is_coastal' => false],
            ['ibge_code' => 4210407, 'name' => 'Major Gercino', 'uf' => 'SC', 'lat' => -27.4182, 'lon' => -49.0745, 'ddd' => '48', 'active' => false, 'is_coastal' => false],
            ['ibge_code' => 4212205, 'name' => 'Nova Trento', 'uf' => 'SC', 'lat' => -27.2866, 'lon' => -49.0781, 'ddd' => '48', 'active' => false, 'is_coastal' => false],
            ['ibge_code' => 4206504, 'name' => 'Governador Celso Ramos', 'uf' => 'SC', 'lat' => -27.3146, 'lon' => -48.5572, 'ddd' => '48', 'active' => false, 'is_coastal' => true],
            ['ibge_code' => 4202602, 'name' => 'Bombinhas', 'uf' => 'SC', 'lat' => -27.1387, 'lon' => -48.5145, 'ddd' => '47', 'active' => false, 'is_coastal' => true],
            ['ibge_code' => 4213807, 'name' => 'Porto Belo', 'uf' => 'SC', 'lat' => -27.1594, 'lon' => -48.5462, 'ddd' => '47', 'active' => false, 'is_coastal' => true],
        ];

        foreach ($cities as $cityData) {
            City::updateOrCreate(
                ['ibge_code' => $cityData['ibge_code']],
                [
                    'name' => $cityData['name'],
                    'uf' => $cityData['uf'],
                    'slug' => Str::slug($cityData['name'] . '-' . $cityData['uf']),
                    'lat' => $cityData['lat'],
                    'lon' => $cityData['lon'],
                    'ddd' => $cityData['ddd'],
                    'timezone' => 'America/Sao_Paulo',
                    'is_coastal' => $cityData['is_coastal'] ?? false,
                    'active' => $cityData['active'],
                    'status' => $cityData['active'] ? 'active' : 'draft',
                ]
            );
        }

        $this->command->info('Created ' . count($cities) . ' cities. Tijucas is the only active city.');
    }
}