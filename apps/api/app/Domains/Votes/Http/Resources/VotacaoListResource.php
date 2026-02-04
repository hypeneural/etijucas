<?php

declare(strict_types=1);

namespace App\Domains\Votes\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VotacaoListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'protocolo' => $this->protocolo,
            'titulo' => $this->titulo,
            'subtitulo' => $this->subtitulo,
            'tipo' => $this->tipo,
            'status' => $this->status->value,
            'statusLabel' => $this->status->label(),
            'data' => $this->data->format('Y-m-d'),
            'tags' => $this->tags ?? [],
            'counts' => [
                'sim' => $this->votos_sim,
                'nao' => $this->votos_nao,
                'abstencao' => $this->votos_abstencao,
                'naoVotou' => $this->votos_ausente,
            ],
            'resultado' => $this->resultado,
        ];
    }
}
