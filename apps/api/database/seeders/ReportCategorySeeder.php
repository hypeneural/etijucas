<?php

namespace Database\Seeders;

use App\Domains\Reports\Models\ReportCategory;
use Illuminate\Database\Seeder;

class ReportCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Buraco na Rua',
                'slug' => 'buraco',
                'icon' => '🕳️',
                'color' => '#6B7280',
                'tips' => [
                    'Informe a localização exata do buraco',
                    'Indique o tamanho aproximado (pequeno, médio, grande)',
                    'Mencione se há risco para veículos ou pedestres',
                ],
                'sort_order' => 1,
            ],
            [
                'name' => 'Iluminação Pública',
                'slug' => 'iluminacao',
                'icon' => '💡',
                'color' => '#F59E0B',
                'tips' => [
                    'Identifique o poste mais próximo',
                    'Informe se a luz está apagada, piscando ou fraca',
                    'Mencione há quanto tempo está com problema',
                ],
                'sort_order' => 2,
            ],
            [
                'name' => 'Lixo/Entulho',
                'slug' => 'lixo',
                'icon' => '🗑️',
                'color' => '#10B981',
                'tips' => [
                    'Descreva o tipo de lixo ou entulho',
                    'Informe se está em área pública ou privada',
                    'Mencione se há risco de contaminação',
                ],
                'sort_order' => 3,
            ],
            [
                'name' => 'Calçada Danificada',
                'slug' => 'calcada',
                'icon' => '🚧',
                'color' => '#EF4444',
                'tips' => [
                    'Localize a calçada com problema',
                    'Informe se há risco para pedestres',
                    'Indique se há buracos, degraus ou irregularidades',
                ],
                'sort_order' => 4,
            ],
            [
                'name' => 'Árvore/Mato Alto',
                'slug' => 'arvore',
                'icon' => '🌳',
                'color' => '#22C55E',
                'tips' => [
                    'Descreva se é árvore caída, galhos ou mato alto',
                    'Informe se bloqueia passagem ou visão',
                    'Mencione se há risco de queda',
                ],
                'sort_order' => 5,
            ],
            [
                'name' => 'Vazamento/Esgoto',
                'slug' => 'vazamento',
                'icon' => '💧',
                'color' => '#3B82F6',
                'tips' => [
                    'Informe se é água ou esgoto',
                    'Descreva a intensidade do vazamento',
                    'Mencione se há mau cheiro',
                ],
                'sort_order' => 6,
            ],
            [
                'name' => 'Estacionamento Irregular',
                'slug' => 'estacionamento',
                'icon' => '🚗',
                'color' => '#8B5CF6',
                'tips' => [
                    'Identifique o veículo se possível',
                    'Informe onde está estacionado irregularmente',
                    'Mencione se bloqueia acesso',
                ],
                'sort_order' => 7,
            ],
            [
                'name' => 'Perturbação do Sossego',
                'slug' => 'perturbacao',
                'icon' => '📢',
                'color' => '#EC4899',
                'tips' => [
                    'Descreva o tipo de barulho',
                    'Informe horário e frequência',
                    'Mencione se já tentou resolver amigavelmente',
                ],
                'sort_order' => 8,
            ],
            [
                'name' => 'Outros',
                'slug' => 'outros',
                'icon' => '❓',
                'color' => '#6B7280',
                'tips' => [
                    'Descreva detalhadamente o problema',
                    'Informe por que não se encaixa nas outras categorias',
                    'Seja o mais específico possível',
                ],
                'sort_order' => 99,
            ],
        ];

        foreach ($categories as $category) {
            ReportCategory::updateOrCreate(
                ['slug' => $category['slug']],
                $category
            );
        }
    }
}
