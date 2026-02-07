<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * States (Estados) - 27 estados brasileiros
     * Fonte: municipios-brasileiros-main/json/estados.json
     */
    public function up(): void
    {
        Schema::create('states', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedSmallInteger('ibge_code')->unique(); // codigo_uf
            $table->char('uf', 2)->unique();
            $table->string('name', 100);
            $table->decimal('lat', 10, 8)->nullable();
            $table->decimal('lon', 11, 8)->nullable();
            $table->string('region', 20); // Norte, Nordeste, Sul, Sudeste, Centro-Oeste
            $table->timestamps();

            $table->index('region');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('states');
    }
};
