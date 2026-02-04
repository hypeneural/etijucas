<?php

declare(strict_types=1);

namespace App\Domains\Votes\Http\Controllers;

use App\Domains\Votes\Enums\StatusVotacao;
use App\Domains\Votes\Http\Resources\VotacaoListResource;
use App\Domains\Votes\Http\Resources\VotacaoResource;
use App\Domains\Votes\Models\Votacao;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class VotacaoController extends Controller
{
    /**
     * GET /api/v1/votacoes
     * List all voting sessions with filters
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Votacao::query()->orderByDesc('data');

        // Filter by status
        if ($request->filled('status')) {
            $statuses = explode(',', $request->input('status'));
            $query->whereIn('status', $statuses);
        }

        // Filter by year
        if ($request->filled('ano')) {
            $query->doAno((int) $request->input('ano'));
        }

        // Filter by type
        if ($request->filled('tipo')) {
            $query->doTipo($request->input('tipo'));
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('titulo', 'like', "%{$search}%")
                    ->orWhere('descricao', 'like', "%{$search}%")
                    ->orWhere('protocolo', 'like', "%{$search}%");
            });
        }

        // Filter by vereador
        if ($request->filled('vereador')) {
            $query->whereHas('votos.vereador', function ($q) use ($request) {
                $q->where('slug', $request->input('vereador'));
            });
        }

        // Filter by partido (todos vereadores votaram junto)
        if ($request->filled('partido')) {
            $partido = $request->input('partido');
            $voto = $request->input('voto_partido', 'SIM');
            $query->whereHas('votos', function ($q) use ($partido, $voto) {
                $q->where('voto', $voto)
                    ->whereHas('vereador.mandatoAtual.partido', fn($pq) => $pq->where('sigla', $partido));
            });
        }

        // Paginate
        $perPage = min((int) $request->input('per_page', 20), 50);

        return VotacaoListResource::collection($query->paginate($perPage));
    }

    /**
     * GET /api/v1/votacoes/{id}
     * Get voting session details with all votes
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $votacao = Votacao::with([
            'votos.vereador.mandatoAtual.partido',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new VotacaoResource($votacao),
        ]);
    }

    /**
     * GET /api/v1/votacoes/stats
     * Get overall voting statistics
     */
    public function stats(): JsonResponse
    {
        $total = Votacao::count();
        $aprovadas = Votacao::where('status', StatusVotacao::APROVADO)->count();
        $rejeitadas = Votacao::where('status', StatusVotacao::REJEITADO)->count();
        $emAndamento = Votacao::where('status', StatusVotacao::EM_ANDAMENTO)->count();

        $ultimaVotacao = Votacao::orderByDesc('data')->first();

        $porAno = Votacao::selectRaw('YEAR(data) as ano, COUNT(*) as total')
            ->groupBy('ano')
            ->orderByDesc('ano')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'aprovadas' => $aprovadas,
                'rejeitadas' => $rejeitadas,
                'emAndamento' => $emAndamento,
                'taxaAprovacao' => $total > 0
                    ? round(($aprovadas / $total) * 100, 1)
                    : 0,
                'ultimaVotacao' => $ultimaVotacao ? [
                    'id' => $ultimaVotacao->id,
                    'titulo' => $ultimaVotacao->titulo,
                    'data' => $ultimaVotacao->data->format('Y-m-d'),
                    'status' => $ultimaVotacao->status->value,
                ] : null,
                'porAno' => $porAno,
            ],
        ]);
    }

    /**
     * GET /api/v1/votacoes/anos
     * Get available years for filtering
     */
    public function anos(): JsonResponse
    {
        $anos = Votacao::selectRaw('DISTINCT YEAR(data) as ano')
            ->orderByDesc('ano')
            ->pluck('ano');

        return response()->json([
            'success' => true,
            'data' => $anos,
        ]);
    }
}
