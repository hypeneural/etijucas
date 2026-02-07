<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Add city_id to tourism_spots, alerts, phones tables.
     */
    public function up(): void
    {
        Schema::table('tourism_spots', function (Blueprint $table) {
            $table->foreignUuid('city_id')->nullable()->after('id')->constrained('cities');
            $table->index('city_id');
        });

        Schema::table('alerts', function (Blueprint $table) {
            $table->foreignUuid('city_id')->nullable()->after('id')->constrained('cities');
            $table->index('city_id');
        });

        Schema::table('phones', function (Blueprint $table) {
            $table->foreignUuid('city_id')->nullable()->after('id')->constrained('cities');
            $table->index('city_id');
        });
    }

    public function down(): void
    {
        Schema::table('tourism_spots', function (Blueprint $table) {
            $table->dropForeign(['city_id']);
            $table->dropIndex(['city_id']);
            $table->dropColumn('city_id');
        });

        Schema::table('alerts', function (Blueprint $table) {
            $table->dropForeign(['city_id']);
            $table->dropIndex(['city_id']);
            $table->dropColumn('city_id');
        });

        Schema::table('phones', function (Blueprint $table) {
            $table->dropForeign(['city_id']);
            $table->dropIndex(['city_id']);
            $table->dropColumn('city_id');
        });
    }
};
