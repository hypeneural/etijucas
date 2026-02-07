<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Add city_id to topics and comments tables.
     */
    public function up(): void
    {
        Schema::table('topics', function (Blueprint $table) {
            $table->foreignUuid('city_id')->nullable()->after('id')->constrained('cities');
            $table->index('city_id');
            $table->index(['city_id', 'bairro_id']);
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->foreignUuid('city_id')->nullable()->after('id')->constrained('cities');
            $table->index('city_id');
        });
    }

    public function down(): void
    {
        Schema::table('topics', function (Blueprint $table) {
            $table->dropForeign(['city_id']);
            $table->dropIndex(['city_id']);
            $table->dropIndex(['city_id', 'bairro_id']);
            $table->dropColumn('city_id');
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->dropForeign(['city_id']);
            $table->dropIndex(['city_id']);
            $table->dropColumn('city_id');
        });
    }
};
