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
        Schema::create('user_devices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('device_hash', 64)->comment('SHA256 of fingerprint');
            $table->string('device_name')->nullable()->comment('e.g. iPhone 14 Pro');
            $table->string('browser')->nullable()->comment('e.g. Chrome 120');
            $table->string('os')->nullable()->comment('e.g. iOS 17.2');
            $table->string('ip_address', 45)->nullable();
            $table->string('city')->nullable()->comment('GeoIP city');
            $table->boolean('is_trusted')->default(false);
            $table->timestamp('trusted_at')->nullable();
            $table->timestamp('last_auth_at')->nullable();
            $table->integer('auth_count')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'device_hash']);
            $table->index('device_hash');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_devices');
    }
};
