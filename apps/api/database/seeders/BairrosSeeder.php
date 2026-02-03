<?php

namespace Database\Seeders;

use App\Models\Bairro;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BairrosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $bairros = [
            'Centro',
            'Meia Praia',
            'Morretes',
            'Canto da Praia',
            'Jardim Praia Mar',
            'Tabuleiro',
            'Andorinha',
            'Ilhota',
            'Várzea',
            'Sertãozinho',
            'Casa Branca',
            'Morro do Boi',
        ];

        foreach ($bairros as $nome) {
            Bairro::create([
                'nome' => $nome,
                'slug' => Str::slug($nome),
                'active' => true,
            ]);
        }

        $this->command->info('Created ' . count($bairros) . ' bairros successfully!');
    }
}
