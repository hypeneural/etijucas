<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Fix IBGE code for Tijucas/SC.
 * 
 * The correct IBGE code for Tijucas is 4218004, not 4218007.
 * This was causing CEP lookups to fail city matching since ViaCEP
 * returns the correct code 4218004.
 */
return new class extends Migration {
    public function up(): void
    {
        DB::table('cities')
            ->where('slug', 'tijucas-sc')
            ->update(['ibge_code' => 4218004]);
    }

    public function down(): void
    {
        DB::table('cities')
            ->where('slug', 'tijucas-sc')
            ->update(['ibge_code' => 4218007]);
    }
};
