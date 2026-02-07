<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Add city_id to events and venues tables.
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->foreignUuid('city_id')->nullable()->after('id')->constrained('cities');
            $table->index('city_id');
        });

        if (Schema::hasTable('venues')) {
            Schema::table('venues', function (Blueprint $table) {
                $table->foreignUuid('city_id')->nullable()->after('id')->constrained('cities');
                $table->index('city_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropForeign(['city_id']);
            $table->dropIndex(['city_id']);
            $table->dropColumn('city_id');
        });

        if (Schema::hasTable('venues')) {
            Schema::table('venues', function (Blueprint $table) {
                $table->dropForeign(['city_id']);
                $table->dropIndex(['city_id']);
                $table->dropColumn('city_id');
            });
        }
    }
};
