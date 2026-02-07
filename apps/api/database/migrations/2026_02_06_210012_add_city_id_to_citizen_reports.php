<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Add city_id to citizen_reports table.
     */
    public function up(): void
    {
        Schema::table('citizen_reports', function (Blueprint $table) {
            $table->foreignUuid('city_id')->nullable()->after('id')->constrained('cities');
            $table->index('city_id');
            $table->index(['city_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('citizen_reports', function (Blueprint $table) {
            $table->dropForeign(['city_id']);
            $table->dropIndex(['city_id']);
            $table->dropIndex(['city_id', 'status']);
            $table->dropColumn('city_id');
        });
    }
};
