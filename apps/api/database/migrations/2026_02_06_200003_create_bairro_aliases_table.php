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
        Schema::create('bairro_aliases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('city_id')->constrained('cities')->cascadeOnDelete();
            $table->foreignUuid('bairro_id')->constrained('bairros')->cascadeOnDelete();
            $table->string('alias');
            $table->string('alias_slug');
            $table->enum('source', ['manual', 'viacep_observed', 'user_observed'])->default('manual');
            $table->boolean('enabled')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            // Unique constraint: one alias per city
            $table->unique(['city_id', 'alias_slug']);

            // Index for lookups
            $table->index(['city_id', 'enabled', 'alias_slug']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bairro_aliases');
    }
};
