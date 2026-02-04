<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Create votacao_reactions table for like/dislike
        Schema::create('votacao_reactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('votacao_id');
            $table->uuid('user_id');
            $table->enum('reaction', ['like', 'dislike']);
            $table->timestamps();

            $table->foreign('votacao_id')
                ->references('id')
                ->on('votacoes')
                ->onDelete('cascade');

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            // One reaction per user per votação
            $table->unique(['votacao_id', 'user_id']);
        });

        // Add counters to votacoes table
        Schema::table('votacoes', function (Blueprint $table) {
            $table->unsignedInteger('likes_count')->default(0)->after('votos_ausente');
            $table->unsignedInteger('dislikes_count')->default(0)->after('likes_count');
            $table->unsignedInteger('comments_count')->default(0)->after('dislikes_count');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('votacao_reactions');

        Schema::table('votacoes', function (Blueprint $table) {
            $table->dropColumn(['likes_count', 'dislikes_count', 'comments_count']);
        });
    }
};
