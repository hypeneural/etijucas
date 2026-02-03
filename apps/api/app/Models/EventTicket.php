<?php

namespace App\Models;

use App\Domain\Events\Enums\TicketType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EventTicket extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'event_id',
        'ticket_type',
        'min_price',
        'max_price',
        'currency',
        'purchase_url',
        'purchase_info',
    ];

    protected function casts(): array
    {
        return [
            'ticket_type' => TicketType::class,
            'min_price' => 'decimal:2',
            'max_price' => 'decimal:2',
        ];
    }

    // =====================================================
    // Relationships
    // =====================================================

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function lots(): HasMany
    {
        return $this->hasMany(TicketLot::class)->orderBy('display_order');
    }

    public function activeLots(): HasMany
    {
        return $this->hasMany(TicketLot::class)
            ->where('is_active', true)
            ->orderBy('display_order');
    }

    // =====================================================
    // Helpers
    // =====================================================

    public function isFree(): bool
    {
        return $this->ticket_type === TicketType::Free;
    }

    public function isPaid(): bool
    {
        return $this->ticket_type === TicketType::Paid;
    }

    public function getPriceRangeAttribute(): ?string
    {
        if ($this->isFree()) {
            return 'Gratuito';
        }

        if (!$this->max_price || $this->min_price === $this->max_price) {
            return 'R$ ' . number_format($this->min_price, 2, ',', '.');
        }

        return 'R$ ' . number_format($this->min_price, 2, ',', '.') .
            ' - R$ ' . number_format($this->max_price, 2, ',', '.');
    }
}
