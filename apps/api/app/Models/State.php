<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * State Model - Estados Brasileiros (27 + DF)
 * 
 * @property string $id
 * @property int $ibge_code
 * @property string $uf
 * @property string $name
 * @property float|null $lat
 * @property float|null $lon
 * @property string $region
 */
class State extends Model
{
    use HasUuids;

    protected $fillable = [
        'ibge_code',
        'uf',
        'name',
        'lat',
        'lon',
        'region',
    ];

    protected $casts = [
        'ibge_code' => 'integer',
        'lat' => 'decimal:8',
        'lon' => 'decimal:8',
    ];

    // -----------------------------------------
    // Relationships
    // -----------------------------------------

    public function cities(): HasMany
    {
        return $this->hasMany(City::class);
    }

    // -----------------------------------------
    // Scopes
    // -----------------------------------------

    public function scopeByRegion($query, string $region)
    {
        return $query->where('region', $region);
    }

    public function scopeByUf($query, string $uf)
    {
        return $query->where('uf', strtoupper($uf));
    }

    // -----------------------------------------
    // Accessors
    // -----------------------------------------

    public function getActiveCitiesCountAttribute(): int
    {
        return $this->cities()->where('active', true)->count();
    }
}
