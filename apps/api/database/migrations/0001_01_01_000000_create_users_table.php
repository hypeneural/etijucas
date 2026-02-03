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
        Schema::create('users', function (Blueprint $table) {
            // Identificação - UUID como primary key
            $table->uuid('id')->primary();
            $table->string('phone', 11)->unique()->comment('Telefone BR sem formatação');
            $table->string('email')->nullable()->unique();
            $table->string('nome', 100);

            // Verificação
            $table->boolean('phone_verified')->default(false);
            $table->timestamp('phone_verified_at')->nullable();

            // Localização
            $table->uuid('bairro_id')->nullable()->index();
            $table->json('address')->nullable()->comment('Endereço completo JSON');

            // Avatar (via Spatie Media Library collection)
            $table->string('avatar_url')->nullable();

            // Notificações - default set in model boot method
            $table->json('notification_settings')->nullable();

            // Soft delete + Timestamps
            $table->softDeletes();
            $table->timestamps();

            // Índices compostos para performance
            $table->index(['phone', 'phone_verified']);
            $table->index('created_at');
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignUuid('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
