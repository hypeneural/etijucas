<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Add brand JSON column to cities table.
     * Stores branding configuration using CityBrandDTO format.
     */
    public function up(): void
    {
        Schema::table('cities', function (Blueprint $table) {
            $table->json('brand')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('cities', function (Blueprint $table) {
            $table->dropColumn('brand');
        });
    }
};
