<?php

declare(strict_types=1);

namespace App\Domains\Votes\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MandatoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'cargo' => $this->cargo,
            'inicio' => $this->inicio?->format('Y-m-d'),
            'fim' => $this->fim?->format('Y-m-d'),
            'emExercicio' => $this->em_exercicio,
            'partido' => new PartidoResource($this->whenLoaded('partido')),
            'legislatura' => new LegislaturaResource($this->whenLoaded('legislatura')),
        ];
    }
}
