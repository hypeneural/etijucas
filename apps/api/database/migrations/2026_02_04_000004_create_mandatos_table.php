<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mandatos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vereador_id')->constrained('vereadores')->cascadeOnDelete();
            $table->foreignUuid('partido_id')->constrained('partidos')->cascadeOnDelete();
            $table->foreignUuid('legislatura_id')->constrained('legislaturas')->cascadeOnDelete();
            $table->string('cargo')->default('Vereador');
            $table->date('inicio');
            $table->date('fim')->nullable();
            $table->boolean('em_exercicio')->default(true);
            $table->text('observacoes')->nullable();
            $table->timestamps();

            $table->index(['vereador_id', 'legislatura_id']);
            $table->index('em_exercicio');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mandatos');
    }
};
