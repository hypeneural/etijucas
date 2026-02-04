<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->uuid('topic_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Cannot revert to not null safely without checking data, 
        // but for down method we can try
        Schema::table('comments', function (Blueprint $table) {
            $table->uuid('topic_id')->nullable(false)->change();
        });
    }
};
