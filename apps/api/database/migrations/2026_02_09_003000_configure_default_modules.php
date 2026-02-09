<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Configure default module enablement for all cities.
 * 
 * OPTIMIZED VERSION: Uses raw SQL bulk operations
 * 
 * Active modules: reports, forum, weather
 * Disabled modules: events, phones, tourism, masses, trash, council, voting, vehicles, alerts
 */
return new class extends Migration {
    // Modules to ENABLE for all cities
    private const ENABLE_MODULES = ['reports', 'forum', 'weather'];

    // Modules to DISABLE for all cities
    private const DISABLE_MODULES = ['events', 'phones', 'tourism', 'masses', 'trash', 'council', 'voting', 'vehicles', 'alerts'];

    public function up(): void
    {
        $modules = DB::table('modules')
            ->whereIn('module_key', array_merge(self::ENABLE_MODULES, self::DISABLE_MODULES))
            ->get()
            ->keyBy('module_key');

        if ($modules->isEmpty()) {
            return;
        }

        // Get all active city IDs
        $cityIds = DB::table('cities')
            ->where('active', true)
            ->pluck('id')
            ->toArray();

        if (empty($cityIds)) {
            return;
        }

        // Build bulk insert data
        $inserts = [];
        $now = now();

        foreach ($cityIds as $cityId) {
            foreach (self::ENABLE_MODULES as $moduleKey) {
                $module = $modules->get($moduleKey);
                if (!$module)
                    continue;

                $inserts[] = [
                    'id' => Str::orderedUuid()->toString(),
                    'city_id' => $cityId,
                    'module_id' => $module->id,
                    'enabled' => true,
                    'version' => 1,
                    'settings' => '{}',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            foreach (self::DISABLE_MODULES as $moduleKey) {
                $module = $modules->get($moduleKey);
                if (!$module)
                    continue;

                $inserts[] = [
                    'id' => Str::orderedUuid()->toString(),
                    'city_id' => $cityId,
                    'module_id' => $module->id,
                    'enabled' => false,
                    'version' => 1,
                    'settings' => '{}',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        // Delete existing entries first
        $moduleIds = $modules->pluck('id')->toArray();
        DB::table('city_modules')
            ->whereIn('module_id', $moduleIds)
            ->delete();

        // Bulk insert in chunks of 1000
        foreach (array_chunk($inserts, 1000) as $chunk) {
            DB::table('city_modules')->insert($chunk);
        }
    }

    public function down(): void
    {
        $moduleKeys = array_merge(self::ENABLE_MODULES, self::DISABLE_MODULES);

        $moduleIds = DB::table('modules')
            ->whereIn('module_key', $moduleKeys)
            ->pluck('id');

        DB::table('city_modules')
            ->whereIn('module_id', $moduleIds)
            ->delete();
    }
};
