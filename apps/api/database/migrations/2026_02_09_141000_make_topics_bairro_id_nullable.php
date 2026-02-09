<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Make bairro_id nullable in topics table to allow posts without specifying a neighborhood.
     */
    public function up(): void
    {
        Schema::table('topics', function (Blueprint $table) {
            // Drop the foreign key constraint first
            $table->dropForeign(['bairro_id']);

            // Make bairro_id nullable
            $table->uuid('bairro_id')->nullable()->change();

            // Re-add the foreign key with nullable support
            $table->foreign('bairro_id')
                ->references('id')
                ->on('bairros')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('topics', function (Blueprint $table) {
            // Drop the foreign key
            $table->dropForeign(['bairro_id']);

            // Make bairro_id required again (this will fail if there are null values)
            $table->uuid('bairro_id')->nullable(false)->change();

            // Re-add the foreign key  
            $table->foreign('bairro_id')
                ->references('id')
                ->on('bairros')
                ->cascadeOnDelete();
        });
    }
};
