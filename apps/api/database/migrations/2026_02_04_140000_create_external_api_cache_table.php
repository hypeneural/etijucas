<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('external_api_cache', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('key')->unique()->comment('Cache key, e.g. weather:tijucas:v1');
            $table->string('provider', 50)->index()->comment('API provider, e.g. open_meteo');
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lon', 10, 7)->nullable();
            $table->string('timezone', 50)->nullable();
            $table->json('payload')->comment('Raw API response');
            $table->char('payload_hash', 64)->nullable()->comment('SHA256 for ETag');
            $table->timestamp('fetched_at')->nullable()->comment('When data was fetched from external API');
            $table->timestamp('expires_at')->nullable()->index()->comment('Cache expiration time');
            $table->text('last_error')->nullable()->comment('Last error message if fetch failed');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('external_api_cache');
    }
};
