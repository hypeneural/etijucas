<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * City Model
 * 
 * Represents a city in the multi-tenant system.
 * Uses IBGE codes for standardization.
 * 
 * @property string $id
 * @property int $ibge_code
 * @property string $name
 * @property string $uf
 * @property string $slug
 * @property float|null $lat
 * @property float|null $lon
 * @property string|null $ddd
 * @property string $timezone
 * @property bool $active
 */
class City extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'ibge_code',
        'name',
        'uf',
        'slug',
        'lat',
        'lon',
        'ddd',
        'timezone',
        'active',
    ];

    protected $casts = [
        'ibge_code' => 'integer',
        'lat' => 'decimal:8',
        'lon' => 'decimal:8',
        'active' => 'boolean',
    ];

    // ──────────────────────────────────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Get all bairros for this city.
     */
    public function bairros(): HasMany
    {
        return $this->hasMany(Bairro::class);
    }

    /**
     * Get all bairro aliases for this city.
     */
    public function bairroAliases(): HasMany
    {
        return $this->hasMany(BairroAlias::class);
    }

    /**
     * Get all address mismatches for this city.
     */
    public function addressMismatches(): HasMany
    {
        return $this->hasMany(AddressMismatchAgg::class);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Scope to only active cities.
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /**
     * Scope to filter by UF.
     */
    public function scopeWhereUf($query, string $uf)
    {
        return $query->where('uf', strtoupper($uf));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Accessors
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Get full name with UF (e.g., "Tijucas/SC").
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->name}/{$this->uf}";
    }
}
