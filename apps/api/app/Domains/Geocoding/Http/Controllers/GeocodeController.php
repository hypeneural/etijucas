<?php

namespace App\Domains\Geocoding\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class GeocodeController extends Controller
{
    private const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
    private const USER_AGENT = 'ETijucas/1.0 (civic app for Tijucas, SC, Brazil)';
    private const CACHE_TTL = 1800; // 30 minutes

    /**
     * GET /api/v1/geocode/autocomplete
     * Search for addresses
     */
    public function autocomplete(Request $request): JsonResponse
    {
        $request->validate([
            'q' => 'required|string|min:3|max:200',
            'lat' => 'nullable|numeric|between:-90,90',
            'lon' => 'nullable|numeric|between:-180,180',
        ]);

        $query = $request->input('q');
        $lat = $request->input('lat');
        $lon = $request->input('lon');

        // Cache key
        $cacheKey = 'geocode:autocomplete:' . md5($query . $lat . $lon);

        $results = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($query, $lat, $lon) {
            try {
                $params = [
                    'q' => $query,
                    'format' => 'json',
                    'addressdetails' => 1,
                    'limit' => 5,
                    'countrycodes' => 'br',
                    'accept-language' => 'pt-BR',
                ];

                // Add viewbox bias if coordinates provided (Tijucas area)
                if ($lat && $lon) {
                    $params['viewbox'] = sprintf(
                        '%f,%f,%f,%f',
                        $lon - 0.1,
                        $lat + 0.1,
                        $lon + 0.1,
                        $lat - 0.1
                    );
                    $params['bounded'] = 0; // Prefer but don't restrict
                } else {
                    // Default to Tijucas area
                    $params['viewbox'] = '-48.68,-27.18,-48.58,-27.28';
                    $params['bounded'] = 0;
                }

                $response = Http::timeout(5)
                    ->withHeaders(['User-Agent' => self::USER_AGENT])
                    ->get(self::NOMINATIM_URL . '/search', $params);

                if (!$response->successful()) {
                    return [];
                }

                return collect($response->json())->map(fn($item) => [
                    'placeId' => $item['place_id'] ?? null,
                    'displayName' => $item['display_name'] ?? '',
                    'latitude' => (float) ($item['lat'] ?? 0),
                    'longitude' => (float) ($item['lon'] ?? 0),
                    'type' => $item['type'] ?? 'unknown',
                    'address' => $this->formatAddress($item['address'] ?? []),
                ])->toArray();
            } catch (\Exception $e) {
                report($e);
                return [];
            }
        });

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }

    /**
     * GET /api/v1/geocode/reverse
     * Convert lat/lon to address
     */
    public function reverse(Request $request): JsonResponse
    {
        $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lon' => 'required|numeric|between:-180,180',
        ]);

        $lat = $request->input('lat');
        $lon = $request->input('lon');

        // Cache key - round to 5 decimal places for cache efficiency
        $cacheKey = 'geocode:reverse:' . round($lat, 5) . ':' . round($lon, 5);

        $result = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($lat, $lon) {
            try {
                $response = Http::timeout(5)
                    ->withHeaders(['User-Agent' => self::USER_AGENT])
                    ->get(self::NOMINATIM_URL . '/reverse', [
                        'lat' => $lat,
                        'lon' => $lon,
                        'format' => 'json',
                        'addressdetails' => 1,
                        'accept-language' => 'pt-BR',
                    ]);

                if (!$response->successful()) {
                    return null;
                }

                $data = $response->json();

                return [
                    'placeId' => $data['place_id'] ?? null,
                    'displayName' => $data['display_name'] ?? '',
                    'latitude' => (float) ($data['lat'] ?? $lat),
                    'longitude' => (float) ($data['lon'] ?? $lon),
                    'type' => $data['type'] ?? 'unknown',
                    'address' => $this->formatAddress($data['address'] ?? []),
                ];
            } catch (\Exception $e) {
                report($e);
                return null;
            }
        });

        if (!$result) {
            return response()->json([
                'success' => false,
                'message' => 'Não foi possível encontrar o endereço.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Format Nominatim address object into a readable string
     */
    private function formatAddress(array $address): string
    {
        $parts = [];

        // Road/Street
        if (!empty($address['road'])) {
            $parts[] = $address['road'];
            if (!empty($address['house_number'])) {
                $parts[count($parts) - 1] .= ', ' . $address['house_number'];
            }
        }

        // Neighborhood
        if (!empty($address['suburb'])) {
            $parts[] = $address['suburb'];
        } elseif (!empty($address['neighbourhood'])) {
            $parts[] = $address['neighbourhood'];
        }

        // City
        if (!empty($address['city'])) {
            $parts[] = $address['city'];
        } elseif (!empty($address['town'])) {
            $parts[] = $address['town'];
        } elseif (!empty($address['municipality'])) {
            $parts[] = $address['municipality'];
        }

        // State
        if (!empty($address['state'])) {
            $parts[] = $address['state'];
        }

        return implode(', ', $parts);
    }
}
