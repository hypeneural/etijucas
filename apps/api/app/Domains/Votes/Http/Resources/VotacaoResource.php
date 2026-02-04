<?php

declare(strict_types=1);

namespace App\Domains\Votes\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VotacaoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'protocolo' => $this->protocolo,
            'titulo' => $this->titulo,
            'subtitulo' => $this->subtitulo,
            'descricao' => $this->descricao,
            'ementa' => $this->ementa,
            'tipo' => $this->tipo,
            'status' => $this->status->value,
            'statusLabel' => $this->status->label(),
            'statusColor' => $this->status->color(),
            'data' => $this->data->format('Y-m-d'),
            'sessao' => $this->sessao,
            'urlFonte' => $this->url_fonte,
            'urlDocumento' => $this->url_documento,
            'tags' => $this->tags ?? [],
            'counts' => [
                'sim' => $this->votos_sim,
                'nao' => $this->votos_nao,
                'abstencao' => $this->votos_abstencao,
                'naoVotou' => $this->votos_ausente,
            ],
            'totalVotos' => $this->total_votos,
            'resultado' => $this->resultado,

            // Engajamento
            'likesCount' => $this->likes_count ?? 0,
            'dislikesCount' => $this->dislikes_count ?? 0,
            'commentsCount' => $this->comments_count ?? 0,
            'userReaction' => $this->whenLoaded('reactions', function () {
                return $this->reactions->first()?->reaction ?? null;
            }),

            // Votos individuais
            'votos' => VotoRegistroResource::collection($this->whenLoaded('votos')),
        ];
    }
}
