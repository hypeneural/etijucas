<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('votacoes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('protocolo')->unique()->nullable();
            $table->string('titulo');
            $table->string('subtitulo')->nullable();
            $table->text('descricao')->nullable();
            $table->text('ementa')->nullable();
            $table->string('tipo')->default('PROJETO_LEI');
            $table->enum('status', ['APROVADO', 'REJEITADO', 'EM_ANDAMENTO', 'ARQUIVADO'])->default('EM_ANDAMENTO');
            $table->date('data');
            $table->string('sessao')->nullable();
            $table->unsignedInteger('votos_sim')->default(0);
            $table->unsignedInteger('votos_nao')->default(0);
            $table->unsignedInteger('votos_abstencao')->default(0);
            $table->unsignedInteger('votos_ausente')->default(0);
            $table->string('url_fonte')->nullable();
            $table->string('url_documento')->nullable();
            $table->json('tags')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('data');
            $table->index('status');
            $table->index('tipo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('votacoes');
    }
};
