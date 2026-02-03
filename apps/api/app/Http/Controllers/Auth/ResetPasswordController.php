<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;

class ResetPasswordController extends Controller
{
    public function __construct(
        private OtpService $otpService
    ) {
    }

    /**
     * Reset password using OTP.
     * 
     * POST /api/v1/auth/reset-password
     */
    public function reset(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => ['required', 'string', 'size:11'],
            'code' => ['required', 'string', 'size:6'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        // Verify OTP
        $otp = $this->otpService->verify(
            $request->phone,
            $request->code,
            'password_reset'
        );

        if (!$otp) {
            return response()->json([
                'success' => false,
                'message' => 'Código inválido ou expirado',
                'code' => 'INVALID_OTP',
            ], 401);
        }

        $user = User::where('phone', $request->phone)->firstOrFail();

        // Update password (hashed automatically by cast in User model, but explicit is safer if raw update)
        // Since we use Eloquent update, cast should work.
        $user->password = $request->password;
        $user->save();

        // Optional: Revoke all tokens on password reset?
        // $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Senha alterada com sucesso. Faça login com sua nova senha.',
        ]);
    }
}
