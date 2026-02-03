<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tourism_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('spot_id')->constrained('tourism_spots')->cascadeOnDelete();

            $table->tinyInteger('rating')->unsigned(); // 1-5
            $table->string('titulo', 200)->nullable();
            $table->text('texto');
            $table->json('fotos')->nullable();
            $table->date('visit_date')->nullable();

            // Denormalized counter
            $table->unsignedInteger('likes_count')->default(0);

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['spot_id', 'created_at']);
            $table->index('rating');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tourism_reviews');
    }
};
