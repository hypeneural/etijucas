<?php

declare(strict_types=1);

namespace App\Domains\Votes\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VotoRegistroResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'voto' => $this->voto->value,
            'votoLabel' => $this->voto->label(),
            'votoColor' => $this->voto->color(),
            'justificativa' => $this->justificativa,
            'urlVideo' => $this->url_video,
            'vereador' => new VereadorListResource($this->whenLoaded('vereador')),
        ];
    }
}
