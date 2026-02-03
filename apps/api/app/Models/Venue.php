<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Venue extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'slug',
        'bairro_id',
        'address',
        'address_number',
        'address_complement',
        'cep',
        'latitude',
        'longitude',
        'capacity',
        'phone',
        'website',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'capacity' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    // =====================================================
    // Relationships
    // =====================================================

    public function bairro(): BelongsTo
    {
        return $this->belongsTo(Bairro::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }

    // =====================================================
    // Scopes
    // =====================================================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByBairro($query, string $bairroId)
    {
        return $query->where('bairro_id', $bairroId);
    }

    // =====================================================
    // Accessors
    // =====================================================

    public function getFullAddressAttribute(): ?string
    {
        if (!$this->address) {
            return null;
        }

        $parts = [$this->address];

        if ($this->address_number) {
            $parts[] = $this->address_number;
        }

        if ($this->address_complement) {
            $parts[] = $this->address_complement;
        }

        return implode(', ', $parts);
    }

    public function getGeoAttribute(): ?array
    {
        if (!$this->latitude || !$this->longitude) {
            return null;
        }

        return [
            'lat' => (float) $this->latitude,
            'lng' => (float) $this->longitude,
        ];
    }
}
