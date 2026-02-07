<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Mass Schedule Model
 * 
 * Represents church mass times per city.
 * 
 * @property string $id
 * @property string $city_id
 * @property string|null $bairro_id
 * @property string $church_name
 * @property string|null $address
 * @property string|null $phone
 * @property string $day_type
 * @property array $times
 * @property string|null $notes
 * @property bool $active
 * @property int $order
 * @property float|null $lat
 * @property float|null $lon
 */
class MassSchedule extends Model
{
    use HasFactory, HasUuids, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'city_id',
        'bairro_id',
        'church_name',
        'address',
        'phone',
        'day_type',
        'times',
        'notes',
        'active',
        'order',
        'lat',
        'lon',
    ];

    protected $casts = [
        'times' => 'array',
        'active' => 'boolean',
        'order' => 'integer',
        'lat' => 'decimal:7',
        'lon' => 'decimal:7',
    ];

    // =====================================================
    // Relationships
    // =====================================================

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    public function bairro(): BelongsTo
    {
        return $this->belongsTo(Bairro::class);
    }

    // =====================================================
    // Scopes
    // =====================================================

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('order')->orderBy('church_name');
    }

    public function scopeByDayType($query, string $dayType)
    {
        return $query->where('day_type', $dayType);
    }

    public function scopeForToday($query)
    {
        $today = now();

        if ($today->isSunday()) {
            return $query->where('day_type', 'sunday');
        }

        if ($today->isSaturday()) {
            return $query->where('day_type', 'saturday');
        }

        return $query->where('day_type', 'weekday');
    }

    // =====================================================
    // Helpers
    // =====================================================

    /**
     * Get formatted times string (e.g., "07:00, 09:00, 19:00")
     */
    public function getTimesStringAttribute(): string
    {
        return collect($this->times)->implode(', ');
    }

    /**
     * Get day type label in Portuguese
     */
    public function getDayTypeLabelAttribute(): string
    {
        return match ($this->day_type) {
            'weekday' => 'Dias de Semana',
            'saturday' => 'Sábado',
            'sunday' => 'Domingo',
            'holiday' => 'Feriados',
            default => $this->day_type,
        };
    }
}
