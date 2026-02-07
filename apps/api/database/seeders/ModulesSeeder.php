<?php

namespace Database\Seeders;

use App\Models\Module;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ModulesSeeder extends Seeder
{
    /**
     * Canonical modules catalog.
     * module_key is immutable and used as backend/frontend source of truth.
     */
    private const CATALOG = [
        [
            'module_key' => 'forum',
            'slug' => 'forum',
            'route_slug_ptbr' => 'forum',
            'name' => 'Forum',
            'name_ptbr' => 'Forum',
            'description' => 'Discussoes da comunidade por cidade e bairro',
            'icon' => 'message-circle',
            'is_core' => true,
            'sort_order' => 1,
        ],
        [
            'module_key' => 'events',
            'slug' => 'events',
            'route_slug_ptbr' => 'agenda',
            'name' => 'Events',
            'name_ptbr' => 'Eventos',
            'description' => 'Agenda de eventos da cidade',
            'icon' => 'calendar',
            'is_core' => true,
            'sort_order' => 2,
        ],
        [
            'module_key' => 'reports',
            'slug' => 'denuncias',
            'route_slug_ptbr' => 'denuncias',
            'name' => 'Reports',
            'name_ptbr' => 'Denuncias',
            'description' => 'Fiscaliza cidadao e ocorrencias urbanas',
            'icon' => 'flag',
            'is_core' => true,
            'sort_order' => 3,
        ],
        [
            'module_key' => 'phones',
            'slug' => 'telefones',
            'route_slug_ptbr' => 'telefones',
            'name' => 'Phones',
            'name_ptbr' => 'Telefones Uteis',
            'description' => 'Contatos uteis e emergencia',
            'icon' => 'phone',
            'is_core' => true,
            'sort_order' => 4,
        ],
        [
            'module_key' => 'alerts',
            'slug' => 'alertas',
            'route_slug_ptbr' => 'alertas',
            'name' => 'Alerts',
            'name_ptbr' => 'Alertas',
            'description' => 'Alertas publicos e avisos urgentes',
            'icon' => 'alert-triangle',
            'is_core' => true,
            'sort_order' => 5,
        ],
        [
            'module_key' => 'tourism',
            'slug' => 'turismo',
            'route_slug_ptbr' => 'pontos-turisticos',
            'name' => 'Tourism',
            'name_ptbr' => 'Turismo',
            'description' => 'Pontos turisticos e experiencias locais',
            'icon' => 'map-pin',
            'is_core' => false,
            'sort_order' => 6,
        ],
        [
            'module_key' => 'council',
            'slug' => 'vereadores',
            'route_slug_ptbr' => 'vereadores',
            'name' => 'Council',
            'name_ptbr' => 'Vereadores',
            'description' => 'Mandatos, perfis e acompanhamento da camara',
            'icon' => 'building',
            'is_core' => false,
            'sort_order' => 7,
        ],
        [
            'module_key' => 'voting',
            'slug' => 'votacoes',
            'route_slug_ptbr' => 'votacoes',
            'name' => 'Voting',
            'name_ptbr' => 'Votacoes',
            'description' => 'Votacoes e deliberacoes legislativas',
            'icon' => 'check-square',
            'is_core' => false,
            'sort_order' => 8,
        ],
        [
            'module_key' => 'trash',
            'slug' => 'coleta-lixo',
            'route_slug_ptbr' => 'coleta-lixo',
            'name' => 'Trash Collection',
            'name_ptbr' => 'Coleta de Lixo',
            'description' => 'Dias e horarios de coleta de residuos',
            'icon' => 'trash-2',
            'is_core' => false,
            'sort_order' => 9,
        ],
        [
            'module_key' => 'masses',
            'slug' => 'missas',
            'route_slug_ptbr' => 'missas',
            'name' => 'Masses',
            'name_ptbr' => 'Missas',
            'description' => 'Horarios de missas e igrejas',
            'icon' => 'church',
            'is_core' => false,
            'sort_order' => 10,
        ],
        [
            'module_key' => 'vehicles',
            'slug' => 'veiculos',
            'route_slug_ptbr' => 'veiculos',
            'name' => 'Vehicles',
            'name_ptbr' => 'Veiculos',
            'description' => 'Consulta de informacoes veiculares',
            'icon' => 'car',
            'is_core' => false,
            'sort_order' => 11,
        ],
        [
            'module_key' => 'weather',
            'slug' => 'tempo',
            'route_slug_ptbr' => 'previsao',
            'name' => 'Weather',
            'name_ptbr' => 'Previsao do Tempo',
            'description' => 'Previsao e alertas meteorologicos',
            'icon' => 'cloud-rain',
            'is_core' => false,
            'sort_order' => 12,
        ],
    ];

    /**
     * Seed modules with canonical keys and UI slugs.
     */
    public function run(): void
    {
        foreach (self::CATALOG as $moduleData) {
            $module = Module::query()
                ->where('module_key', $moduleData['module_key'])
                ->orWhere('slug', $moduleData['slug'])
                ->first();

            if ($module) {
                $module->fill($moduleData);
                $module->save();
                continue;
            }

            Module::create([
                'id' => Str::uuid()->toString(),
                ...$moduleData,
                'current_version' => 1,
            ]);
        }

        $this->command->info('Modules catalog synced (' . count(self::CATALOG) . ' modules).');
    }
}
