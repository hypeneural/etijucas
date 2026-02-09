<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Creates topic_reactions table for "Eu vi também" (confirm) and "Apoiar" (support) interactions.
     */
    public function up(): void
    {
        Schema::create('topic_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('topic_id')->constrained('topics')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('type', ['confirm', 'support'])->comment('confirm = Eu vi também, support = Apoiar');
            $table->timestamp('created_at')->useCurrent();

            // Each user can only react once per type per topic
            $table->unique(['topic_id', 'user_id', 'type'], 'topic_reactions_unique');

            // Index for counting reactions by type
            $table->index(['topic_id', 'type']);
        });

        // Add counter columns to topics table for performance
        Schema::table('topics', function (Blueprint $table) {
            $table->unsignedInteger('confirms_count')->default(0)->after('likes_count');
            $table->unsignedInteger('supports_count')->default(0)->after('confirms_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('topics', function (Blueprint $table) {
            $table->dropColumn(['confirms_count', 'supports_count']);
        });

        Schema::dropIfExists('topic_reactions');
    }
};
