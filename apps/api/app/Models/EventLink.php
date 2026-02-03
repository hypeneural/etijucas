<?php

namespace App\Models;

use App\Domain\Events\Enums\LinkType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventLink extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'event_id',
        'link_type',
        'url',
        'label',
    ];

    protected function casts(): array
    {
        return [
            'link_type' => LinkType::class,
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
    // Accessors
    // =====================================================

    public function getIconAttribute(): string
    {
        return $this->link_type->icon();
    }

    public function getDisplayLabelAttribute(): string
    {
        return $this->label ?? $this->link_type->label();
    }
}
