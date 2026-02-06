<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * AddressMismatchAgg Model
 * 
 * Aggregated table for tracking unmatched bairro names.
 * Used for governance and creating new aliases.
 * 
 * @property string $id
 * @property string $city_id
 * @property string $bairro_text_key (normalized slug)
 * @property string $bairro_text_example (original text)
 * @property int $count
 * @property \Carbon\Carbon $last_seen_at
 * @property string $provider (viacep|manual|gps)
 */
class AddressMismatchAgg extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'address_mismatch_agg';

    protected $fillable = [
        'city_id',
        'bairro_text_key',
        'bairro_text_example',
        'count',
        'last_seen_at',
        'provider',
    ];

    protected $casts = [
        'count' => 'integer',
        'last_seen_at' => 'datetime',
    ];

    // ──────────────────────────────────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Get the city this mismatch belongs to.
     */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Scope to filter by city.
     */
    public function scopeForCity($query, string $cityId)
    {
        return $query->where('city_id', $cityId);
    }

    /**
     * Scope to get top unmatched (ordered by count desc).
     */
    public function scopeTopUnmatched($query, int $limit = 10)
    {
        return $query->orderByDesc('count')->limit($limit);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Methods
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Increment count and update last_seen_at.
     */
    public function incrementMismatch(): void
    {
        $this->increment('count');
        $this->update(['last_seen_at' => now()]);
    }

    /**
     * Record or increment a mismatch.
     */
    public static function recordMismatch(
        string $cityId,
        string $bairroTextKey,
        string $bairroTextExample,
        string $provider = 'viacep'
    ): self {
        return static::updateOrCreate(
            [
                'city_id' => $cityId,
                'bairro_text_key' => $bairroTextKey,
                'provider' => $provider,
            ],
            [
                'bairro_text_example' => $bairroTextExample,
                'last_seen_at' => now(),
            ]
        )->tap(fn($model) => $model->wasRecentlyCreated || $model->increment('count'));
    }
}
