<?php

declare(strict_types=1);

namespace App\Domains\Votes\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VereadorListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $mandatoAtual = $this->mandatoAtual;

        return [
            'id' => $this->id,
            'nome' => $this->nome,
            'slug' => $this->slug,
            'fotoUrl' => $this->foto_url,
            'ativo' => $this->ativo,
            'partido' => $mandatoAtual?->partido ? [
                'sigla' => $mandatoAtual->partido->sigla,
                'corHex' => $mandatoAtual->partido->cor_hex,
            ] : null,
            'cargo' => $mandatoAtual?->cargo,
            'emExercicio' => $mandatoAtual?->em_exercicio ?? false,
        ];
    }
}
