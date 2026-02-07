<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Module Model
 * 
 * Represents a feature module that can be enabled/disabled per city.
 * 
 * @property string $id
 * @property string $slug
 * @property string $name
 * @property string|null $description
 * @property string|null $icon
 * @property bool $is_core
 * @property int $current_version
 * @property int $sort_order
 */
class Module extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'slug',
        'name',
        'description',
        'icon',
        'is_core',
        'current_version',
        'sort_order',
    ];

    protected $casts = [
        'is_core' => 'boolean',
        'current_version' => 'integer',
        'sort_order' => 'integer',
    ];

    // =====================================================
    // Relationships
    // =====================================================

    public function cityModules(): HasMany
    {
        return $this->hasMany(CityModule::class);
    }

    public function cities(): BelongsToMany
    {
        return $this->belongsToMany(City::class, 'city_modules')
            ->withPivot(['enabled', 'version', 'settings'])
            ->withTimestamps();
    }

    // =====================================================
    // Scopes
    // =====================================================

    public function scopeCore($query)
    {
        return $query->where('is_core', true);
    }

    public function scopeOptional($query)
    {
        return $query->where('is_core', false);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    // =====================================================
    // Static Helpers
    // =====================================================

    public static function findBySlug(string $slug): ?self
    {
        return self::where('slug', $slug)->first();
    }
}
