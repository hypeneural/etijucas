<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Add composite indexes for tenant-scoped reports queries.
     */
    public function up(): void
    {
        if (!Schema::hasTable('citizen_reports')) {
            return;
        }

        Schema::table('citizen_reports', function (Blueprint $table) {
            $table->index(['city_id', 'created_at'], 'citizen_reports_city_created_idx');
            $table->index(['city_id', 'status', 'created_at'], 'citizen_reports_city_status_created_idx');
            $table->index(['city_id', 'category_id', 'created_at'], 'citizen_reports_city_category_created_idx');
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('citizen_reports')) {
            return;
        }

        Schema::table('citizen_reports', function (Blueprint $table) {
            $table->dropIndex('citizen_reports_city_created_idx');
            $table->dropIndex('citizen_reports_city_status_created_idx');
            $table->dropIndex('citizen_reports_city_category_created_idx');
        });
    }
};
