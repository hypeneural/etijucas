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
        // Event Categories Table
        // =====================================================
        Schema::create('event_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 50)->unique();
            $table->string('slug', 60)->unique();
            $table->string('description', 200)->nullable();
            $table->string('icon', 50)->nullable();
            $table->string('color', 7)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'display_order']);
        });

        // =====================================================
        // Venues Table (Locais)
        // =====================================================
        Schema::create('venues', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 150);
            $table->string('slug', 170)->unique();
            $table->foreignUuid('bairro_id')->nullable()->constrained('bairros')->nullOnDelete();
            $table->string('address', 300)->nullable();
            $table->string('address_number', 20)->nullable();
            $table->string('address_complement', 100)->nullable();
            $table->string('cep', 10)->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->unsignedInteger('capacity')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('website', 300)->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'bairro_id']);
        });

        // =====================================================
        // Organizers Table (Organizadores)
        // =====================================================
        Schema::create('organizers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 150);
            $table->string('slug', 170)->unique();
            $table->string('email', 255)->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('whatsapp', 20)->nullable();
            $table->string('instagram', 100)->nullable();
            $table->string('website', 300)->nullable();
            $table->string('avatar_url', 500)->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->foreignUuid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index('is_verified');
        });

        // =====================================================
        // Events Table (Eventos)
        // =====================================================
        Schema::create('events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title', 200);
            $table->string('slug', 220)->unique();
            $table->foreignUuid('category_id')->constrained('event_categories')->cascadeOnDelete();
            $table->string('description_short', 300);
            $table->text('description_full')->nullable();
            $table->dateTime('start_datetime');
            $table->dateTime('end_datetime');
            $table->foreignUuid('venue_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('organizer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('cover_image_url', 500)->nullable();
            $table->string('age_rating', 20)->default('livre');
            $table->boolean('is_outdoor')->default(false);
            $table->boolean('has_accessibility')->default(false);
            $table->boolean('has_parking')->default(false);
            $table->unsignedInteger('popularity_score')->default(0);
            $table->string('status', 20)->default('draft');
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_recurring')->default(false);
            $table->json('recurrence_rule')->nullable();
            $table->dateTime('published_at')->nullable();
            $table->softDeletes();
            $table->timestamps();

            // Performance indexes
            $table->index(['start_datetime', 'end_datetime']);
            $table->index(['category_id', 'start_datetime']);
            $table->index(['venue_id', 'start_datetime']);
            $table->index(['status', 'start_datetime']);
            $table->index(['is_featured', 'start_datetime']);
            $table->index('popularity_score');
        });

        // =====================================================
        // Event Tickets Table (Ingressos)
        // =====================================================
        Schema::create('event_tickets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('event_id')->constrained()->cascadeOnDelete();
            $table->string('ticket_type', 20);
            $table->decimal('min_price', 10, 2)->default(0);
            $table->decimal('max_price', 10, 2)->nullable();
            $table->string('currency', 3)->default('BRL');
            $table->string('purchase_url', 500)->nullable();
            $table->text('purchase_info')->nullable();
            $table->timestamps();
        });

        // =====================================================
        // Ticket Lots Table (Lotes de Ingresso)
        // =====================================================
        Schema::create('ticket_lots', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('event_ticket_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->decimal('price', 10, 2);
            $table->unsignedInteger('quantity_total')->nullable();
            $table->unsignedInteger('quantity_sold')->default(0);
            $table->dateTime('available_from')->nullable();
            $table->dateTime('available_until')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();
        });

        // =====================================================
        // Event Schedules Table (Programação)
        // =====================================================
        Schema::create('event_schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('event_id')->constrained()->cascadeOnDelete();
            $table->time('time');
            $table->date('date')->nullable();
            $table->string('title', 150);
            $table->text('description')->nullable();
            $table->string('stage', 100)->nullable();
            $table->string('performer', 150)->nullable();
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();

            $table->index(['event_id', 'date', 'time']);
        });

        // =====================================================
        // Tags Table
        // =====================================================
        Schema::create('tags', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 50)->unique();
            $table->string('slug', 60)->unique();
            $table->string('color', 7)->nullable();
            $table->boolean('is_featured')->default(false);
            $table->unsignedInteger('usage_count')->default(0);
            $table->timestamps();

            $table->index(['is_featured', 'usage_count']);
        });

        // =====================================================
        // Event Tags Pivot Table
        // =====================================================
        Schema::create('event_tags', function (Blueprint $table) {
            $table->foreignUuid('event_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('tag_id')->constrained()->cascadeOnDelete();

            $table->primary(['event_id', 'tag_id']);
            $table->index('tag_id');
        });

        // =====================================================
        // Event Media Table (Galeria)
        // =====================================================
        Schema::create('event_media', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('event_id')->constrained()->cascadeOnDelete();
            $table->string('media_type', 20);
            $table->string('url', 500);
            $table->string('thumbnail_url', 500)->nullable();
            $table->string('caption', 200)->nullable();
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();

            $table->index(['event_id', 'display_order']);
        });

        // =====================================================
        // Event Links Table (Redes Sociais)
        // =====================================================
        Schema::create('event_links', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('event_id')->constrained()->cascadeOnDelete();
            $table->string('link_type', 30);
            $table->string('url', 500);
            $table->string('label', 100)->nullable();
            $table->timestamps();

            $table->index(['event_id', 'link_type']);
        });

        // =====================================================
        // Event RSVPs Table (Confirmação de Presença)
        // =====================================================
        Schema::create('event_rsvps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('event_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('status', 20)->default('going');
            $table->unsignedTinyInteger('guests_count')->default(1);
            $table->text('notes')->nullable();
            $table->boolean('notified')->default(false);
            $table->timestamps();

            $table->unique(['event_id', 'user_id']);
            $table->index(['event_id', 'status']);
            $table->index(['user_id', 'status']);
        });

        // =====================================================
        // Event Favorites Pivot Table
        // =====================================================
        Schema::create('event_favorites', function (Blueprint $table) {
            $table->foreignUuid('event_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->primary(['event_id', 'user_id']);
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_favorites');
        Schema::dropIfExists('event_rsvps');
        Schema::dropIfExists('event_links');
        Schema::dropIfExists('event_media');
        Schema::dropIfExists('event_tags');
        Schema::dropIfExists('tags');
        Schema::dropIfExists('event_schedules');
        Schema::dropIfExists('ticket_lots');
        Schema::dropIfExists('event_tickets');
        Schema::dropIfExists('events');
        Schema::dropIfExists('organizers');
        Schema::dropIfExists('venues');
        Schema::dropIfExists('event_categories');
    }
};
