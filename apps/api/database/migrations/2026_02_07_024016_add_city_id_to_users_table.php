<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Adds city_id to users table for multi-tenancy support.
     * Backfills existing users based on their bairro relationship.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->uuid('city_id')->nullable()->after('id');

            $table->foreign('city_id')
                ->references('id')
                ->on('cities')
                ->onDelete('set null');

            // Composite index for tenant-scoped queries
            $table->index(['city_id', 'created_at']);
        });

        // Backfill: derive city_id from bairro relationship
        DB::statement("
            UPDATE users u
            SET city_id = (
                SELECT b.city_id 
                FROM bairros b 
                WHERE b.id = u.bairro_id
            )
            WHERE u.bairro_id IS NOT NULL
              AND u.city_id IS NULL
        ");

        // For users without bairro, set default city (Tijucas)
        $defaultCityId = DB::table('cities')
            ->where('slug', 'tijucas-sc')
            ->value('id');

        if ($defaultCityId) {
            DB::table('users')
                ->whereNull('city_id')
                ->update(['city_id' => $defaultCityId]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['city_id']);
            $table->dropIndex(['city_id', 'created_at']);
            $table->dropColumn('city_id');
        });
    }
};

