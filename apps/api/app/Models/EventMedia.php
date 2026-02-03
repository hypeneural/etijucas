<?php

namespace App\Models;

use App\Domain\Events\Enums\MediaType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventMedia extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'event_id',
        'media_type',
        'url',
        'thumbnail_url',
        'caption',
        'display_order',
    ];

    protected function casts(): array
    {
        return [
            'media_type' => MediaType::class,
            'display_order' => 'integer',
        ];
    }

    // =====================================================
    // Relationships
    // =====================================================

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    // =====================================================
    // Helpers
    // =====================================================

    public function isImage(): bool
    {
        return $this->media_type === MediaType::Image;
    }

    public function isVideo(): bool
    {
        return $this->media_type === MediaType::Video;
    }

    public function getThumbnailAttribute(): string
    {
        return $this->thumbnail_url ?? $this->url;
    }
}
