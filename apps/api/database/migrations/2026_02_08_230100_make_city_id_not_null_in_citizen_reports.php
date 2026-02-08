<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Enforce city_id as NOT NULL after backfill.
     */
    public function up(): void
    {
        if (!Schema::hasTable('citizen_reports') || !Schema::hasColumn('citizen_reports', 'city_id')) {
            return;
        }

        $remaining = DB::table('citizen_reports')->whereNull('city_id')->count();
        if ($remaining > 0) {
            throw new RuntimeException(
                "Cannot make citizen_reports.city_id NOT NULL: {$remaining} records still null."
            );
        }

        if (DB::getDriverName() === 'sqlite') {
            // SQLite alter-column support is limited in CI; enforce via runtime checks on MySQL/MariaDB.
            return;
        }

        DB::statement('ALTER TABLE citizen_reports MODIFY city_id CHAR(36) NOT NULL');
    }

    public function down(): void
    {
        if (!Schema::hasTable('citizen_reports') || !Schema::hasColumn('citizen_reports', 'city_id')) {
            return;
        }

        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement('ALTER TABLE citizen_reports MODIFY city_id CHAR(36) NULL');
    }
};
