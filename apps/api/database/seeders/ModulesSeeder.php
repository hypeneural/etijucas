<?php

namespace Database\Seeders;

use App\Models\Module;
use Illuminate\Database\Seeder;

class ModulesSeeder extends Seeder
{
    /**
     * Seed the modules table with initial modules.
     */
    public function run(): void
    {
        $modules = [
            // Core modules (enabled by default)
            [
                'slug' => 'forum',
                'name' => 'Fórum',
                'description' => 'Discussões e tópicos da comunidade por bairro',
                'icon' => 'message-circle',
                'is_core' => true,
                'sort_order' => 1,
            ],
            [
                'slug' => 'events',
                'name' => 'Eventos',
                'description' => 'Agenda de eventos e shows da cidade',
                'icon' => 'calendar',
                'is_core' => true,
                'sort_order' => 2,
            ],
            [
                'slug' => 'reports',
                'name' => 'Denúncias',
                'description' => 'Boca no Trombone - reporte problemas da cidade',
                'icon' => 'flag',
                'is_core' => true,
                'sort_order' => 3,
            ],
            [
                'slug' => 'phones',
                'name' => 'Telefones',
                'description' => 'Telefones úteis e de emergência',
                'icon' => 'phone',
                'is_core' => true,
                'sort_order' => 4,
            ],
            [
                'slug' => 'alerts',
                'name' => 'Alertas',
                'description' => 'Avisos urgentes e notificações',
                'icon' => 'alert-triangle',
                'is_core' => true,
                'sort_order' => 5,
            ],

            // Optional modules (disabled by default)
            [
                'slug' => 'tourism',
                'name' => 'Turismo',
                'description' => 'Pontos turísticos e passeios',
                'icon' => 'map-pin',
                'is_core' => false,
                'sort_order' => 6,
            ],
            [
                'slug' => 'council',
                'name' => 'Câmara',
                'description' => 'Vereadores e projetos de lei',
                'icon' => 'building',
                'is_core' => false,
                'sort_order' => 7,
            ],
            [
                'slug' => 'voting',
                'name' => 'Votações',
                'description' => 'Enquetes e votações populares',
                'icon' => 'check-square',
                'is_core' => false,
                'sort_order' => 8,
            ],
        ];

        foreach ($modules as $moduleData) {
            Module::updateOrCreate(
                ['slug' => $moduleData['slug']],
                $moduleData
            );
        }

        $this->command->info('✅ ' . count($modules) . ' modules seeded successfully!');
    }
}
