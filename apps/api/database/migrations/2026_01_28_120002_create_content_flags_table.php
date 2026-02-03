<?php

use App\Domain\Moderation\Enums\FlagAction;
use App\Domain\Moderation\Enums\FlagContentType;
use App\Domain\Moderation\Enums\FlagReason;
use App\Domain\Moderation\Enums\FlagStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('content_flags', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('content_type', FlagContentType::values())->index();
            $table->uuid('content_id');
            $table->foreignUuid('reported_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('reason', FlagReason::values());
            $table->text('message')->nullable();
            $table->enum('status', FlagStatus::values())->default(FlagStatus::Open->value)->index();
            $table->foreignUuid('handled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('handled_at')->nullable();
            $table->enum('action', FlagAction::values())->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at'], 'content_flags_status_created_idx');
            $table->index(['content_type', 'content_id'], 'content_flags_content_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_flags');
    }
};
