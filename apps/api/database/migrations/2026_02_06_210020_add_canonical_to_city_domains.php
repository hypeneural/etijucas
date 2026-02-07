<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Add canonical and redirect fields to city_domains.
     * 
     * - is_canonical: if true, this domain is the SEO canonical URL
     * - redirect_to: if set, redirect to this domain with 301
     */
    public function up(): void
    {
        Schema::table('city_domains', function (Blueprint $table) {
            $table->boolean('is_canonical')->default(false)->after('is_primary');
            $table->string('redirect_to', 255)->nullable()->after('is_canonical');
        });

        // Set is_canonical = true for primary domains
        DB::table('city_domains')
            ->where('is_primary', true)
            ->update(['is_canonical' => true]);
    }

    public function down(): void
    {
        Schema::table('city_domains', function (Blueprint $table) {
            $table->dropColumn(['is_canonical', 'redirect_to']);
        });
    }
};
