<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Support\Facades\Auth;

/**
 * Optional Authentication Middleware
 * 
 * For public routes that CAN accept authentication but don't require it.
 * If a token is present but invalid/expired, it's ignored instead of returning 401.
 * This allows public routes to work even when clients send stale tokens.
 */
class OptionalAuth
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Try to authenticate with the provided token
        $bearerToken = $request->bearerToken();

        if ($bearerToken) {
            try {
                // Try to find the token
                $token = PersonalAccessToken::findToken($bearerToken);

                if ($token && !$this->isTokenExpired($token)) {
                    // Token is valid, authenticate the user
                    $user = $token->tokenable;
                    if ($user) {
                        Auth::setUser($user);
                        $token->forceFill(['last_used_at' => now()])->save();
                    }
                }
                // If token is invalid/expired, we just don't authenticate
                // No 401 error - this is optional auth
            } catch (\Exception $e) {
                // Token parsing failed - ignore and continue as guest
            }
        }

        return $next($request);
    }

    /**
     * Check if token is expired.
     */
    private function isTokenExpired(PersonalAccessToken $token): bool
    {
        $expiresAt = $token->expires_at;

        if (!$expiresAt) {
            // Check config-based expiration
            $expiration = config('sanctum.expiration');
            if ($expiration === null) {
                return false; // No expiration configured
            }

            $createdAt = $token->created_at;
            return $createdAt && $createdAt->addMinutes($expiration)->isPast();
        }

        return $expiresAt->isPast();
    }
}
