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
        Schema::create('vehicle_cache', function (Blueprint $table) {
            $table->id();

            // Primary cache key
            $table->string('plate', 7)->unique();          // normalized, e.g.: ABC1D23
            $table->string('plate_type', 16)->nullable();  // old|mercosul
            $table->unsignedTinyInteger('final_digit')->nullable(); // 0..9

            // Quick access fields (for fast display)
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->string('color')->nullable();
            $table->string('uf', 2)->nullable();
            $table->string('municipio')->nullable();
            $table->string('situacao')->nullable();
            $table->string('logo_url')->nullable();

            // Raw JSON data (full API response)
            $table->json('payload')->nullable();     // complete response
            $table->json('extra')->nullable();       // payload.extra (if exists)
            $table->json('fipe')->nullable();        // payload.fipe (if exists)

            // Cache control
            $table->timestamp('fetched_at')->nullable();
            $table->timestamp('expires_at')->nullable();

            // Negative cache (for 406, etc.)
            $table->unsignedSmallInteger('last_status')->nullable(); // 200, 406, 429...
            $table->string('last_error')->nullable();

            // Usage tracking
            $table->unsignedInteger('hits')->default(0);

            $table->timestamps();

            // Indexes for performance
            $table->index(['expires_at']);
            $table->index(['plate_type', 'final_digit']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicle_cache');
    }
};
