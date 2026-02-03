<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventSchedule extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'event_id',
        'event_day_id',
        'time',
        'date',
        'title',
        'description',
        'stage',
        'performer',
        'display_order',
    ];

    protected function casts(): array
    {
        return [
            'time' => 'datetime:H:i',
            'date' => 'date',
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

    public function eventDay(): BelongsTo
    {
        return $this->belongsTo(EventDay::class);
    }

    // =====================================================
    // Accessors
    // =====================================================

    public function getFormattedTimeAttribute(): string
    {
        return $this->time->format('H:i');
    }

    public function getFormattedDateAttribute(): ?string
    {
        return $this->date?->format('d/m/Y');
    }
}
