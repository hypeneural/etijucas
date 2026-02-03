<?php

use App\Domain\Content\Enums\PhoneCategory;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('phones', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('category', PhoneCategory::values())->default(PhoneCategory::Other->value)->index();
            $table->string('name', 150);
            $table->string('number', 40);
            $table->boolean('whatsapp')->default(false);
            $table->boolean('is_emergency')->default(false)->index();
            $table->boolean('is_pinned')->default(false)->index();
            $table->string('address', 255)->nullable();
            $table->string('hours', 120)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('phones');
    }
};
