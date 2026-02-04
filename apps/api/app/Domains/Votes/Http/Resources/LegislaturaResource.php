<?php

declare(strict_types=1);

namespace App\Domains\Votes\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LegislaturaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'numero' => $this->numero,
            'anoInicio' => $this->ano_inicio,
            'anoFim' => $this->ano_fim,
            'atual' => $this->atual,
            'periodo' => $this->periodo,
            'nomeCompleto' => $this->nome_completo,
        ];
    }
}
