<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\SendOtpRequest;
use App\Models\User;
use App\Services\OtpService;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;

class ForgotPasswordController extends Controller
{
    public function __construct(
        private OtpService $otpService,
        private WhatsAppService $whatsAppService
    ) {
    }

    /**
     * Send OTP for password reset.
     * 
     * POST /api/v1/auth/forgot-password
     */
    public function sendResetLink(SendOtpRequest $request): JsonResponse
    {
        $phone = $request->validated('phone');

        $user = User::where('phone', $phone)->first();

        if (!$user) {
            // Standard security practice: don't reveal if user exists, 
            // but for this specific app requirement might be different. 
            // We'll return success to prevent enumeration but NOT send SMS.
            // Or if rate limit allows, just fake it.
            // For now, let's be honest for better UX as requested in other flows.
            return response()->json([
                'success' => false,
                'message' => 'Usuário não encontrado',
                'code' => 'USER_NOT_FOUND',
            ], 404);
        }

        // Check rate limit
        if ($this->otpService->isRateLimited($phone)) {
            return response()->json([
                'success' => false,
                'message' => 'Aguarde para solicitar novo código',
                'code' => 'RATE_LIMITED',
                'retryAfter' => $this->otpService->getRetryAfter($phone),
            ], 429);
        }

        // Generate and send OTP (type: password_reset)
        $otp = $this->otpService->generate($phone, 'password_reset');
        $this->whatsAppService->sendOtp($phone, $otp->code);

        return response()->json([
            'success' => true,
            'expiresIn' => 300,
            'message' => 'Código de recuperação enviado para seu WhatsApp',
        ]);
    }
}
