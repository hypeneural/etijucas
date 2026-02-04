<?php

declare(strict_types=1);

namespace App\Domains\Votes\Http\Controllers;

use App\Domains\Votes\Http\Resources\VereadorListResource;
use App\Domains\Votes\Http\Resources\VereadorResource;
use App\Domains\Votes\Http\Resources\VotacaoListResource;
use App\Domains\Votes\Models\Vereador;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class VereadorController extends Controller
{
    /**
     * GET /api/v1/vereadores
     * List all councilors with optional filters
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Vereador::query()
            ->with(['mandatoAtual.partido', 'mandatoAtual.legislatura'])
            ->ativos();

        // Filter by legislatura atual (default: true)
        if ($request->boolean('legislatura_atual', true)) {
            $query->emExercicio();
        }

        // Filter by partido
        if ($request->filled('partido')) {
            $query->byPartido($request->input('partido'));
        }

        // Search by name
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('nome', 'like', "%{$search}%");
        }

        // Order
        $query->orderBy('nome');

        return VereadorListResource::collection($query->get());
    }

    /**
     * GET /api/v1/vereadores/{slug}
     * Get councilor details
     */
    public function show(Request $request, string $slug): JsonResponse
    {
        $vereador = Vereador::query()
            ->with([
                'mandatoAtual.partido',
                'mandatoAtual.legislatura',
                'mandatos.partido',
                'mandatos.legislatura',
                'votos',
            ])
            ->where('slug', $slug)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => new VereadorResource($vereador),
        ]);
    }

    /**
     * GET /api/v1/vereadores/{slug}/votacoes
     * Get councilor's voting history
     */
    public function votacoes(Request $request, string $slug): AnonymousResourceCollection
    {
        $vereador = Vereador::where('slug', $slug)->firstOrFail();

        $votacoes = $vereador->votos()
            ->with('votacao')
            ->orderByDesc('created_at')
            ->get()
            ->pluck('votacao')
            ->unique('id');

        return VotacaoListResource::collection($votacoes);
    }
}
