<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\CityDomain;
use Illuminate\Database\Seeder;

class CityDomainsSeeder extends Seeder
{
    /**
     * Seed city domains for tenant resolution.
     * Maps domains to cities (replacing regex-based resolution).
     */
    public function run(): void
    {
        $tijucas = City::where('ibge_code', 4218007)->first();

        if (!$tijucas) {
            $this->command->warn('Tijucas city not found. Run CitiesSeeder first.');
            return;
        }

        $domains = [
            // Production domains
            [
                'city_id' => $tijucas->id,
                'domain' => 'etijucas.com.br',
                'is_primary' => true,
            ],
            [
                'city_id' => $tijucas->id,
                'domain' => 'www.etijucas.com.br',
                'is_primary' => false,
            ],
            // Development domains
            [
                'city_id' => $tijucas->id,
                'domain' => 'localhost',
                'is_primary' => false,
            ],
            [
                'city_id' => $tijucas->id,
                'domain' => '127.0.0.1',
                'is_primary' => false,
            ],
            // Staging/Preview
            [
                'city_id' => $tijucas->id,
                'domain' => 'staging.etijucas.com.br',
                'is_primary' => false,
            ],
        ];

        foreach ($domains as $domain) {
            CityDomain::updateOrCreate(
                ['domain' => $domain['domain']],
                $domain
            );
        }

        $this->command->info('✅ City domains seeded for Tijucas.');
    }
}
