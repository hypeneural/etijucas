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
        // =====================================================
        // Topics Table
        // =====================================================
        Schema::create('topics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('bairro_id')->constrained('bairros')->cascadeOnDelete();

            $table->string('titulo', 150);
            $table->text('texto');
            $table->string('categoria', 20)->default('outros');
            $table->string('foto_url', 500)->nullable();
            $table->boolean('is_anon')->default(false);

            $table->string('status', 20)->default('active');
            $table->unsignedInteger('likes_count')->default(0);
            $table->unsignedInteger('comments_count')->default(0);

            $table->softDeletes();
            $table->timestamps();

            // Performance indexes
            $table->index(['bairro_id', 'created_at']);
            $table->index(['categoria', 'created_at']);
            $table->index(['status', 'created_at']);
            $table->index('likes_count');
        });

        // =====================================================
        // Comments Table
        // =====================================================
        Schema::create('comments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('topic_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('parent_id')->nullable()->constrained('comments')->cascadeOnDelete();

            $table->text('texto');
            $table->string('image_url', 500)->nullable();
            $table->boolean('is_anon')->default(false);
            $table->unsignedTinyInteger('depth')->default(0);
            $table->unsignedInteger('likes_count')->default(0);

            $table->softDeletes();
            $table->timestamps();

            // Performance indexes
            $table->index(['topic_id', 'parent_id', 'created_at']);
            $table->index(['topic_id', 'created_at']);
        });

        // =====================================================
        // Topic Likes (Pivot)
        // =====================================================
        Schema::create('topic_likes', function (Blueprint $table) {
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('topic_id')->constrained()->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->primary(['user_id', 'topic_id']);
            $table->index('topic_id'); // For counting
        });

        // =====================================================
        // Comment Likes (Pivot)
        // =====================================================
        Schema::create('comment_likes', function (Blueprint $table) {
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('comment_id')->constrained()->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->primary(['user_id', 'comment_id']);
            $table->index('comment_id'); // For counting
        });

        // =====================================================
        // Saved Topics (Pivot)
        // =====================================================
        Schema::create('saved_topics', function (Blueprint $table) {
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('topic_id')->constrained()->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->primary(['user_id', 'topic_id']);
        });

        // =====================================================
        // Topic Reports
        // =====================================================
        Schema::create('topic_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('topic_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();

            $table->string('motivo', 50);
            $table->text('descricao')->nullable();
            $table->string('status', 20)->default('pending');

            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->unique(['user_id', 'topic_id']); // One report per user per topic
        });

        // =====================================================
        // Comment Reports
        // =====================================================
        Schema::create('comment_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('comment_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();

            $table->string('motivo', 50);
            $table->text('descricao')->nullable();
            $table->string('status', 20)->default('pending');

            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->unique(['user_id', 'comment_id']); // One report per user per comment
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('comment_reports');
        Schema::dropIfExists('topic_reports');
        Schema::dropIfExists('saved_topics');
        Schema::dropIfExists('comment_likes');
        Schema::dropIfExists('topic_likes');
        Schema::dropIfExists('comments');
        Schema::dropIfExists('topics');
    }
};
