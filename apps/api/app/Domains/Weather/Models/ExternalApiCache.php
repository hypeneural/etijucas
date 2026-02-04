<?php

declare(strict_types=1);

namespace App\Domains\Weather\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ExternalApiCache extends Model
{
    use HasUuids;

    protected $table = 'external_api_cache';

    protected $fillable = [
        'key',
        'provider',
        'lat',
        'lon',
        'timezone',
        'payload',
        'payload_hash',
        'fetched_at',
        'expires_at',
        'last_error',
    ];

    protected $casts = [
        'payload' => 'array',
        'lat' => 'decimal:7',
        'lon' => 'decimal:7',
        'fetched_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Check if cache is still valid
     */
    public function isValid(): bool
    {
        return $this->expires_at && $this->expires_at->isFuture();
    }

    /**
     * Check if cache is stale (expired)
     */
    public function isStale(): bool
    {
        return !$this->isValid();
    }

    /**
     * Get cache by key
     */
    public static function getByKey(string $key): ?self
    {
        return static::where('key', $key)->first();
    }

    /**
     * Get valid (non-expired) cache by key
     */
    public static function getValidByKey(string $key): ?self
    {
        $cache = static::getByKey($key);
        return $cache?->isValid() ? $cache : null;
    }
}
