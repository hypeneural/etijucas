<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * CityMinimalResource
 *
 * Minimal city data for caching on frontend.
 * Only includes fields needed for offline city detection.
 */
class CityMinimalResource extends JsonResource
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
            'slug' => $this->slug,
            'name' => $this->name,
            'uf' => $this->uf,
            'lat' => (float) $this->lat,
            'lon' => (float) $this->lon,
        ];
    }
}
