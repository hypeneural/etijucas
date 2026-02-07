<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('modules', function (Blueprint $table) {
            $table->string('module_key', 50)->nullable()->after('slug');
            $table->string('route_slug_ptbr', 80)->nullable()->after('module_key');
            $table->string('name_ptbr', 100)->nullable()->after('name');
        });

        $keyMap = [
            'forum' => 'forum',
            'events' => 'events',
            'denuncias' => 'reports',
            'reports' => 'reports',
            'telefones' => 'phones',
            'phones' => 'phones',
            'alertas' => 'alerts',
            'alerts' => 'alerts',
            'turismo' => 'tourism',
            'tourism' => 'tourism',
            'coleta-lixo' => 'trash',
            'trash' => 'trash',
            'missas' => 'masses',
            'masses' => 'masses',
            'veiculos' => 'vehicles',
            'vehicles' => 'vehicles',
            'tempo' => 'weather',
            'weather' => 'weather',
            'votacoes' => 'voting',
            'voting' => 'voting',
            'vereadores' => 'council',
            'council' => 'council',
        ];

        $routeSlugMap = [
            'forum' => 'forum',
            'events' => 'agenda',
            'reports' => 'denuncias',
            'phones' => 'telefones',
            'alerts' => 'alertas',
            'tourism' => 'pontos-turisticos',
            'trash' => 'coleta-lixo',
            'masses' => 'missas',
            'vehicles' => 'veiculos',
            'weather' => 'previsao',
            'voting' => 'votacoes',
            'council' => 'vereadores',
        ];

        $namePtbrMap = [
            'forum' => 'Forum',
            'events' => 'Eventos',
            'reports' => 'Denuncias',
            'phones' => 'Telefones Uteis',
            'alerts' => 'Alertas',
            'tourism' => 'Turismo',
            'trash' => 'Coleta de Lixo',
            'masses' => 'Missas',
            'vehicles' => 'Veiculos',
            'weather' => 'Previsao do Tempo',
            'voting' => 'Votacoes',
            'council' => 'Vereadores',
        ];

        $modules = DB::table('modules')->select(['id', 'slug', 'name'])->get();

        foreach ($modules as $module) {
            $slug = strtolower(trim((string) $module->slug));
            $moduleKey = $keyMap[$slug] ?? $slug;
            $routeSlugPtbr = $routeSlugMap[$moduleKey] ?? $slug;
            $namePtbr = $namePtbrMap[$moduleKey] ?? $module->name;

            DB::table('modules')
                ->where('id', $module->id)
                ->update([
                    'module_key' => $moduleKey,
                    'route_slug_ptbr' => $routeSlugPtbr,
                    'name_ptbr' => $namePtbr,
                ]);
        }

        // Merge duplicated legacy modules that map to the same module_key.
        $duplicatedKeys = DB::table('modules')
            ->select('module_key')
            ->groupBy('module_key')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('module_key');

        foreach ($duplicatedKeys as $moduleKey) {
            $modulesForKey = DB::table('modules')
                ->where('module_key', $moduleKey)
                ->orderByRaw("CASE WHEN slug IN (?, ?) THEN 0 ELSE 1 END", [$moduleKey, ''])
                ->orderBy('created_at')
                ->get();

            $canonical = $modulesForKey->first();

            if (!$canonical) {
                continue;
            }

            foreach ($modulesForKey->skip(1) as $duplicate) {
                $cityModules = DB::table('city_modules')
                    ->where('module_id', $duplicate->id)
                    ->get();

                foreach ($cityModules as $cityModule) {
                    $existing = DB::table('city_modules')
                        ->where('city_id', $cityModule->city_id)
                        ->where('module_id', $canonical->id)
                        ->first();

                    if ($existing) {
                        DB::table('city_modules')
                            ->where('id', $existing->id)
                            ->update([
                                'enabled' => ((bool) $existing->enabled || (bool) $cityModule->enabled),
                                'updated_at' => now(),
                            ]);

                        DB::table('city_modules')
                            ->where('id', $cityModule->id)
                            ->delete();
                    } else {
                        DB::table('city_modules')
                            ->where('id', $cityModule->id)
                            ->update([
                                'module_id' => $canonical->id,
                                'updated_at' => now(),
                            ]);
                    }
                }

                DB::table('modules')
                    ->where('id', $duplicate->id)
                    ->delete();
            }
        }

        Schema::table('modules', function (Blueprint $table) {
            $table->unique('module_key');
            $table->index('route_slug_ptbr');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('modules', function (Blueprint $table) {
            $table->dropUnique(['module_key']);
            $table->dropIndex(['route_slug_ptbr']);
            $table->dropColumn(['module_key', 'route_slug_ptbr', 'name_ptbr']);
        });
    }
};
