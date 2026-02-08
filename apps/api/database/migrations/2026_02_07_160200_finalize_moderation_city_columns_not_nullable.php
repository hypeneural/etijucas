<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        $defaultCityId = DB::table('cities')
            ->orderByDesc('active')
            ->orderBy('created_at')
            ->value('id');

        if (!is_string($defaultCityId) || $defaultCityId === '') {
            return;
        }

        $this->fillNullCity('topic_reports', $defaultCityId);
        $this->fillNullCity('comment_reports', $defaultCityId);
        $this->fillNullCity('content_flags', $defaultCityId);

        $this->assertNoNullCity('topic_reports');
        $this->assertNoNullCity('comment_reports');
        $this->assertNoNullCity('content_flags');

        DB::statement('ALTER TABLE topic_reports MODIFY city_id CHAR(36) NOT NULL');
        DB::statement('ALTER TABLE comment_reports MODIFY city_id CHAR(36) NOT NULL');
        DB::statement('ALTER TABLE content_flags MODIFY city_id CHAR(36) NOT NULL');
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        if (!Schema::hasTable('topic_reports') || !Schema::hasColumn('topic_reports', 'city_id')) {
            return;
        }

        DB::statement('ALTER TABLE topic_reports MODIFY city_id CHAR(36) NULL');
        DB::statement('ALTER TABLE comment_reports MODIFY city_id CHAR(36) NULL');
        DB::statement('ALTER TABLE content_flags MODIFY city_id CHAR(36) NULL');
    }

    private function fillNullCity(string $table, string $cityId): void
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'city_id')) {
            return;
        }

        DB::table($table)
            ->whereNull('city_id')
            ->update(['city_id' => $cityId]);
    }

    private function assertNoNullCity(string $table): void
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'city_id')) {
            return;
        }

        $remaining = DB::table($table)->whereNull('city_id')->count();
        if ($remaining > 0) {
            throw new RuntimeException("Cannot make {$table}.city_id NOT NULL: {$remaining} records still null.");
        }
    }
};
