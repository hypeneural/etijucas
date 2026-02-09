<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Configure default module enablement for all cities.
 * 
 * Active modules: reports, forum, weather
 * Disabled modules: events, phones, tourism, masses, trash, council, voting, vehicles
 */
return new class extends Migration {
    // Modules to ENABLE for all cities
    private const ENABLE_MODULES = ['reports', 'forum', 'weather'];

    // Modules to DISABLE for all cities
    private const DISABLE_MODULES = ['events', 'phones', 'tourism', 'masses', 'trash', 'council', 'voting', 'vehicles', 'alerts'];

    public function up(): void
    {
        $cities = DB::table('cities')->where('active', true)->pluck('id');
        $modules = DB::table('modules')->get()->keyBy('module_key');

        foreach ($cities as $cityId) {
            // Enable specified modules
            foreach (self::ENABLE_MODULES as $moduleKey) {
                $module = $modules->get($moduleKey);
                if (!$module)
                    continue;

                $this->upsertCityModule($cityId, $module->id, true);
            }

            // Disable specified modules
            foreach (self::DISABLE_MODULES as $moduleKey) {
                $module = $modules->get($moduleKey);
                if (!$module)
                    continue;

                $this->upsertCityModule($cityId, $module->id, false);
            }
        }
    }

    public function down(): void
    {
        // Revert to is_core defaults by removing city_modules entries
        $moduleKeys = array_merge(self::ENABLE_MODULES, self::DISABLE_MODULES);

        $moduleIds = DB::table('modules')
            ->whereIn('module_key', $moduleKeys)
            ->pluck('id');

        DB::table('city_modules')
            ->whereIn('module_id', $moduleIds)
            ->delete();
    }

    private function upsertCityModule(string $cityId, string $moduleId, bool $enabled): void
    {
        $existing = DB::table('city_modules')
            ->where('city_id', $cityId)
            ->where('module_id', $moduleId)
            ->first();

        if ($existing) {
            DB::table('city_modules')
                ->where('id', $existing->id)
                ->update([
                    'enabled' => $enabled,
                    'updated_at' => now(),
                ]);
        } else {
            DB::table('city_modules')->insert([
                'id' => Str::orderedUuid()->toString(),
                'city_id' => $cityId,
                'module_id' => $moduleId,
                'enabled' => $enabled,
                'version' => 1,
                'settings' => json_encode([]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
};
