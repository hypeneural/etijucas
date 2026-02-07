<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('user_restrictions') || Schema::hasColumn('user_restrictions', 'scope_module_key')) {
            return;
        }

        Schema::table('user_restrictions', function (Blueprint $table): void {
            $table->string('scope_module_key', 50)->nullable()->after('scope_city_id');
            $table->index(['scope_module_key', 'type'], 'user_restrictions_module_type_idx');
        });

        DB::table('user_restrictions')
            ->where('scope', 'forum')
            ->whereNull('scope_module_key')
            ->update(['scope_module_key' => 'forum']);

        DB::table('user_restrictions')
            ->where('scope', 'reports')
            ->whereNull('scope_module_key')
            ->update(['scope_module_key' => 'reports']);

        DB::table('user_restrictions')
            ->where('scope', 'uploads')
            ->whereNull('scope_module_key')
            ->update(['scope_module_key' => 'forum']);
    }

    public function down(): void
    {
        if (!Schema::hasTable('user_restrictions') || !Schema::hasColumn('user_restrictions', 'scope_module_key')) {
            return;
        }

        Schema::table('user_restrictions', function (Blueprint $table): void {
            $table->dropIndex('user_restrictions_module_type_idx');
            $table->dropColumn('scope_module_key');
        });
    }
};
