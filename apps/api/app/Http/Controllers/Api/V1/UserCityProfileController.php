<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserCityProfileResource;
use App\Models\UserCityProfile;
use App\Support\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * UserCityProfile Controller
 *
 * Manages user profiles per city (local profiles).
 * Each user can have different bairro preferences per city.
 */
class UserCityProfileController extends Controller
{
    /**
     * Get user's profile for a specific city.
     *
     * GET /api/v1/user/city-profile/{cityId}
     */
    public function show(Request $request, string $cityId): JsonResponse
    {
        $user = $request->user();

        $profile = UserCityProfile::query()
            ->withoutGlobalScope('tenant')
            ->where('user_id', $user->id)
            ->where('city_id', $cityId)
            ->with('bairro')
            ->first();

        if (!$profile) {
            return response()->json([
                'success' => true,
                'data' => null,
                'message' => 'No local profile for this city',
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => new UserCityProfileResource($profile),
        ]);
    }

    /**
     * Create or update user's profile for a city.
     *
     * PATCH /api/v1/user/city-profile
     */
    public function upsert(Request $request): JsonResponse
    {
        $request->validate([
            'city_id' => 'required|uuid|exists:cities,id',
            'bairro_id' => 'nullable|uuid|exists:bairros,id',
        ]);

        $user = $request->user();
        $cityId = $request->city_id;

        // Validate bairro belongs to the target city
        if ($request->bairro_id) {
            $bairro = \App\Models\Bairro::find($request->bairro_id);
            if ($bairro && $bairro->city_id !== $cityId) {
                return response()->json([
                    'success' => false,
                    'error' => 'BAIRRO_CITY_MISMATCH',
                    'message' => 'O bairro não pertence à cidade informada.',
                ], 422);
            }
        }

        $profile = UserCityProfile::updateOrCreate(
            ['user_id' => $user->id, 'city_id' => $cityId],
            [
                'bairro_id' => $request->bairro_id,
                'profile_completed' => $request->bairro_id !== null,
            ]
        );

        return response()->json([
            'success' => true,
            'data' => new UserCityProfileResource($profile->load('bairro')),
            'message' => 'Perfil local atualizado.',
        ]);
    }

    /**
     * Get current user's profile for current tenant city.
     *
     * GET /api/v1/user/city-profile
     */
    public function current(Request $request): JsonResponse
    {
        $user = $request->user();
        $cityId = Tenant::cityId();

        if (!$cityId) {
            return response()->json([
                'success' => false,
                'error' => 'NO_TENANT',
                'message' => 'Contexto de cidade não encontrado.',
            ], 400);
        }

        $profile = $user->getProfileForCity($cityId);

        return response()->json([
            'success' => true,
            'data' => $profile ? new UserCityProfileResource($profile->load('bairro')) : null,
            'meta' => [
                'has_local_profile' => $profile !== null,
                'profile_completed' => $profile?->profile_completed ?? false,
            ],
        ]);
    }
}
