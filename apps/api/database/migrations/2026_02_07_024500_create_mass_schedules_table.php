<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Creates mass_schedules table for church mass times per city.
     * Each city can have multiple churches with different schedules.
     */
    public function up(): void
    {
        Schema::create('mass_schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('city_id');
            $table->uuid('bairro_id')->nullable();

            // Church details
            $table->string('church_name');
            $table->string('address')->nullable();
            $table->string('phone')->nullable();

            // Schedule type
            $table->enum('day_type', ['weekday', 'saturday', 'sunday', 'holiday']);

            // Time (can have multiple masses per day - use JSON)
            $table->json('times'); // ["07:00", "09:00", "19:00"]

            // Additional info
            $table->text('notes')->nullable();
            $table->boolean('active')->default(true);
            $table->integer('order')->default(0);

            // Location (for map)
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lon', 10, 7)->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Foreign keys
            $table->foreign('city_id')->references('id')->on('cities')->onDelete('cascade');
            $table->foreign('bairro_id')->references('id')->on('bairros')->onDelete('set null');

            // Indexes
            $table->index(['city_id', 'active', 'order']);
            $table->index(['city_id', 'day_type']);
            $table->index(['city_id', 'bairro_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mass_schedules');
    }
};
