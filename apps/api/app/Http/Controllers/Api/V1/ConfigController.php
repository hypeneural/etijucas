<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Config Controller
 * 
 * Provides tenant configuration for frontend bootstrap.
 * This endpoint is the single source of truth for:
 * - City information
 * - Brand/theming
 * - Enabled modules
 * - Geo defaults
 * 
 * Frontend should call this on startup to initialize tenant context.
 */
class ConfigController extends Controller
{
    /**
     * Get tenant configuration for frontend bootstrap.
     * 
     * @response 200 {
     *   "success": true,
     *   "data": {
     *     "city": { "id": "...", "name": "Tijucas", "slug": "tijucas-sc", "uf": "SC" },
     *     "brand": { "appName": "ETijucas", "primaryColor": "#10B981" },
     *     "modules": [{ "slug": "forum", "name": "Fórum" }],
     *     "geo": { "defaultBairroId": "...", "lat": -27.23, "lon": -48.63 }
     *   }
     * }
     */
    public function bootstrap(Request $request): JsonResponse
    {
        if (!Tenant::isSet()) {
            return response()->json([
                'success' => false,
                'error' => 'NO_TENANT',
                'message' => 'Contexto de cidade não encontrado.',
            ], 400);
        }

        $config = Tenant::config();

        return response()
            ->json([
                'success' => true,
                'data' => $config,
                'meta' => [
                    'requestId' => $request->header('X-Request-Id'),
                    'cachedAt' => now()->toISOString(),
                    'version' => config('app.version', '1.0.0'),
                ],
            ])
            ->header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
            ->header('Vary', 'Host, X-City');
    }

    /**
     * Get list of all active cities.
     * This is a global endpoint (no tenant context required).
     */
    public function cities(Request $request): JsonResponse
    {
        $cities = \App\Models\City::query()
            ->where('active', true)
            ->select(['id', 'name', 'slug', 'uf', 'ibge_code'])
            ->orderBy('name')
            ->get()
            ->map(fn($city) => [
                'id' => $city->id,
                'name' => $city->name,
                'slug' => $city->slug,
                'uf' => $city->uf,
                'fullName' => "{$city->name}/{$city->uf}",
            ]);

        return response()->json([
            'success' => true,
            'data' => $cities,
            'meta' => [
                'count' => $cities->count(),
            ],
        ])->header('Cache-Control', 'public, max-age=3600');
    }

    /**
     * Detect city based on GPS coordinates.
     * Uses Haversine formula to find nearest city.
     */
    public function detect(Request $request): JsonResponse
    {
        $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lon' => 'required|numeric|between:-180,180',
        ]);

        $lat = $request->float('lat');
        $lon = $request->float('lon');

        // Find nearest city using Haversine formula
        $city = \App\Models\City::query()
            ->where('active', true)
            ->whereNotNull('lat')
            ->whereNotNull('lon')
            ->selectRaw("
                *,
                (6371 * acos(cos(radians(?)) * cos(radians(lat)) * cos(radians(lon) - radians(?)) + sin(radians(?)) * sin(radians(lat)))) AS distance
            ", [$lat, $lon, $lat])
            ->orderBy('distance')
            ->first();

        if (!$city || $city->distance > 50) {
            return response()->json([
                'success' => false,
                'error' => 'NO_CITY_NEARBY',
                'message' => 'Nenhuma cidade atendida próxima.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $city->id,
                'name' => $city->name,
                'slug' => $city->slug,
                'uf' => $city->uf,
                'fullName' => "{$city->name}/{$city->uf}",
                'distance' => round($city->distance, 2),
            ],
        ]);
    }
}
