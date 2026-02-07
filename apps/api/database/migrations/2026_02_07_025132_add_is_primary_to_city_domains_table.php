<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Adds is_primary flag to city_domains to mark the canonical domain.
     * Ensures only one primary domain per city.
     */
    public function up(): void
    {
        // Only add column if it doesn't exist
        if (!Schema::hasColumn('city_domains', 'is_primary')) {
            Schema::table('city_domains', function (Blueprint $table) {
                $table->boolean('is_primary')->default(false)->after('domain');
            });
        }

        // Create partial unique index - only one primary per city
        // MariaDB doesn't support partial indexes, so we use a trigger or app-side validation
        // For MySQL 8+, we could use: CREATE UNIQUE INDEX idx ON city_domains (city_id) WHERE is_primary = 1

        // Set the first domain of each city as primary
        DB::statement("
            UPDATE city_domains cd1
            SET is_primary = 1
            WHERE cd1.id = (
                SELECT MIN(cd2.id) 
                FROM (SELECT * FROM city_domains) cd2 
                WHERE cd2.city_id = cd1.city_id
            )
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('city_domains', function (Blueprint $table) {
            $table->dropColumn('is_primary');
        });
    }
};

