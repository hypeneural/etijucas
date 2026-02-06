<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Bairro Model
 * 
 * Represents a neighborhood within a city.
 * 
 * @property string $id
 * @property string|null $city_id
 * @property string $nome
 * @property string $slug
 * @property bool $active
 * @property int $sort_order
 */
class Bairro extends Model
{
    use HasUuids;

    /**
     * The primary key type.
     */
    protected $keyType = 'string';

    /**
     * Indicates if the IDs are auto-incrementing.
     */
    public $incrementing = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'city_id',
        'nome',
        'slug',
        'active',
        'sort_order',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    // =====================================================
    // Relationships
    // =====================================================

    /**
     * Get the city this bairro belongs to.
     */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    /**
     * Get the users for the bairro.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the aliases for this bairro.
     */
    public function aliases(): HasMany
    {
        return $this->hasMany(BairroAlias::class);
    }

    // =====================================================
    // Scopes
    // =====================================================

    /**
     * Scope a query to only include active bairros.
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /**
     * Scope to filter by city.
     */
    public function scopeForCity($query, string $cityId)
    {
        return $query->where('city_id', $cityId);
    }

    /**
     * Scope to order by sort_order then name.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('nome');
    }
}
