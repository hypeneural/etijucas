<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Create the city_modules table.
     * 
     * Configurations per city for each module.
     */
    public function up(): void
    {
        Schema::create('city_modules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('city_id');
            $table->uuid('module_id');
            $table->boolean('enabled')->default(true);
            $table->integer('version')->default(1);
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->foreign('city_id')->references('id')->on('cities')->onDelete('cascade');
            $table->foreign('module_id')->references('id')->on('modules')->onDelete('cascade');
            $table->unique(['city_id', 'module_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('city_modules');
    }
};
