<?php

namespace App\Http\Resources\{{Feature}};

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class {{Model}}Resource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
{{resourceFields}}
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
