<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\OtpService;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PasswordlessAuthController extends Controller
{
    public function __construct(
        private OtpService $otpService,
        private WhatsAppService $whatsAppService
    ) {
    }

    /**
     * Request OTP for passwordless login.
     * Creates session ID for magic link support.
     *
     * POST /api/v1/auth/otp/login
     */
    public function requestOtp(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => 'required|string|min:10|max:15',
        ]);

        $phone = preg_replace('/[^0-9]/', '', $request->phone);

        // Check rate limit
        if ($this->otpService->isRateLimited($phone)) {
            return response()->json([
                'success' => false,
                'message' => 'Aguarde para solicitar novo código',
                'code' => 'RATE_LIMITED',
                'retryAfter' => $this->otpService->getRetryAfter($phone),
            ], 429);
        }

        // Generate OTP with session (handles idempotency)
        $result = $this->otpService->generateWithSession($phone, 'passwordless');

        // Send via WhatsApp with buttons
        $this->whatsAppService->sendOtpWithButtons(
            $phone,
            $result['otp']->code,
            $result['sid']
        );

        return response()->json([
            'success' => true,
            'next_step' => 'otp_verify',
            'expiresIn' => 300,
            'cooldown' => 30,
            'sid' => $result['sid'],
        ]);
    }

    /**
     * Get session context by session ID (for magic link).
     * Returns ONLY masked phone for privacy.
     *
     * GET /api/v1/auth/otp/session/{sid}
     */
    public function getSessionContext(string $sid): JsonResponse
    {
        $context = $this->otpService->getSessionContext($sid);

        if (!$context) {
            return response()->json([
                'success' => false,
                'message' => 'Sessão expirada ou inválida',
                'code' => 'SID_EXPIRED',
            ], 410); // 410 Gone
        }

        return response()->json([
            'success' => true,
            'maskedPhone' => $context['masked_phone'],
            'expiresIn' => $context['expires_in'],
            'cooldown' => $context['cooldown'],
            'hint' => 'Copie o código no WhatsApp e volte aqui',
        ]);
    }

    /**
     * Verify OTP and login (or auto-register).
     * Accepts sid + code (no phone required - secure).
     *
     * POST /api/v1/auth/otp/verify
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'sid' => 'required|string|size:32',
            'code' => 'required|string|size:6',
        ]);

        // Verify OTP by SID (secure - no phone exposed)
        $result = $this->otpService->verifyBySid($request->sid, $request->code);

        if (!$result['success']) {
            $statusCode = match ($result['error_code']) {
                'SID_EXPIRED' => 410,
                'OTP_EXPIRED' => 401,
                'OTP_INVALID' => 401,
                default => 400,
            };

            $message = match ($result['error_code']) {
                'SID_EXPIRED' => 'Sessão expirada. Solicite novo código.',
                'OTP_EXPIRED' => 'Código expirado. Solicite novo código.',
                'OTP_INVALID' => 'Código incorreto. Tente novamente.',
                default => 'Erro ao verificar código.',
            };

            return response()->json([
                'success' => false,
                'message' => $message,
                'code' => $result['error_code'],
            ], $statusCode);
        }

        $phone = $result['phone'];

        // Find or create user (invisible registration)
        $user = User::where('phone', $phone)->first();
        $isNewUser = false;

        if (!$user) {
            $isNewUser = true;
            $user = User::create([
                'phone' => $phone,
                'password' => Hash::make(Str::random(32)), // Random password, won't be used
                'phone_verified' => true,
                'phone_verified_at' => now(),
                'profile_completed' => false,
                'terms_accepted' => false,
            ]);

            $user->assignRole('user');
        } else {
            // Update phone verification for existing user
            $user->update([
                'phone_verified' => true,
                'phone_verified_at' => now(),
            ]);
        }

        // Generate tokens
        $token = $user->createToken('app', ['*'], now()->addDays(7))->plainTextToken;
        $refreshToken = $user->createToken('refresh', ['refresh'], now()->addDays(30))->plainTextToken;

        // Determine next step
        $nextStep = $user->profile_completed ? 'home' : 'onboarding';

        return response()->json([
            'success' => true,
            'next_step' => $nextStep,
            'isNewUser' => $isNewUser,
            'token' => $token,
            'refreshToken' => $refreshToken,
            'user' => new UserResource($user->load('bairro', 'roles')),
            'expiresIn' => 604800,
        ]);
    }

    /**
     * Complete user profile after passwordless login.
     *
     * POST /api/v1/auth/profile/complete
     */
    public function completeProfile(Request $request): JsonResponse
    {
        $request->validate([
            'nome' => 'required|string|min:2|max:100',
            'bairro_id' => 'nullable|uuid|exists:bairros,id',
            'terms_accepted' => 'required|boolean|accepted',
        ]);

        $user = $request->user();

        $user->update([
            'nome' => $request->nome,
            'bairro_id' => $request->bairro_id,
            'terms_accepted' => $request->terms_accepted,
            'terms_accepted_at' => now(),
            'profile_completed' => true,
        ]);

        return response()->json([
            'success' => true,
            'next_step' => 'home',
            'user' => new UserResource($user->fresh()->load('bairro', 'roles')),
        ]);
    }
}
