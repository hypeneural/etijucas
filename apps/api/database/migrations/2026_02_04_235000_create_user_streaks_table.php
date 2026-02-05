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
        if (!Schema::hasTable('user_streaks')) {
            Schema::create('user_streaks', function (Blueprint $table) {
                $table->id();
                $table->foreignUuid('user_id')->unique()->constrained()->cascadeOnDelete();
                $table->integer('current_streak')->default(0);
                $table->integer('longest_streak')->default(0);
                $table->timestamp('last_check_in_at')->nullable();
                $table->integer('total_check_ins')->default(0);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_streaks');
    }
};
