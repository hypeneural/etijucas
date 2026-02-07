<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Adiciona FK state_id e campos extras em cities
     */
    public function up(): void
    {
        Schema::table('cities', function (Blueprint $table) {
            $table->foreignUuid('state_id')->nullable()->after('id')->constrained('states');
            $table->boolean('is_capital')->default(false)->after('active');
            $table->integer('siafi_id')->nullable()->after('is_capital');
            $table->unsignedInteger('population')->nullable()->after('siafi_id');

            // Índices para performance
            $table->index(['state_id', 'active']);
            $table->index(['uf', 'slug']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cities', function (Blueprint $table) {
            $table->dropForeign(['state_id']);
            $table->dropIndex(['state_id', 'active']);
            $table->dropIndex(['uf', 'slug']);
            $table->dropColumn(['state_id', 'is_capital', 'siafi_id', 'population']);
        });
    }
};
