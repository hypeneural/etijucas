<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Trash Schedule Model
 * 
 * Represents garbage collection schedules per city/bairro.
 * 
 * @property string $id
 * @property string $city_id
 * @property string|null $bairro_id
 * @property string $type
 * @property string $name
 * @property string|null $icon
 * @property string|null $color
 * @property array $days_of_week
 * @property string|null $start_time
 * @property string|null $end_time
 * @property string|null $notes
 * @property bool $active
 * @property int $order
 */
class TrashSchedule extends Model
{
    use HasFactory, HasUuids, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'city_id',
        'bairro_id',
        'type',
        'name',
        'icon',
        'color',
        'days_of_week',
        'start_time',
        'end_time',
        'notes',
        'active',
        'order',
    ];

    protected $casts = [
        'days_of_week' => 'array',
        'active' => 'boolean',
        'order' => 'integer',
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
        return $query->orderBy('order')->orderBy('name');
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeForBairro($query, ?string $bairroId)
    {
        return $query->where(function ($q) use ($bairroId) {
            $q->whereNull('bairro_id')
                ->orWhere('bairro_id', $bairroId);
        });
    }

    // =====================================================
    // Helpers
    // =====================================================

    /**
     * Get human-readable days string (e.g., "Seg, Qua, Sex")
     */
    public function getDaysStringAttribute(): string
    {
        $dayNames = [
            1 => 'Seg',
            2 => 'Ter',
            3 => 'Qua',
            4 => 'Qui',
            5 => 'Sex',
            6 => 'Sáb',
            7 => 'Dom'
        ];

        return collect($this->days_of_week)
            ->map(fn($day) => $dayNames[$day] ?? '')
            ->filter()
            ->implode(', ');
    }

    /**
     * Check if collection happens today
     */
    public function isToday(): bool
    {
        $today = now()->dayOfWeekIso; // 1 (Monday) to 7 (Sunday)
        return in_array($today, $this->days_of_week ?? []);
    }
}
