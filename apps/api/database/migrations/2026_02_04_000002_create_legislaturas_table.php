<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('legislaturas', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->integer('numero')->unique(); // Ex: 20
            $table->year('ano_inicio'); // 2025
            $table->year('ano_fim');    // 2028
            $table->boolean('atual')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('legislaturas');
    }
};
