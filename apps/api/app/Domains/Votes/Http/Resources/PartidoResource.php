<?php

declare(strict_types=1);

namespace App\Domains\Votes\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PartidoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sigla' => $this->sigla,
            'nome' => $this->nome,
            'corHex' => $this->cor_hex,
            'logoUrl' => $this->logo_url,
        ];
    }
}
