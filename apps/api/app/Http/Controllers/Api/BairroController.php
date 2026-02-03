<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bairro;
use Illuminate\Http\JsonResponse;

class BairroController extends Controller
{
    /**
     * List all active bairros.
     * 
     * GET /api/v1/bairros
     * 
     * @response 200 {
     *   "data": [
     *     { "id": "uuid", "name": "Centro", "slug": "centro" },
     *     ...
     *   ]
     * }
     */
    public function index(): JsonResponse
    {
        $bairros = Bairro::active()
            ->orderBy('nome')
            ->get(['id', 'nome', 'slug']);

        return response()->json([
            'data' => $bairros,
        ]);
    }
}
