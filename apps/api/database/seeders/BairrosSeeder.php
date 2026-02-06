<?php

namespace Database\Seeders;

use App\Models\Bairro;
use App\Models\City;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BairrosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Bairros reais de Tijucas, SC
     * Uses updateOrCreate to preserve existing data.
     */
    public function run(): void
    {
        // Get Tijucas city
        $tijucas = City::where('slug', 'tijucas-sc')->first();

        if (!$tijucas) {
            $this->command->error('Tijucas city not found. Please run CitiesSeeder first.');
            return;
        }

        // [nome => sort_order]
        $bairros = [
            'Centro' => 1,
            'Areias' => 2,
            'Joaia' => 3,
            'Pernambuco' => 4,
            'Praça' => 5,
            'Santa Luzia' => 6,
            'Sul do Rio' => 7,
            'Universitário' => 8,
            'XV de Novembro' => 9,
            'Campo Novo' => 10,
            'Itinga' => 11,
            'Morretes' => 12,
            'Nova Descoberta' => 13,
            'Oliveira' => 14,
            'Terra Nova' => 15,
            'Timbé' => 16,
        ];

        $created = 0;
        $updated = 0;

        foreach ($bairros as $nome => $sortOrder) {
            $slug = Str::slug($nome);

            $bairro = Bairro::where('slug', $slug)->first();

            if ($bairro) {
                $bairro->update([
                    'city_id' => $tijucas->id,
                    'sort_order' => $sortOrder,
                    'active' => true,
                ]);
                $updated++;
            } else {
                Bairro::create([
                    'city_id' => $tijucas->id,
                    'nome' => $nome,
                    'slug' => $slug,
                    'sort_order' => $sortOrder,
                    'active' => true,
                ]);
                $created++;
            }
        }

        $this->command->info("Bairros: {$created} created, {$updated} updated with city_id.");
    }
}
