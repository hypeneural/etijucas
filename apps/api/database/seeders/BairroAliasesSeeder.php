<?php

namespace Database\Seeders;

use App\Models\Bairro;
use App\Models\BairroAlias;
use App\Models\City;
use App\Support\Normalizer;
use Illuminate\Database\Seeder;

class BairroAliasesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Seeds initial aliases for common ViaCEP variations.
     */
    public function run(): void
    {
        // Get Tijucas city
        $tijucas = City::where('slug', 'tijucas-sc')->first();

        if (!$tijucas) {
            $this->command->error('Tijucas city not found. Please run CitiesSeeder first.');
            return;
        }

        // [bairro_slug => [aliases]]
        $aliasMap = [
            'centro' => [
                'Centro - Tijucas',
                'Centro (Tijucas)',
                'centro-tijucas',
            ],
            'xv-de-novembro' => [
                'Quinze de Novembro',
                '15 de Novembro',
                'XV Novembro',
            ],
            'santa-luzia' => [
                'Sta Luzia',
                'Sta. Luzia',
                'Santa Lúzia',
            ],
            'sul-do-rio' => [
                'Sul Rio',
                'Bairro Sul do Rio',
            ],
            'campo-novo' => [
                'Bairro Campo Novo',
            ],
            'nova-descoberta' => [
                'Bairro Nova Descoberta',
            ],
        ];

        $created = 0;
        $skipped = 0;

        foreach ($aliasMap as $bairroSlug => $aliases) {
            $bairro = Bairro::where('slug', $bairroSlug)
                ->where('city_id', $tijucas->id)
                ->first();

            if (!$bairro) {
                $this->command->warn("Bairro not found: {$bairroSlug}");
                continue;
            }

            foreach ($aliases as $alias) {
                $aliasSlug = Normalizer::toCanonicalKey($alias);

                // Skip if same as original
                if ($aliasSlug === $bairroSlug) {
                    $skipped++;
                    continue;
                }

                BairroAlias::updateOrCreate(
                    [
                        'city_id' => $tijucas->id,
                        'alias_slug' => $aliasSlug,
                    ],
                    [
                        'bairro_id' => $bairro->id,
                        'alias' => $alias,
                        'source' => 'manual',
                        'enabled' => true,
                    ]
                );
                $created++;
            }
        }

        $this->command->info("Bairro aliases: {$created} created, {$skipped} skipped (same as original).");
    }
}
