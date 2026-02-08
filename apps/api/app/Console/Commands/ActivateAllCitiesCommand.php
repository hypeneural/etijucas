<?php

namespace App\Console\Commands;

use App\Enums\CityStatus;
use App\Models\City;
use App\Models\CityModule;
use App\Models\Module;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * ActivateAllCitiesCommand
 *
 * Activates ALL cities in Brazil and enables core modules for each.
 * - Sets active = true
 * - Sets status = 'active'
 * - Enables reports, weather, forum modules
 */
class ActivateAllCitiesCommand extends Command
{
    protected $signature = 'cities:activate-all 
                            {--dry-run : Show what would be done without making changes}
                            {--modules-only : Only enable modules, don\'t change city status}';

    protected $description = 'Activate all cities in Brazil and enable core modules (reports, weather, forum)';

    /**
     * Modules to enable for all cities.
     */
    private const MODULES_TO_ENABLE = [
        'reports',  // Boca no Trombone (Denúncias)
        'weather',  // Previsão do Tempo
        'forum',    // Fórum da Cidade
    ];

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $modulesOnly = $this->option('modules-only');

        $this->info('🌍 Ativação de Cidades e Módulos do Brasil');
        $this->newLine();

        if ($dryRun) {
            $this->warn('⚠️  MODO DRY-RUN: Nenhuma alteração será feita');
            $this->newLine();
        }

        // Get current stats
        $totalCities = City::count();
        $activeCities = City::where('active', true)->count();
        $inactiveCities = $totalCities - $activeCities;

        $this->table(
            ['Métrica', 'Valor'],
            [
                ['Total de cidades', $totalCities],
                ['Ativas', $activeCities],
                ['Inativas', $inactiveCities],
            ]
        );
        $this->newLine();

        // Get modules
        $modules = Module::whereIn('module_key', self::MODULES_TO_ENABLE)->get();

        if ($modules->isEmpty()) {
            $this->error('❌ Módulos não encontrados: ' . implode(', ', self::MODULES_TO_ENABLE));
            return Command::FAILURE;
        }

        $this->info("📦 Módulos a ativar: " . $modules->pluck('module_key')->implode(', '));
        $this->newLine();

        if (!$dryRun && !$this->confirm('Deseja continuar?', true)) {
            $this->warn('Operação cancelada.');
            return Command::SUCCESS;
        }

        // Activate cities
        $citiesActivated = 0;
        $modulesCreated = 0;
        $modulesSkipped = 0;

        if ($dryRun) {
            $citiesActivated = $inactiveCities;
            $modulesCreated = $totalCities * $modules->count();
            
            $this->info("📊 Resultado estimado (dry-run):");
            $this->line("   - Cidades a ativar: {$citiesActivated}");
            $this->line("   - Registros city_modules a criar: {$modulesCreated}");
        } else {
            DB::transaction(function () use ($modules, $modulesOnly, &$citiesActivated, &$modulesCreated, &$modulesSkipped) {
                // Step 1: Activate all cities
                if (!$modulesOnly) {
                    $citiesActivated = City::where('active', false)
                        ->orWhere('status', '!=', CityStatus::Active->value)
                        ->update([
                            'active' => true,
                            'status' => CityStatus::Active->value,
                        ]);
                }

                // Step 2: Enable modules for all cities
                $cities = City::all();
                $bar = $this->output->createProgressBar($cities->count());
                $bar->start();

                foreach ($cities as $city) {
                    foreach ($modules as $module) {
                        $exists = CityModule::where('city_id', $city->id)
                            ->where('module_id', $module->id)
                            ->exists();

                        if ($exists) {
                            $modulesSkipped++;
                        } else {
                            CityModule::create([
                                'city_id' => $city->id,
                                'module_id' => $module->id,
                                'enabled' => true,
                                'version' => 1,
                                'settings' => [],
                            ]);
                            $modulesCreated++;
                        }
                    }
                    $bar->advance();
                }

                $bar->finish();
            });

            $this->newLine(2);
            $this->info('✅ Operação concluída!');
            $this->table(
                ['Ação', 'Quantidade'],
                [
                    ['Cidades ativadas', $citiesActivated],
                    ['Módulos habilitados', $modulesCreated],
                    ['Módulos já existentes (ignorados)', $modulesSkipped],
                ]
            );
        }

        return Command::SUCCESS;
    }
}
