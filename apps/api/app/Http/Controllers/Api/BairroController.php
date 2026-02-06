<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bairro;
use Illuminate\Http\JsonResponse;

class BairroController extends Controller
{
    /**
     * List all active bairros for the current tenant city.
     * 
     * GET /api/v1/bairros
     * 
     * @response 200 {
     *   "data": [
     *     { "id": "uuid", "nome": "Centro", "slug": "centro" },
     *     ...
     *   ]
     * }
     */
    public function index(): JsonResponse
    {
        $cityId = \App\Support\Tenant::cityId();

        $bairros = Bairro::active()
            ->when($cityId, fn($q) => $q->where('city_id', $cityId))
            ->orderBy('sort_order')
            ->orderBy('nome')
            ->get(['id', 'nome', 'slug']);

        return response()->json([
            'data' => $bairros,
        ]);
    }
}
