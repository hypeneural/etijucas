<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Backfill city_id for legacy records in citizen_reports.
     */
    public function up(): void
    {
        if (!Schema::hasTable('citizen_reports') || !Schema::hasColumn('citizen_reports', 'city_id')) {
            return;
        }

        $defaultCityId = $this->resolveDefaultCityId();
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            $reports = DB::table('citizen_reports')
                ->select(['id', 'user_id', 'bairro_id'])
                ->whereNull('city_id')
                ->get();

            foreach ($reports as $report) {
                $cityId = null;

                if (!empty($report->user_id)) {
                    $cityId = DB::table('users')->where('id', $report->user_id)->value('city_id');
                }

                if (!$cityId && !empty($report->bairro_id)) {
                    $cityId = DB::table('bairros')->where('id', $report->bairro_id)->value('city_id');
                }

                if (!$cityId) {
                    $cityId = $defaultCityId;
                }

                if ($cityId) {
                    DB::table('citizen_reports')
                        ->where('id', $report->id)
                        ->update(['city_id' => $cityId]);
                }
            }
        } else {
            $bindings = [];
            $defaultCitySql = '';

            if ($defaultCityId) {
                $defaultCitySql = ', ?';
                $bindings[] = $defaultCityId;
            }

            DB::statement(
                "
                UPDATE citizen_reports cr
                LEFT JOIN users u ON u.id = cr.user_id
                LEFT JOIN bairros b ON b.id = cr.bairro_id
                SET cr.city_id = COALESCE(u.city_id, b.city_id{$defaultCitySql})
                WHERE cr.city_id IS NULL
                ",
                $bindings
            );
        }

        if ($defaultCityId) {
            DB::table('citizen_reports')
                ->whereNull('city_id')
                ->update(['city_id' => $defaultCityId]);
        }
    }

    public function down(): void
    {
        // Backfill is data-fixing and intentionally not reverted.
    }

    private function resolveDefaultCityId(): ?string
    {
        $cityId = DB::table('cities')
            ->where('slug', 'tijucas-sc')
            ->value('id');

        if ($cityId) {
            return $cityId;
        }

        $cityId = DB::table('cities')
            ->where('active', true)
            ->orderBy('created_at')
            ->value('id');

        if ($cityId) {
            return $cityId;
        }

        return DB::table('cities')->orderBy('created_at')->value('id');
    }
};
