<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\OtpCode;
use App\Models\User;
use App\Services\NeighborhoodService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private NeighborhoodService $neighborhoodService
    ) {
    }

    /**
     * Register a new user after OTP verification.
     * 
     * POST /api/v1/auth/register
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Verify that the phone was recently verified via OTP
        $recentOtp = OtpCode::forPhone($validated['phone'])
            ->whereNotNull('verified_at')
            ->where('verified_at', '>', now()->subMinutes(10))
            ->first();

        if (!$recentOtp) {
            return response()->json([
                'success' => false,
                'message' => 'Verifique seu telefone primeiro via OTP',
                'code' => 'OTP_NOT_VERIFIED',
            ], 400);
        }

        // Handle neighborhood - auto-create if needed
        $bairroId = null;
        $neighborhoodCreated = false;

        // Priority: bairroId > address.bairro
        if (!empty($validated['bairroId'])) {
            // Try to find existing bairro by ID
            $bairro = \App\Models\Bairro::find($validated['bairroId']);
            if ($bairro) {
                $bairroId = $bairro->id;
            }
        }

        // If no valid bairroId, try to create from address.bairro
        if (!$bairroId && !empty($validated['address']['bairro'])) {
            $bairro = $this->neighborhoodService->ensureExists($validated['address']['bairro']);
            $bairroId = $bairro->id;
            $neighborhoodCreated = $bairro->wasRecentlyCreated;
        }

        // Create user
        $user = User::create([
            'phone' => $validated['phone'],
            'password' => $validated['password'], // Cast will hash this
            'nome' => $validated['nome'],
            'email' => $validated['email'] ?? null,
            'bairro_id' => $bairroId,
            'address' => $validated['address'] ?? null,
            'phone_verified' => true,
            'phone_verified_at' => now(),
        ]);

        // Assign default role
        $user->assignRole('user');

        // Generate tokens
        $token = $user->createToken('app')->plainTextToken;
        $refreshToken = $user->createToken('refresh', ['refresh'], now()->addDays(30))->plainTextToken;

        $response = [
            'token' => $token,
            'refreshToken' => $refreshToken,
            'user' => new UserResource($user->load('bairro', 'roles')),
            'expiresIn' => config('sanctum.expiration', 3600),
        ];

        // Add meta info about neighborhood creation
        if ($neighborhoodCreated) {
            $response['meta'] = [
                'neighborhoodCreated' => true,
                'neighborhoodId' => $bairroId,
                'neighborhoodName' => $bairro->nome ?? null,
            ];
        }

        return response()->json($response, 201);
    }

    /**
     * Login with phone and password.
     * 
     * POST /api/v1/auth/login
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('phone', $request->phone)->first();

        // Check if user exists and password is correct
        if (!$user || !\Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Credenciais inválidas',
                'code' => 'INVALID_CREDENTIALS',
            ], 401);
        }

        // Generate tokens
        $token = $user->createToken('app')->plainTextToken;
        $refreshToken = $user->createToken('refresh', ['refresh'], now()->addDays(30))->plainTextToken;

        return response()->json([
            'token' => $token,
            'refreshToken' => $refreshToken,
            'user' => new UserResource($user->load('bairro', 'roles')),
            'expiresIn' => config('sanctum.expiration', 3600),
        ]);
    }

    /**
     * Refresh the access token.
     * 
     * POST /api/v1/auth/refresh
     */
    /**
     * Refresh the access token with Grace Period.
     * 
     * POST /api/v1/auth/refresh
     */
    public function refresh(Request $request): JsonResponse
    {
        $request->validate([
            'refreshToken' => ['required', 'string'],
        ]);

        $hashedToken = $request->refreshToken;

        // 1. Check if this token was recently rotated (Grace Period)
        // If it was, return the NEW valid token that replaced it
        $cacheKey = 'refresh_grace:' . md5($hashedToken);
        if ($cachedResponse = \Illuminate\Support\Facades\Cache::get($cacheKey)) {
            return response()->json($cachedResponse);
        }

        // 2. Locate the token in database
        $token = \Laravel\Sanctum\PersonalAccessToken::findToken($hashedToken);

        if (!$token || !$token->can('refresh') || $token->expires_at?->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Refresh token inválido ou expirado',
                'code' => 'INVALID_REFRESH_TOKEN',
            ], 401);
        }

        $user = $token->tokenable;

        // 3. Prevent race conditions with atomic lock
        $lock = \Illuminate\Support\Facades\Cache::lock('refresh_lock:' . $token->id, 5);

        try {
            if (!$lock->get()) {
                // If locked, it means another request is rotating it right now.
                // Wait briefly and try to get the grace period result
                sleep(1);
                if ($cachedResponse = \Illuminate\Support\Facades\Cache::get($cacheKey)) {
                    return response()->json($cachedResponse);
                }
                // Fallback error if lock released but no cache (unlikely)
                return response()->json(['message' => 'Tente novamente'], 429);
            }

            // 4. Rotate Token
            // Delete old token
            $token->delete();

            // Generate new pair
            $newToken = $user->createToken('app')->plainTextToken;
            $newRefreshToken = $user->createToken('refresh', ['refresh'], now()->addDays(30))->plainTextToken;

            // 5. Store result in cache for Grace Period (20 seconds)
            $response = [
                'token' => $newToken,
                'refreshToken' => $newRefreshToken,
                'expiresIn' => config('sanctum.expiration', 3600),
            ];

            \Illuminate\Support\Facades\Cache::put($cacheKey, $response, 20);

            return response()->json($response);

        } finally {
            $lock->release();
        }
    }

    /**
     * Logout the user.
     * 
     * POST /api/v1/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $allDevices = $request->boolean('allDevices', false);

        if ($allDevices) {
            // Revoke all tokens for this user
            $request->user()->tokens()->delete();
        } else {
            // Revoke only the current token
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout realizado com sucesso',
        ]);
    }

    /**
     * Get the authenticated user.
     * 
     * GET /api/v1/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => new UserResource($request->user()->load('bairro', 'roles')),
        ]);
    }
}
