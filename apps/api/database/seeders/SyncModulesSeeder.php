<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\Module;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SyncModulesSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Update existing slugs to match frontend
        $updates = [
            'reports' => 'denuncias',
            'phones' => 'telefones',
            'voting' => 'votacoes',
            'council' => 'vereadores', // Mapping council to vereadores (future proofing)
            'alerts' => 'alertas',     // Portuguese consistency
        ];

        foreach ($updates as $old => $new) {
            $module = Module::where('slug', $old)->first();
            if ($module) {
                $module->update(['slug' => $new]);
                $this->command->info("Renamed module '{$old}' to '{$new}'");
            }
        }

        // 2. Create missing modules mandated by Frontend
        $missing = [
            [
                'slug' => 'coleta-lixo',
                'name' => 'Coleta de Lixo',
                'icon' => 'trash-2',
                'description' => 'Horários e dias de coleta de lixo',
                'sort_order' => 3
            ],
            [
                'slug' => 'missas',
                'name' => 'Horários de Missas',
                'icon' => 'church',
                'description' => 'Horários de missas nas igrejas locais',
                'sort_order' => 4
            ],
            [
                'slug' => 'veiculos',
                'name' => 'Consulta Veículos',
                'icon' => 'car',
                'description' => 'Consulta de débitos veiculares',
                'sort_order' => 9
            ],
            [
                'slug' => 'tempo',
                'name' => 'Previsão do Tempo',
                'icon' => 'cloud-rain',
                'description' => 'Previsão do tempo local',
                'sort_order' => 10
            ]
        ];

        foreach ($missing as $data) {
            $module = Module::firstOrCreate(
                ['slug' => $data['slug']],
                [
                    'id' => Str::uuid(),
                    'name' => $data['name'],
                    'icon' => $data['icon'],
                    'description' => $data['description'],
                    'is_core' => false,
                    'current_version' => 1,
                    'sort_order' => $data['sort_order']
                ]
            );
            $this->command->info("Ensured module '{$module->slug}' exists");
        }

        // 3. Enable ALL modules for Tijucas
        $city = City::where('slug', 'tijucas-sc')->first();
        if ($city) {
            $allModules = Module::all();
            $syncData = $allModules->pluck('id')->mapWithKeys(function ($id) {
                return [
                    $id => [
                        'id' => Str::uuid()->toString(),
                        'enabled' => true,
                        'version' => 1,
                        'settings' => json_encode([]),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                ];
            })->toArray();

            $city->modules()->sync($syncData);
            $this->command->info("Enabled {$allModules->count()} modules for Tijucas/SC");

            // Clear cache
            \App\Support\Tenant::clearCache();
        }
    }
}
