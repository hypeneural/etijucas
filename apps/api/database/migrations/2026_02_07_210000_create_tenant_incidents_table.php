<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tenant_incidents', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('city_id')->nullable();
            $table->string('type', 120);
            $table->string('severity', 20)->default('warning');
            $table->string('source', 50)->nullable();
            $table->string('module_key', 50)->nullable();
            $table->string('request_id', 64)->nullable();
            $table->string('trace_id', 64)->nullable();
            $table->json('context')->nullable();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamps();

            $table->foreign('city_id')
                ->references('id')
                ->on('cities')
                ->nullOnDelete();

            $table->index(['city_id', 'type', 'created_at'], 'tenant_incidents_city_type_created_idx');
            $table->index(['severity', 'created_at'], 'tenant_incidents_severity_created_idx');
            $table->index(['type', 'created_at'], 'tenant_incidents_type_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_incidents');
    }
};
