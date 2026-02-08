<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * UserCityProfile Resource
 *
 * Transforms UserCityProfile model for API responses.
 */
class UserCityProfileResource extends JsonResource
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
            'city_id' => $this->city_id,
            'bairro_id' => $this->bairro_id,
            'bairro' => $this->whenLoaded('bairro', fn() => [
                'id' => $this->bairro->id,
                'nome' => $this->bairro->nome,
                'slug' => $this->bairro->slug,
            ]),
            'profile_completed' => $this->profile_completed,
            'notification_prefs' => $this->notification_prefs,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
