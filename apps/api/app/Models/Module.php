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
 * @property string $module_key
 * @property string $slug
 * @property string|null $route_slug_ptbr
 * @property string $name
 * @property string|null $name_ptbr
 * @property string|null $description
 * @property string|null $icon
 * @property bool $is_core
 * @property int $current_version
 * @property int $sort_order
 */
class Module extends Model
{
    use HasUuids;

    /**
     * Canonical module key aliases.
     * Keeps compatibility between legacy slugs and immutable technical keys.
     */
    public const KEY_ALIASES = [
        'forum' => 'forum',
        'events' => 'events',
        'denuncias' => 'reports',
        'reports' => 'reports',
        'telefones' => 'phones',
        'phones' => 'phones',
        'alertas' => 'alerts',
        'alerts' => 'alerts',
        'turismo' => 'tourism',
        'tourism' => 'tourism',
        'coleta-lixo' => 'trash',
        'trash' => 'trash',
        'missas' => 'masses',
        'masses' => 'masses',
        'veiculos' => 'vehicles',
        'vehicles' => 'vehicles',
        'tempo' => 'weather',
        'weather' => 'weather',
        'votacoes' => 'voting',
        'voting' => 'voting',
        'vereadores' => 'council',
        'council' => 'council',
    ];

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'module_key',
        'slug',
        'route_slug_ptbr',
        'name',
        'name_ptbr',
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

    public static function normalizeKey(string $identifier): string
    {
        $normalized = strtolower(trim($identifier));

        return self::KEY_ALIASES[$normalized] ?? $normalized;
    }

    public static function findByIdentifier(string $identifier): ?self
    {
        $normalizedKey = self::normalizeKey($identifier);
        $rawIdentifier = strtolower(trim($identifier));

        return self::query()
            ->where('module_key', $normalizedKey)
            ->orWhere('slug', $rawIdentifier)
            ->orWhere('slug', $normalizedKey)
            ->first();
    }

    public static function findBySlug(string $slug): ?self
    {
        return self::findByIdentifier($slug);
    }
}
