<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\VehicleLookupRequest;
use App\Services\VehicleLookupService;
use Illuminate\Http\JsonResponse;

class VehicleLookupController extends Controller
{
    public function __construct(
        private VehicleLookupService $lookupService
    ) {
    }

    /**
     * Lookup vehicle data by plate.
     * 
     * POST /api/v1/vehicles/lookup
     * Body: { plate: string, refresh?: boolean, sections?: string[] }
     */
    public function lookup(VehicleLookupRequest $request): JsonResponse
    {
        $plate = $request->plateNormalized();
        $type = $request->plateType($plate);

        // Validate plate format
        if ($type === 'invalid' || strlen($plate) !== 7) {
            return response()->json([
                'ok' => false,
                'code' => 'INVALID_PLATE',
                'message' => 'Placa inválida. Use o formato ABC1234 ou ABC1D23.',
            ], 422);
        }

        // Fetch from cache or API
        $record = $this->lookupService->getOrFetch($plate, [
            'refresh' => $request->wantsRefresh(),
        ]);

        // Determine what sections are available
        $available = [
            'basic' => $record->payload !== null,
            'extra' => $record->extra !== null,
            'fipe' => $record->fipe !== null,
            'logo' => $record->logo_url !== null,
        ];

        // Build response
        $response = [
            'ok' => $record->isSuccess(),
            'plate' => $record->plate,
            'plateType' => $record->plate_type,
            'finalDigit' => $record->final_digit,
            'cache' => [
                'hit' => $record->exists && $record->isSuccess(),
                'fetchedAt' => $record->fetched_at?->toIso8601String(),
                'expiresAt' => $record->expires_at?->toIso8601String(),
                'lastStatus' => $record->last_status,
                'lastError' => $record->last_error,
            ],
            'availableSections' => $available,
            'data' => [],
        ];

        // If lookup failed, return early
        if (!$record->isSuccess()) {
            return response()->json($response);
        }

        // Include requested sections
        $sections = $request->getSections();

        if (in_array('basic', $sections, true)) {
            $response['data']['basic'] = [
                'brand' => $record->brand,
                'model' => $record->model,
                'color' => $record->color,
                'uf' => $record->uf,
                'municipio' => $record->municipio,
                'situacao' => $record->situacao,
                'logoUrl' => $record->logo_url,
                'ano' => $record->payload['ano'] ?? null,
                'anoModelo' => $record->payload['anoModelo'] ?? null,
                'origem' => $record->payload['origem'] ?? null,
                'chassi' => $record->payload['chassi'] ?? null,
                'marcaModelo' => $record->payload['marcaModelo'] ?? null,
            ];
        }

        if (in_array('extra', $sections, true) && $record->extra) {
            $response['data']['extra'] = $record->extra;
        }

        if (in_array('fipe', $sections, true) && $record->fipe) {
            $response['data']['fipe'] = $record->fipe;
        }

        return response()->json($response);
    }

    /**
     * Get cached vehicle lookup stats (admin only).
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total' => \App\Models\VehicleCache::count(),
            'valid' => \App\Models\VehicleCache::valid()->count(),
            'byType' => [
                'old' => \App\Models\VehicleCache::byType('old')->count(),
                'mercosul' => \App\Models\VehicleCache::byType('mercosul')->count(),
            ],
            'totalHits' => \App\Models\VehicleCache::sum('hits'),
            'topPlates' => \App\Models\VehicleCache::orderByDesc('hits')
                ->take(10)
                ->get(['plate', 'hits', 'brand', 'model']),
        ];

        return response()->json(['ok' => true, 'stats' => $stats]);
    }
}
