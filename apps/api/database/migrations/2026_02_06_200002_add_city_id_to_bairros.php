<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Step 1 of bairros migration: Add city_id as nullable
     */
    public function up(): void
    {
        Schema::table('bairros', function (Blueprint $table) {
            $table->foreignUuid('city_id')
                ->nullable()
                ->after('id')
                ->constrained('cities')
                ->nullOnDelete();

            $table->unsignedInteger('sort_order')->default(0)->after('active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bairros', function (Blueprint $table) {
            $table->dropForeign(['city_id']);
            $table->dropColumn(['city_id', 'sort_order']);
        });
    }
};
