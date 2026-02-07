<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Add status column to cities table.
     * Replaces boolean 'active' with enum-based status.
     */
    public function up(): void
    {
        Schema::table('cities', function (Blueprint $table) {
            $table->string('status', 20)->default('draft')->after('slug');
        });

        // Migrate existing 'active' values to new status
        if (Schema::hasColumn('cities', 'active')) {
            DB::table('cities')
                ->where('active', true)
                ->update(['status' => 'active']);

            DB::table('cities')
                ->where('active', false)
                ->update(['status' => 'draft']);
        }
    }

    public function down(): void
    {
        Schema::table('cities', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
