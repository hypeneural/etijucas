<?php

declare(strict_types=1);

namespace App\Domains\Votes\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VereadorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nome' => $this->nome,
            'slug' => $this->slug,
            'nascimento' => $this->nascimento?->format('Y-m-d'),
            'idade' => $this->idade,
            'telefone' => $this->telefone,
            'email' => $this->email,
            'fotoUrl' => $this->foto_url,
            'bio' => $this->bio,
            'redesSociais' => $this->redes_sociais,
            'siteOficialUrl' => $this->site_oficial_url,
            'ativo' => $this->ativo,

            // Mandato atual
            'mandatoAtual' => new MandatoResource($this->whenLoaded('mandatoAtual')),

            // Histórico de mandatos
            'mandatos' => MandatoResource::collection($this->whenLoaded('mandatos')),

            // Estatísticas de votação
            'estatisticas' => $this->when(
                $this->relationLoaded('votos'),
                fn() => $this->estatisticas
            ),
        ];
    }
}
