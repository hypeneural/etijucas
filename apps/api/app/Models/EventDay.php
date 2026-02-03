<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EventDay extends Model
{
    use HasUuids;

    protected $fillable = [
        'event_id',
        'day_number',
        'date',
        'title',
        'start_time',
        'end_time',
        'description',
        'cover_image_url',
    ];

    protected $casts = [
        'date' => 'date',
        'day_number' => 'integer',
    ];

    // =========================================================================
    // Relationships
    // =========================================================================

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(EventSchedule::class)->orderBy('time');
    }

    // =========================================================================
    // Accessors
    // =========================================================================

    public function getFormattedDateAttribute(): string
    {
        return $this->date->format('d/m/Y');
    }

    public function getFormattedStartTimeAttribute(): string
    {
        return substr($this->start_time, 0, 5);
    }

    public function getFormattedEndTimeAttribute(): string
    {
        return substr($this->end_time, 0, 5);
    }

    public function getDayLabelAttribute(): string
    {
        return $this->title ?? "Dia {$this->day_number}";
    }
}
