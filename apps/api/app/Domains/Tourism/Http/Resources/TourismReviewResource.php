<?php

namespace App\Domains\Tourism\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TourismReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'spotId' => $this->spot_id,
            'rating' => $this->rating,
            'titulo' => $this->titulo,
            'texto' => $this->texto,
            'fotos' => $this->fotos ?? [],
            'visitDate' => $this->visit_date?->format('Y-m'),
            'likesCount' => $this->likes_count,
            'liked' => false, // TODO: implement review likes

            'autor' => [
                'id' => $this->user->id,
                'nome' => $this->user->name,
                'avatarUrl' => $this->user->avatar_url,
                'reviewsCount' => $this->user->tourismReviews()->count(),
            ],

            'createdAt' => $this->created_at->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
