<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasColumn('cities', 'is_coastal')) {
            return;
        }

        Schema::table('cities', function (Blueprint $table): void {
            $table->boolean('is_coastal')->default(false)->after('timezone');
            $table->index('is_coastal');
        });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('cities', 'is_coastal')) {
            return;
        }

        Schema::table('cities', function (Blueprint $table): void {
            $table->dropIndex(['is_coastal']);
            $table->dropColumn('is_coastal');
        });
    }
};
