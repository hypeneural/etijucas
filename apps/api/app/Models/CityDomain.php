<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

/**
 * CityDomain Model - Resolve tenant por domínio (sem regex)
 * 
 * @property string $id
 * @property string $city_id
 * @property string $domain
 * @property bool $is_primary
 * @property bool $is_canonical
 * @property string|null $redirect_to
 */
class CityDomain extends Model
{
    use HasUuids;

    protected $fillable = [
        'city_id',
        'domain',
        'is_primary',
        'is_canonical',
        'redirect_to',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'is_canonical' => 'boolean',
    ];

    // -----------------------------------------
    // Relationships
    // -----------------------------------------

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    // -----------------------------------------
    // Static Methods
    // -----------------------------------------

    /**
     * Find city by domain with cache
     */
    public static function findCityByDomain(string $domain): ?City
    {
        $domainMap = Cache::remember('city_domains:map', 3600, function () {
            return self::with('city')
                ->get()
                ->pluck('city', 'domain')
                ->toArray();
        });

        return $domainMap[$domain] ?? null;
    }

    /**
     * Clear domain cache (call after any domain changes)
     */
    public static function clearCache(): void
    {
        Cache::forget('city_domains:map');
    }

    // -----------------------------------------
    // Boot
    // -----------------------------------------

    protected static function booted(): void
    {
        static::saved(fn() => self::clearCache());
        static::deleted(fn() => self::clearCache());
    }
}
