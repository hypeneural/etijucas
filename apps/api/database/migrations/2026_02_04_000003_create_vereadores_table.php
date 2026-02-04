<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('vereadores', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nome');
            $table->string('slug')->unique();
            $table->date('nascimento')->nullable();
            $table->string('cpf', 14)->nullable();
            $table->string('telefone', 20)->nullable();
            $table->string('email')->nullable();
            $table->string('foto_url')->nullable();
            $table->text('bio')->nullable();
            $table->json('redes_sociais')->nullable();
            $table->string('site_oficial_url')->nullable();
            $table->boolean('ativo')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('ativo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vereadores');
    }
};
