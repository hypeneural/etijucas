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
     * Get councilor's voting history with their votes
     */
    public function votacoes(Request $request, string $slug): JsonResponse
    {
        $vereador = Vereador::where('slug', $slug)->firstOrFail();

        $votos = $vereador->votos()
            ->with('votacao')
            ->orderByDesc('created_at')
            ->get();

        $votacoesComVoto = $votos->map(function ($votoRegistro) {
            $votacao = $votoRegistro->votacao;

            return [
                'id' => $votacao->id,
                'protocolo' => $votacao->protocolo,
                'titulo' => $votacao->titulo,
                'subtitulo' => $votacao->subtitulo,
                'tipo' => $votacao->tipo,
                'status' => $votacao->status->value,
                'statusLabel' => $votacao->status->label(),
                'data' => $votacao->data->format('Y-m-d'),
                'tags' => $votacao->tags ?? [],
                'counts' => [
                    'sim' => $votacao->votos_sim,
                    'nao' => $votacao->votos_nao,
                    'abstencao' => $votacao->votos_abstencao,
                    'naoVotou' => $votacao->votos_ausente,
                ],
                'resultado' => $votacao->votos_sim > $votacao->votos_nao ? 'approved' : 'rejected',
                'votoDoVereador' => $votoRegistro->voto->value,
                'justificativaVoto' => $votoRegistro->justificativa,
            ];
        })->unique('id')->values();

        return response()->json([
            'success' => true,
            'data' => $votacoesComVoto,
        ]);
    }
}
