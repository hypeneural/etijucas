<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UserCityProfile Model
 *
 * Represents a user's profile within a specific city (local profile).
 * Allows users to have different bairro preferences per city.
 *
 * @property string $id
 * @property string $user_id
 * @property string $city_id
 * @property string|null $bairro_id
 * @property bool $profile_completed
 * @property array|null $notification_prefs
 */
class UserCityProfile extends Model
{
    use HasUuids, BelongsToTenant;

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
        'user_id',
        'city_id',
        'bairro_id',
        'profile_completed',
        'notification_prefs',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'profile_completed' => 'boolean',
            'notification_prefs' => 'array',
        ];
    }

    // =====================================================
    // Relationships
    // =====================================================

    /**
     * Get the user that owns this profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the bairro for this profile.
     */
    public function bairro(): BelongsTo
    {
        return $this->belongsTo(Bairro::class);
    }

    // =====================================================
    // Scopes
    // =====================================================

    /**
     * Scope to filter by user.
     */
    public function scopeForUser($query, string $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to filter by city (without tenant global scope).
     */
    public function scopeForCityId($query, string $cityId)
    {
        return $query->withoutGlobalScope('tenant')->where('city_id', $cityId);
    }

    /**
     * Scope to only completed profiles.
     */
    public function scopeCompleted($query)
    {
        return $query->where('profile_completed', true);
    }
}
