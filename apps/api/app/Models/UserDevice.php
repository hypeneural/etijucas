<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UserDevice
 *
 * Tracks trusted devices for security alerts and remember-me functionality.
 *
 * @property string $id
 * @property string $user_id
 * @property string $device_hash
 * @property string|null $device_name
 * @property string|null $browser
 * @property string|null $os
 * @property string|null $ip_address
 * @property string|null $city
 * @property bool $is_trusted
 * @property \Carbon\Carbon|null $trusted_at
 * @property \Carbon\Carbon|null $last_auth_at
 * @property int $auth_count
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property-read User $user
 */
class UserDevice extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'device_hash',
        'device_name',
        'browser',
        'os',
        'ip_address',
        'city',
        'is_trusted',
        'trusted_at',
        'last_auth_at',
        'auth_count',
    ];

    protected $casts = [
        'is_trusted' => 'boolean',
        'trusted_at' => 'datetime',
        'last_auth_at' => 'datetime',
        'auth_count' => 'integer',
    ];

    /**
     * Generate device hash from fingerprint data
     */
    public static function generateHash(string $userAgent, string $ip): string
    {
        return hash('sha256', $userAgent . '|' . $ip);
    }

    /**
     * Find or create a device for a user
     */
    public static function findOrCreateForUser(User $user, string $userAgent, string $ip): self
    {
        $hash = self::generateHash($userAgent, $ip);

        return self::firstOrCreate(
            ['user_id' => $user->id, 'device_hash' => $hash],
            [
                'browser' => self::parseBrowser($userAgent),
                'os' => self::parseOs($userAgent),
                'ip_address' => $ip,
            ]
        );
    }

    /**
     * Record an authentication event on this device
     */
    public function recordAuth(): void
    {
        $this->update([
            'last_auth_at' => now(),
            'auth_count' => $this->auth_count + 1,
        ]);
    }

    /**
     * Mark the device as trusted
     */
    public function markAsTrusted(): void
    {
        $this->update([
            'is_trusted' => true,
            'trusted_at' => now(),
        ]);
    }

    /**
     * Check if this is a new device for the user
     */
    public function isNew(): bool
    {
        return $this->auth_count <= 1;
    }

    /**
     * Parse browser from User-Agent
     */
    private static function parseBrowser(string $userAgent): string
    {
        if (str_contains($userAgent, 'Chrome'))
            return 'Chrome';
        if (str_contains($userAgent, 'Firefox'))
            return 'Firefox';
        if (str_contains($userAgent, 'Safari'))
            return 'Safari';
        if (str_contains($userAgent, 'Edge'))
            return 'Edge';
        return 'Unknown';
    }

    /**
     * Parse OS from User-Agent
     */
    private static function parseOs(string $userAgent): string
    {
        if (str_contains($userAgent, 'iPhone') || str_contains($userAgent, 'iPad'))
            return 'iOS';
        if (str_contains($userAgent, 'Android'))
            return 'Android';
        if (str_contains($userAgent, 'Windows'))
            return 'Windows';
        if (str_contains($userAgent, 'Mac'))
            return 'macOS';
        if (str_contains($userAgent, 'Linux'))
            return 'Linux';
        return 'Unknown';
    }

    // ==========================================
    // Relationships
    // ==========================================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
