<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('votos_registro', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('votacao_id')->constrained('votacoes')->cascadeOnDelete();
            $table->foreignUuid('vereador_id')->constrained('vereadores')->cascadeOnDelete();
            $table->enum('voto', ['SIM', 'NAO', 'ABSTENCAO', 'NAO_VOTOU']);
            $table->text('justificativa')->nullable();
            $table->string('url_video')->nullable();
            $table->timestamps();

            $table->unique(['votacao_id', 'vereador_id']);
            $table->index('voto');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('votos_registro');
    }
};
