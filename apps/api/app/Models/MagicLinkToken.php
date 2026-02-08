<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * MagicLinkToken
 *
 * Represents a single-use magic link token for instant login.
 * Tokens are sent via WhatsApp as a button action and expire after 5 minutes.
 *
 * @property string $id
 * @property string $user_id
 * @property string $token
 * @property \Carbon\Carbon $expires_at
 * @property \Carbon\Carbon|null $used_at
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property-read User $user
 */
class MagicLinkToken extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'token',
        'expires_at',
        'used_at',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
    ];

    /**
     * Create a new magic link token for a user.
     */
    public static function createForUser(User $user, int $expiresInMinutes = 5): self
    {
        return self::create([
            'user_id' => $user->id,
            'token' => Str::random(64),
            'expires_at' => now()->addMinutes($expiresInMinutes),
        ]);
    }

    /**
     * Find a valid (not expired, not used) token.
     */
    public static function findValidToken(string $token): ?self
    {
        return self::where('token', $token)
            ->where('expires_at', '>', now())
            ->whereNull('used_at')
            ->first();
    }

    /**
     * Mark the token as used.
     */
    public function markAsUsed(?string $ipAddress = null, ?string $userAgent = null): void
    {
        $this->update([
            'used_at' => now(),
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
        ]);
    }

    /**
     * Check if the token is expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if the token has been used.
     */
    public function isUsed(): bool
    {
        return !is_null($this->used_at);
    }

    /**
     * Check if the token is valid (not expired and not used).
     */
    public function isValid(): bool
    {
        return !$this->isExpired() && !$this->isUsed();
    }

    /**
     * Get the magic link URL.
     */
    public function getMagicLinkUrl(): string
    {
        return config('app.frontend_url') . '/auth/magic?token=' . $this->token;
    }

    // ==========================================
    // Relationships
    // ==========================================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
