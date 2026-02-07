<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Creates trash_schedules table for city garbage collection schedules.
     * Each city can have multiple schedules (organic, recyclable, etc.)
     */
    public function up(): void
    {
        Schema::create('trash_schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('city_id');
            $table->uuid('bairro_id')->nullable(); // null = applies to all bairros

            // Schedule details
            $table->string('type'); // organic, recyclable, general, bulky
            $table->string('name'); // "Lixo Orgânico", "Reciclável"
            $table->string('icon')->nullable(); // emoji or icon name
            $table->string('color')->nullable(); // hex color for UI

            // Days of week (JSON array: [1,3,5] = Mon, Wed, Fri)
            $table->json('days_of_week');

            // Time window
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();

            // Additional info
            $table->text('notes')->nullable();
            $table->boolean('active')->default(true);
            $table->integer('order')->default(0);

            $table->timestamps();
            $table->softDeletes();

            // Foreign keys
            $table->foreign('city_id')->references('id')->on('cities')->onDelete('cascade');
            $table->foreign('bairro_id')->references('id')->on('bairros')->onDelete('set null');

            // Indexes for tenant-scoped queries
            $table->index(['city_id', 'active', 'order']);
            $table->index(['city_id', 'bairro_id']);
            $table->index(['city_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trash_schedules');
    }
};

