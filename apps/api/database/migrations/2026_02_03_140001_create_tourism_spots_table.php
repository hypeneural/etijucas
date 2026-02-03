<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tourism_spots', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Basic info
            $table->string('titulo', 200);
            $table->string('slug')->unique();
            $table->string('desc_curta', 500);
            $table->text('desc_longa')->nullable();

            // Categorization
            $table->enum('categoria', [
                'natureza',
                'cultura',
                'historia',
                'gastronomia',
                'aventura',
                'praia',
                'religioso',
                'familia',
                'compras',
                'lazer'
            ]);
            $table->json('tags')->nullable();

            // Media
            $table->string('image_url')->nullable();
            $table->json('gallery')->nullable();
            $table->string('video_url')->nullable();

            // Location
            $table->string('endereco');
            $table->foreignUuid('bairro_id')->nullable()->constrained('bairros')->nullOnDelete();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->text('como_chegar')->nullable();

            // Hours and Contact
            $table->json('horarios')->nullable();
            $table->string('telefone', 20)->nullable();
            $table->string('whatsapp', 20)->nullable();
            $table->string('website')->nullable();
            $table->string('instagram', 100)->nullable();

            // Extra info
            $table->enum('preco', ['gratis', 'barato', 'moderado', 'caro'])->default('gratis');
            $table->string('duracao', 50)->nullable();
            $table->enum('dificuldade', ['facil', 'moderada', 'dificil'])->default('facil');
            $table->json('acessibilidade')->nullable();
            $table->json('dicas_visita')->nullable();

            // Flags
            $table->boolean('is_destaque')->default(false);
            $table->boolean('is_verificado')->default(false);

            // Counters (denormalized for performance)
            $table->unsignedInteger('views_count')->default(0);
            $table->unsignedInteger('likes_count')->default(0);
            $table->unsignedInteger('reviews_count')->default(0);
            $table->decimal('rating_avg', 2, 1)->default(0);

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('categoria');
            $table->index('bairro_id');
            $table->index('is_destaque');
            $table->index('rating_avg');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tourism_spots');
    }
};
