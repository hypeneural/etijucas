<?php

namespace App\Models;

use App\Domain\Events\Enums\RsvpStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventRsvp extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'event_rsvps';

    protected $fillable = [
        'event_id',
        'user_id',
        'status',
        'guests_count',
        'notes',
        'notified',
    ];

    protected function casts(): array
    {
        return [
            'status' => RsvpStatus::class,
            'guests_count' => 'integer',
            'notified' => 'boolean',
        ];
    }

    // =====================================================
    // Relationships
    // =====================================================

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // =====================================================
    // Scopes
    // =====================================================

    public function scopeGoing($query)
    {
        return $query->where('status', RsvpStatus::Going);
    }

    public function scopeMaybe($query)
    {
        return $query->where('status', RsvpStatus::Maybe);
    }

    public function scopeNotGoing($query)
    {
        return $query->where('status', RsvpStatus::NotGoing);
    }

    public function scopeConfirmed($query)
    {
        return $query->whereIn('status', [RsvpStatus::Going, RsvpStatus::Maybe]);
    }

    public function scopeNotNotified($query)
    {
        return $query->where('notified', false);
    }

    // =====================================================
    // Helpers
    // =====================================================

    public function isGoing(): bool
    {
        return $this->status === RsvpStatus::Going;
    }

    public function isMaybe(): bool
    {
        return $this->status === RsvpStatus::Maybe;
    }

    public function markAsNotified(): void
    {
        $this->update(['notified' => true]);
    }
}
