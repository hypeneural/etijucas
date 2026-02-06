<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('address_mismatch_agg', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('city_id')->constrained('cities')->cascadeOnDelete();
            $table->string('bairro_text_key');     // Normalized slug
            $table->string('bairro_text_example'); // Original text example
            $table->unsignedInteger('count')->default(1);
            $table->timestamp('last_seen_at');
            $table->enum('provider', ['viacep', 'manual', 'gps'])->default('viacep');
            $table->timestamps();

            // Unique constraint: one aggregate per city/key/provider
            $table->unique(['city_id', 'bairro_text_key', 'provider']);

            // Index for Filament widget (top unmatched)
            $table->index(['city_id', 'count']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('address_mismatch_agg');
    }
};
