<?php

namespace App\Http\Resources\Events;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VenueResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'address' => $this->full_address,
            'bairro' => $this->when($this->relationLoaded('bairro'), [
                'id' => $this->bairro?->id,
                'nome' => $this->bairro?->nome,
            ]),
            'geo' => $this->geo,
            'capacity' => $this->capacity,
            'phone' => $this->phone,
            'website' => $this->website,
        ];
    }
}
