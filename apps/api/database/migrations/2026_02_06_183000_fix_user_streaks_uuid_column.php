<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Fix: user_streaks table was created with $table->id() (BIGINT)
 * but the UserStreak model uses HasUuids trait which generates UUIDs.
 * UUIDs are 36-character strings that don't fit in a BIGINT column.
 * 
 * This migration recreates the table with proper UUID primary key.
 */
return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop existing table (it's empty or has bad data anyway)
        Schema::dropIfExists('user_streaks');

        // Recreate with proper UUID column
        Schema::create('user_streaks', function (Blueprint $table) {
            $table->uuid('id')->primary(); // <-- Use UUID instead of $table->id()
            $table->foreignUuid('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->integer('current_streak')->default(0);
            $table->integer('longest_streak')->default(0);
            $table->timestamp('last_check_in_at')->nullable();
            $table->integer('total_check_ins')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_streaks');
    }
};
