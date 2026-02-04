<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * Add 'passwordless' type to otp_codes for WhatsApp OTP login.
     * Also adds session_id column for magic link support.
     */
    public function up(): void
    {
        // Modify ENUM to include 'passwordless'
        DB::statement("ALTER TABLE otp_codes MODIFY COLUMN type ENUM('login', 'register', 'password_reset', 'passwordless') DEFAULT 'login'");

        // Add session_id column for magic link support
        Schema::table('otp_codes', function (Blueprint $table) {
            $table->string('session_id', 36)->nullable()->after('type')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove session_id column
        Schema::table('otp_codes', function (Blueprint $table) {
            $table->dropColumn('session_id');
        });

        // Revert ENUM (will lose any 'passwordless' records)
        DB::statement("ALTER TABLE otp_codes MODIFY COLUMN type ENUM('login', 'register', 'password_reset') DEFAULT 'login'");
    }
};
