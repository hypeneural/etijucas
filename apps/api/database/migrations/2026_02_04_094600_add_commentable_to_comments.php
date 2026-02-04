<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            // Add polymorphic columns
            $table->string('commentable_type')->nullable()->after('id');
            $table->uuid('commentable_id')->nullable()->after('commentable_type');

            // Index for polymorphic lookups
            $table->index(['commentable_type', 'commentable_id'], 'comments_commentable_index');
        });

        // Migrate existing data: topic_id → commentable
        DB::statement("UPDATE comments SET commentable_type = 'App\\\\Models\\\\Topic', commentable_id = topic_id WHERE topic_id IS NOT NULL");
    }

    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->dropIndex('comments_commentable_index');
            $table->dropColumn(['commentable_type', 'commentable_id']);
        });
    }
};
