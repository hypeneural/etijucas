<?php

namespace Database\Seeders;

use App\Models\Bairro;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BairrosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Bairros reais de Tijucas, SC
     */
    public function run(): void
    {
        // Delete all existing bairros first
        Bairro::query()->delete();

        $bairros = [
            'Centro',
            'Areias',
            'Joaia',
            'Pernambuco',
            'Praça',
            'Santa Luzia',
            'Sul do Rio',
            'Universitário',
            'XV de Novembro',
            'Campo Novo',
            'Itinga',
            'Morretes',
            'Nova Descoberta',
            'Oliveira',
            'Terra Nova',
            'Timbé',
        ];

        foreach ($bairros as $nome) {
            Bairro::create([
                'nome' => $nome,
                'slug' => Str::slug($nome),
                'active' => true,
            ]);
        }

        $this->command->info('Deleted old bairros and created ' . count($bairros) . ' real Tijucas bairros successfully!');
    }
}
