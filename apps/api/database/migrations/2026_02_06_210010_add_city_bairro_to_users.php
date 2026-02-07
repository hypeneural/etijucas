<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Add city_id and bairro_id to users table.
     * Both are nullable initially for backfill.
     * Checks if columns exist before adding.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Only add city_id if it doesn't exist
            if (!Schema::hasColumn('users', 'city_id')) {
                $table->foreignUuid('city_id')->nullable()->after('id')->constrained('cities');
                $table->index('city_id');
            }

            // Only add bairro_id if it doesn't exist
            if (!Schema::hasColumn('users', 'bairro_id')) {
                $table->foreignUuid('bairro_id')->nullable()->after('city_id')->constrained('bairros');
            }
        });

        // Add composite index if both columns exist
        if (Schema::hasColumn('users', 'city_id') && Schema::hasColumn('users', 'bairro_id')) {
            try {
                Schema::table('users', function (Blueprint $table) {
                    $table->index(['city_id', 'bairro_id'], 'users_city_bairro_idx');
                });
            } catch (\Exception $e) {
                // Index might already exist, ignore
            }
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop index first
            try {
                $table->dropIndex('users_city_bairro_idx');
            } catch (\Exception $e) {
                // Index might not exist
            }

            // Only drop city_id (bairro_id might be from original schema)
            if (Schema::hasColumn('users', 'city_id')) {
                $table->dropForeign(['city_id']);
                $table->dropIndex(['city_id']);
                $table->dropColumn('city_id');
            }
        });
    }
};
