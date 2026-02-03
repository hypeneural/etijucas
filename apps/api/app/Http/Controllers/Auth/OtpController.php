<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\SendOtpRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\OtpService;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;

class OtpController extends Controller
{
    public function __construct(
        private OtpService $otpService,
        private WhatsAppService $whatsAppService
    ) {
    }

    /**
     * Send OTP code to phone number.
     * 
     * POST /api/v1/auth/send-otp
     * 
     * @response 200 {
     *   "success": true,
     *   "userExists": true,
     *   "expiresIn": 300,
     *   "message": "Código enviado para seu WhatsApp"
     * }
     */
    public function send(SendOtpRequest $request): JsonResponse
    {
        $phone = $request->validated('phone');

        // Check rate limit
        if ($this->otpService->isRateLimited($phone)) {
            return response()->json([
                'success' => false,
                'message' => 'Aguarde para solicitar novo código',
                'code' => 'RATE_LIMITED',
                'retryAfter' => $this->otpService->getRetryAfter($phone),
            ], 429)->withHeaders([
                        'X-RateLimit-Limit' => 3,
                        'X-RateLimit-Remaining' => 0,
                        'X-RateLimit-Reset' => now()->addSeconds($this->otpService->getRetryAfter($phone))->timestamp,
                    ]);
        }

        // Check if user already exists
        $userExists = User::where('phone', $phone)->exists();

        // Generate and send OTP
        $otp = $this->otpService->generate($phone, 'login');
        $this->whatsAppService->sendOtp($phone, $otp->code);

        return response()->json([
            'success' => true,
            'userExists' => $userExists,
            'expiresIn' => 300,
            'message' => 'Código enviado para seu WhatsApp',
        ])->withHeaders([
                    'X-RateLimit-Limit' => 3,
                    'X-RateLimit-Remaining' => $this->otpService->getRateLimitRemaining($phone),
                ]);
    }

    /**
     * Verify OTP code.
     * 
     * POST /api/v1/auth/verify-otp
     * 
     * @response 200 (existing user) {
     *   "token": "1|xxx",
     *   "refreshToken": "2|xxx",
     *   "user": {...},
     *   "expiresIn": 604800
     * }
     * 
     * @response 200 (new user) {
     *   "needsRegistration": true,
     *   "phone": "48996553954"
     * }
     */
    public function verify(VerifyOtpRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Get the current OTP for attempt tracking
        $currentOtp = $this->otpService->getLatestOtp($validated['phone']);

        $otp = $this->otpService->verify(
            $validated['phone'],
            $validated['code']
        );

        if (!$otp) {
            $attemptsRemaining = $currentOtp
                ? max(0, 5 - ($currentOtp->attempts + 1))
                : 0;

            return response()->json([
                'success' => false,
                'message' => $attemptsRemaining > 0
                    ? 'Código incorreto'
                    : 'Código inválido ou expirado. Solicite um novo.',
                'code' => 'INVALID_OTP',
                'attemptsRemaining' => $attemptsRemaining,
            ], 401);
        }

        // Find existing user
        $user = User::where('phone', $validated['phone'])->first();

        if (!$user) {
            // Mark verification in cache for registration (5 min window)
            cache()->put(
                'verified_phone:' . $validated['phone'],
                true,
                now()->addMinutes(5)
            );

            return response()->json([
                'needsRegistration' => true,
                'phone' => $validated['phone'],
                'verifiedUntil' => now()->addMinutes(5)->toIso8601String(),
            ]);
        }

        // Mark phone as verified
        $user->update([
            'phone_verified' => true,
            'phone_verified_at' => now(),
        ]);

        // Generate tokens
        $token = $user->createToken('app', ['*'], now()->addDays(7))->plainTextToken;
        $refreshToken = $this->generateRefreshToken($user);

        return response()->json([
            'token' => $token,
            'refreshToken' => $refreshToken,
            'user' => new UserResource($user->load('bairro', 'roles')),
            'expiresIn' => 604800, // 7 days in seconds
        ]);
    }

    /**
     * Resend OTP code (helper endpoint).
     * 
     * POST /api/v1/auth/resend-otp
     */
    public function resend(SendOtpRequest $request): JsonResponse
    {
        return $this->send($request);
    }

    /**
     * Generate a refresh token for the user.
     */
    protected function generateRefreshToken(User $user): string
    {
        // Create a longer-lived token for refresh
        $token = $user->createToken('refresh', ['refresh'], now()->addDays(30));
        return $token->plainTextToken;
    }
}
