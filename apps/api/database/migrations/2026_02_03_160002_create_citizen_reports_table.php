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
        Schema::create('citizen_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('category_id')->constrained('report_categories')->cascadeOnDelete();
            $table->foreignUuid('bairro_id')->nullable()->constrained('bairros')->nullOnDelete();

            // Content
            $table->string('title', 200);
            $table->text('description');

            // Status & Protocol
            $table->string('status', 20)->default('recebido'); // recebido, em_analise, resolvido, rejeitado
            $table->string('protocol', 20)->unique(); // ETJ-000123

            // Location
            $table->string('address_text', 500)->nullable();
            $table->string('address_source', 20)->default('manual'); // gps, manual, mapa
            $table->string('location_quality', 20)->default('manual'); // precisa, aproximada, manual
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->integer('location_accuracy_m')->nullable();

            // Timestamps
            $table->timestamps();
            $table->timestamp('resolved_at')->nullable();
            $table->softDeletes();

            // Indexes for performance
            $table->index(['user_id', 'created_at']);
            $table->index(['status', 'created_at']);
            $table->index('bairro_id');
            $table->index('category_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('citizen_reports');
    }
};
