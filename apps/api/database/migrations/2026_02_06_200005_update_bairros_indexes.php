<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Step 2: Update bairros indexes - create composite unique, drop old unique
     */
    public function up(): void
    {
        Schema::table('bairros', function (Blueprint $table) {
            // Create composite unique index
            $table->unique(['city_id', 'slug'], 'bairros_city_slug_unique');

            // Create performance index for listing
            $table->index(['city_id', 'active', 'sort_order'], 'bairros_city_active_sort_idx');
        });

        // Drop old unique index on slug only (if exists)
        // Using raw SQL for compatibility
        try {
            Schema::table('bairros', function (Blueprint $table) {
                $table->dropUnique(['slug']);
            });
        } catch (\Exception $e) {
            // Index might not exist, ignore
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bairros', function (Blueprint $table) {
            $table->dropUnique('bairros_city_slug_unique');
            $table->dropIndex('bairros_city_active_sort_idx');

            // Restore original unique
            $table->unique('slug');
        });
    }
};
