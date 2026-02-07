<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Adds composite indexes for tenant-scoped queries.
     * These indexes optimize WHERE city_id = ? AND ... queries.
     */
    public function up(): void
    {
        // Topics: city_id + category + created_at for filtered listings
        Schema::table('topics', function (Blueprint $table) {
            $table->index(['city_id', 'category', 'created_at'], 'topics_tenant_category_idx');
            $table->index(['city_id', 'bairro_id', 'created_at'], 'topics_tenant_bairro_idx');
        });

        // Comments: city_id + created_at for recent comments
        Schema::table('comments', function (Blueprint $table) {
            $table->index(['city_id', 'created_at'], 'comments_tenant_created_idx');
        });

        // Bairros: city_id + active for active neighborhoods
        Schema::table('bairros', function (Blueprint $table) {
            $table->index(['city_id', 'active'], 'bairros_tenant_active_idx');
        });

        // City Modules: city_id + enabled for module discovery
        if (Schema::hasTable('city_modules')) {
            Schema::table('city_modules', function (Blueprint $table) {
                $table->index(['city_id', 'enabled'], 'city_modules_tenant_enabled_idx');
            });
        }

        // City Domains: for host lookup
        if (Schema::hasTable('city_domains')) {
            Schema::table('city_domains', function (Blueprint $table) {
                $table->index(['domain', 'is_primary'], 'city_domains_lookup_idx');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('topics', function (Blueprint $table) {
            $table->dropIndex('topics_tenant_category_idx');
            $table->dropIndex('topics_tenant_bairro_idx');
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->dropIndex('comments_tenant_created_idx');
        });

        Schema::table('bairros', function (Blueprint $table) {
            $table->dropIndex('bairros_tenant_active_idx');
        });

        if (Schema::hasTable('city_modules')) {
            Schema::table('city_modules', function (Blueprint $table) {
                $table->dropIndex('city_modules_tenant_enabled_idx');
            });
        }

        if (Schema::hasTable('city_domains')) {
            Schema::table('city_domains', function (Blueprint $table) {
                $table->dropIndex('city_domains_lookup_idx');
            });
        }
    }
};

