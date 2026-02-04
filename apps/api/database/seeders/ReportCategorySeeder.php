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
                'icon' => 'mdi:road-variant',
                'color' => '#ef4444',
                'tips' => [
                    'Informe a localização exata do buraco',
                    'Indique o tamanho aproximado (pequeno, médio, grande)',
                    'Mencione se há risco para veículos ou pedestres',
                ],
                'sort_order' => 10,
            ],
            [
                'name' => 'Iluminação Pública',
                'slug' => 'iluminacao',
                'icon' => 'mdi:lightbulb-on-outline',
                'color' => '#f59e0b',
                'tips' => [
                    'Identifique o poste mais próximo',
                    'Informe se a luz está apagada, piscando ou fraca',
                    'Mencione há quanto tempo está com problema',
                ],
                'sort_order' => 20,
            ],
            [
                'name' => 'Lixo/Entulho',
                'slug' => 'lixo',
                'icon' => 'mdi:trash-can-outline',
                'color' => '#10b981',
                'tips' => [
                    'Descreva o tipo de lixo ou entulho',
                    'Informe se está em área pública ou privada',
                    'Mencione se há risco de contaminação',
                ],
                'sort_order' => 30,
            ],
            [
                'name' => 'Calçada Danificada',
                'slug' => 'calcada',
                'icon' => 'mdi:walk',
                'color' => '#3b82f6',
                'tips' => [
                    'Localize a calçada com problema',
                    'Informe se há risco para pedestres',
                    'Indique se há buracos, degraus ou irregularidades',
                ],
                'sort_order' => 40,
            ],
            [
                'name' => 'Árvore/Mato Alto',
                'slug' => 'arvore',
                'icon' => 'mdi:tree',
                'color' => '#22c55e',
                'tips' => [
                    'Descreva se é árvore caída, galhos ou mato alto',
                    'Informe se bloqueia passagem ou visão',
                    'Mencione se há risco de queda',
                ],
                'sort_order' => 50,
            ],
            [
                'name' => 'Vazamento/Esgoto',
                'slug' => 'vazamento',
                'icon' => 'mdi:pipe',
                'color' => '#06b6d4',
                'tips' => [
                    'Informe se é água ou esgoto',
                    'Descreva a intensidade do vazamento',
                    'Mencione se há mau cheiro',
                ],
                'sort_order' => 60,
            ],
            [
                'name' => 'Estacionamento Irregular',
                'slug' => 'estacionamento',
                'icon' => 'mdi:parking',
                'color' => '#8b5cf6',
                'tips' => [
                    'Identifique o veículo se possível',
                    'Informe onde está estacionado irregularmente',
                    'Mencione se bloqueia acesso',
                ],
                'sort_order' => 70,
            ],
            [
                'name' => 'Perturbação do Sossego',
                'slug' => 'perturbacao',
                'icon' => 'mdi:volume-high',
                'color' => '#f97316',
                'tips' => [
                    'Descreva o tipo de barulho',
                    'Informe horário e frequência',
                    'Mencione se já tentou resolver amigavelmente',
                ],
                'sort_order' => 80,
            ],
            [
                'name' => 'Outros',
                'slug' => 'outros',
                'icon' => 'mdi:dots-horizontal',
                'color' => '#64748b',
                'tips' => [
                    'Descreva detalhadamente o problema',
                    'Informe por que não se encaixa nas outras categorias',
                    'Seja o mais específico possível',
                ],
                'sort_order' => 90,
            ],
        ];

        foreach ($categories as $category) {
            ReportCategory::updateOrCreate(
                ['slug' => $category['slug']],
                $category
            );
        }

        // Delete duplicate categories with new slugs (cleanup)
        ReportCategory::whereIn('slug', [
            'buraco-na-rua',
            'iluminacao-publica',
            'lixo-entulho',
            'calcada-danificada',
            'arvore-mato-alto',
            'vazamento-esgoto',
            'perturbacao-do-sossego',
        ])->delete();
    }
}
