<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * BairroAlias Model
 * 
 * Maps alternative names (aliases) to canonical bairros.
 * Used to normalize ViaCEP responses and user inputs.
 * 
 * @property string $id
 * @property string $city_id
 * @property string $bairro_id
 * @property string $alias
 * @property string $alias_slug
 * @property string $source (manual|viacep_observed|user_observed)
 * @property bool $enabled
 * @property string|null $notes
 */
class BairroAlias extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'city_id',
        'bairro_id',
        'alias',
        'alias_slug',
        'source',
        'enabled',
        'notes',
    ];

    protected $casts = [
        'enabled' => 'boolean',
    ];

    // ──────────────────────────────────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Get the city this alias belongs to.
     */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    /**
     * Get the canonical bairro this alias maps to.
     */
    public function bairro(): BelongsTo
    {
        return $this->belongsTo(Bairro::class);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Scope to only enabled aliases.
     */
    public function scopeEnabled($query)
    {
        return $query->where('enabled', true);
    }

    /**
     * Scope to filter by city.
     */
    public function scopeForCity($query, string $cityId)
    {
        return $query->where('city_id', $cityId);
    }

    /**
     * Scope to find by normalized slug.
     */
    public function scopeWhereAliasSlug($query, string $slug)
    {
        return $query->where('alias_slug', $slug);
    }
}
