<?php

namespace App\Services;

use App\Models\OtpCode;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class OtpService
{
    /**
     * OTP expiration time in minutes.
     */
    protected int $expirationMinutes = 5;

    /**
     * Maximum OTP attempts before lockout.
     */
    protected int $maxAttempts = 5;

    /**
     * Rate limit: max OTPs per time window.
     */
    protected int $rateLimitMax = 3;

    /**
     * Rate limit time window in minutes.
     */
    protected int $rateLimitWindow = 5;

    /**
     * Generate a new OTP code for a phone number.
     */
    public function generate(string $phone, string $type = 'login'): OtpCode
    {
        // Invalidate any existing OTPs for this phone
        OtpCode::forPhone($phone)
            ->ofType($type)
            ->valid()
            ->update(['verified_at' => now()]);

        // Generate 6-digit code
        $code = $this->generateCode();

        // Create new OTP
        $otp = OtpCode::create([
            'phone' => $phone,
            'code' => $code,
            'type' => $type,
            'expires_at' => now()->addMinutes($this->expirationMinutes),
        ]);

        // Track rate limit
        $this->trackRateLimit($phone);

        return $otp;
    }

    /**
     * Verify an OTP code.
     */
    public function verify(string $phone, string $code, string $type = 'login'): ?OtpCode
    {
        $otp = OtpCode::forPhone($phone)
            ->ofType($type)
            ->valid()
            ->where('code', $code)
            ->first();

        if (!$otp) {
            // Increment attempts for rate limiting
            $this->incrementFailedAttempt($phone);
            return null;
        }

        // Check max attempts
        if ($otp->hasMaxAttempts($this->maxAttempts)) {
            return null;
        }

        // Mark as verified
        $otp->markAsVerified();

        // Clear rate limit tracking
        $this->clearRateLimit($phone);

        return $otp;
    }

    /**
     * Get the latest OTP for a phone number.
     */
    public function getLatestOtp(string $phone, string $type = 'login'): ?OtpCode
    {
        return OtpCode::forPhone($phone)
            ->ofType($type)
            ->valid()
            ->latest()
            ->first();
    }

    /**
     * Check if phone is rate limited.
     */
    public function isRateLimited(string $phone): bool
    {
        $key = $this->getRateLimitKey($phone);
        $attempts = Cache::get($key, 0);

        return $attempts >= $this->rateLimitMax;
    }

    /**
     * Get seconds until rate limit expires.
     */
    public function getRetryAfter(string $phone): int
    {
        $key = $this->getRateLimitKey($phone);
        $ttl = Cache::getStore()->get($key . ':ttl');

        if (!$ttl) {
            return 0;
        }

        return max(0, $ttl - time());
    }

    /**
     * Get remaining rate limit attempts.
     */
    public function getRateLimitRemaining(string $phone): int
    {
        $key = $this->getRateLimitKey($phone);
        $attempts = Cache::get($key, 0);

        return max(0, $this->rateLimitMax - $attempts);
    }

    /**
     * Clean up expired OTP codes.
     */
    public function cleanup(): int
    {
        return OtpCode::where('expires_at', '<', now()->subHours(24))
            ->delete();
    }

    /**
     * Generate a random 6-digit code.
     */
    protected function generateCode(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Track rate limit for a phone.
     */
    protected function trackRateLimit(string $phone): void
    {
        $key = $this->getRateLimitKey($phone);
        $windowSeconds = $this->rateLimitWindow * 60;

        $attempts = Cache::get($key, 0);
        Cache::put($key, $attempts + 1, $windowSeconds);
        Cache::put($key . ':ttl', time() + $windowSeconds, $windowSeconds);
    }

    /**
     * Increment failed attempt counter.
     */
    protected function incrementFailedAttempt(string $phone): void
    {
        // Find and increment attempts on the latest OTP
        $otp = OtpCode::forPhone($phone)
            ->valid()
            ->latest()
            ->first();

        if ($otp) {
            $otp->incrementAttempts();
        }
    }

    /**
     * Clear rate limit tracking.
     */
    protected function clearRateLimit(string $phone): void
    {
        $key = $this->getRateLimitKey($phone);
        Cache::forget($key);
        Cache::forget($key . ':ttl');
    }

    /**
     * Get the cache key for rate limiting.
     */
    protected function getRateLimitKey(string $phone): string
    {
        return 'otp_rate_limit:' . $phone;
    }
}
