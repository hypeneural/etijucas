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
        Schema::create('alerts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tipo')->index(); // obras, interdicao, clima, evento, seguranca
            $table->string('titulo');
            $table->text('descricao')->nullable();
            $table->string('nivel')->default('info'); // info, warning, critical
            $table->string('icone')->nullable();
            $table->unsignedInteger('priority')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamp('expires_at')->nullable()->index();
            $table->foreignUuid('bairro_id')->nullable()->constrained('bairros')->nullOnDelete();
            $table->json('metadata')->nullable();
            $table->timestamps();

            // Indexes for common queries
            $table->index(['active', 'expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};
