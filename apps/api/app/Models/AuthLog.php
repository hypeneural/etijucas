<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * AuthLog
 *
 * Records all authentication events for security auditing.
 *
 * @property string $id
 * @property string|null $user_id
 * @property string|null $phone
 * @property string $event
 * @property bool $success
 * @property string|null $failure_reason
 * @property string $ip_address
 * @property string|null $user_agent
 * @property string|null $device_hash
 * @property string|null $city
 * @property string|null $country
 * @property array|null $metadata
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property-read User|null $user
 */
class AuthLog extends Model
{
    use HasUuids;

    // Event types
    public const EVENT_OTP_REQUEST = 'otp_request';
    public const EVENT_OTP_VERIFY = 'otp_verify';
    public const EVENT_LOGIN = 'login';
    public const EVENT_LOGOUT = 'logout';
    public const EVENT_MAGIC_LINK = 'magic_link';
    public const EVENT_FAILED_LOGIN = 'failed_login';
    public const EVENT_NEW_DEVICE = 'new_device';

    protected $fillable = [
        'user_id',
        'phone',
        'event',
        'success',
        'failure_reason',
        'ip_address',
        'user_agent',
        'device_hash',
        'city',
        'country',
        'metadata',
    ];

    protected $casts = [
        'success' => 'boolean',
        'metadata' => 'array',
    ];

    /**
     * Log a successful authentication event
     */
    public static function logSuccess(
        string $event,
        ?User $user,
        string $ip,
        ?string $userAgent = null,
        ?array $metadata = null
    ): self {
        return self::create([
            'user_id' => $user?->id,
            'phone' => $user?->phone,
            'event' => $event,
            'success' => true,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'device_hash' => $userAgent ? UserDevice::generateHash($userAgent, $ip) : null,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Log a failed authentication event
     */
    public static function logFailure(
        string $event,
        string $reason,
        ?string $phone,
        string $ip,
        ?string $userAgent = null,
        ?array $metadata = null
    ): self {
        return self::create([
            'phone' => $phone,
            'event' => $event,
            'success' => false,
            'failure_reason' => $reason,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'device_hash' => $userAgent ? UserDevice::generateHash($userAgent, $ip) : null,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Count recent failed attempts for rate limiting
     */
    public static function countRecentFailures(string $phone, int $minutes = 5): int
    {
        return self::where('phone', $phone)
            ->where('success', false)
            ->where('created_at', '>=', now()->subMinutes($minutes))
            ->count();
    }

    /**
     * Count recent OTP requests for rate limiting
     */
    public static function countRecentOtpRequests(string $phone, int $minutes = 1): int
    {
        return self::where('phone', $phone)
            ->where('event', self::EVENT_OTP_REQUEST)
            ->where('created_at', '>=', now()->subMinutes($minutes))
            ->count();
    }

    /**
     * Count recent OTP requests by IP for rate limiting
     */
    public static function countRecentOtpRequestsByIp(string $ip, int $minutes = 1): int
    {
        return self::where('ip_address', $ip)
            ->where('event', self::EVENT_OTP_REQUEST)
            ->where('created_at', '>=', now()->subMinutes($minutes))
            ->count();
    }

    // ==========================================
    // Relationships
    // ==========================================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
