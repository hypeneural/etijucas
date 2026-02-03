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
        // =====================================================
        // Add new fields to events table
        // =====================================================
        Schema::table('events', function (Blueprint $table) {
            $table->string('banner_image_url', 500)->nullable()->after('cover_image_url');
            $table->string('banner_image_mobile_url', 500)->nullable()->after('banner_image_url');
            $table->string('event_type', 20)->default('single')->after('is_recurring');
            $table->unsignedTinyInteger('total_days')->default(1)->after('event_type');
            $table->string('edition', 50)->nullable()->after('title');
            $table->unsignedInteger('expected_audience')->nullable()->after('popularity_score');
            $table->unsignedInteger('confirmed_attendance')->default(0)->after('expected_audience');

            // Index for event type
            $table->index('event_type');
        });

        // =====================================================
        // Event Days Table (for multi-day events)
        // =====================================================
        Schema::create('event_days', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('event_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('day_number');
            $table->date('date');
            $table->string('title', 150)->nullable();
            $table->time('start_time');
            $table->time('end_time');
            $table->text('description')->nullable();
            $table->string('cover_image_url', 500)->nullable();
            $table->timestamps();

            $table->unique(['event_id', 'day_number']);
            $table->index(['event_id', 'date']);
            $table->index('date');
        });

        // =====================================================
        // Add event_day_id to event_schedules
        // =====================================================
        Schema::table('event_schedules', function (Blueprint $table) {
            $table->foreignUuid('event_day_id')->nullable()->after('event_id')
                ->constrained('event_days')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_schedules', function (Blueprint $table) {
            $table->dropConstrainedForeignId('event_day_id');
        });

        Schema::dropIfExists('event_days');

        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex(['event_type']);
            $table->dropColumn([
                'banner_image_url',
                'banner_image_mobile_url',
                'event_type',
                'total_days',
                'edition',
                'expected_audience',
                'confirmed_attendance',
            ]);
        });
    }
};
