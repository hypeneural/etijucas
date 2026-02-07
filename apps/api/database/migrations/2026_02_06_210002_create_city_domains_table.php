<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * City Domains - Resolve tenant por domínio (sem regex)
     * Permite múltiplos domínios por cidade e domínios customizados
     */
    public function up(): void
    {
        Schema::create('city_domains', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('city_id')->constrained('cities')->cascadeOnDelete();
            $table->string('domain', 255)->unique(); // etijucas.com.br
            $table->boolean('is_primary')->default(true);
            $table->timestamps();

            $table->index('city_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('city_domains');
    }
};
