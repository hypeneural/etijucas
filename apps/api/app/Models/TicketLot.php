<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketLot extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'event_ticket_id',
        'name',
        'price',
        'quantity_total',
        'quantity_sold',
        'available_from',
        'available_until',
        'is_active',
        'display_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'quantity_total' => 'integer',
            'quantity_sold' => 'integer',
            'available_from' => 'datetime',
            'available_until' => 'datetime',
            'is_active' => 'boolean',
            'display_order' => 'integer',
        ];
    }

    // =====================================================
    // Relationships
    // =====================================================

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(EventTicket::class, 'event_ticket_id');
    }

    // =====================================================
    // Scopes
    // =====================================================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeAvailable($query)
    {
        return $query
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('available_from')
                    ->orWhere('available_from', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('available_until')
                    ->orWhere('available_until', '>=', now());
            })
            ->where(function ($q) {
                $q->whereNull('quantity_total')
                    ->orWhereColumn('quantity_sold', '<', 'quantity_total');
            });
    }

    // =====================================================
    // Helpers
    // =====================================================

    public function getQuantityAvailableAttribute(): ?int
    {
        if ($this->quantity_total === null) {
            return null;
        }

        return max(0, $this->quantity_total - $this->quantity_sold);
    }

    public function isSoldOut(): bool
    {
        if ($this->quantity_total === null) {
            return false;
        }

        return $this->quantity_sold >= $this->quantity_total;
    }

    public function isCurrentlyAvailable(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->available_from && $this->available_from->isFuture()) {
            return false;
        }

        if ($this->available_until && $this->available_until->isPast()) {
            return false;
        }

        return !$this->isSoldOut();
    }
}
