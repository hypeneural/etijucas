<?php

namespace App\Domains\Tourism\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TourismSpotResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();

        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'slug' => $this->slug,
            'descCurta' => $this->desc_curta,
            'descLonga' => $this->when($request->routeIs('tourism.show'), $this->desc_longa),

            // Categorization
            'categoria' => $this->categoria,
            'tags' => $this->tags ?? [],

            // Media
            'imageUrl' => $this->image_url,
            'gallery' => $this->when($request->routeIs('tourism.show'), $this->gallery ?? []),
            'videoUrl' => $this->when($request->routeIs('tourism.show'), $this->video_url),

            // Location
            'endereco' => $this->endereco,
            'bairroId' => $this->bairro_id,
            'bairroNome' => $this->whenLoaded('bairro', fn() => $this->bairro->nome),
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'comoChegar' => $this->when($request->routeIs('tourism.show'), $this->como_chegar),

            // Hours and Contact
            'horarios' => $this->when($request->routeIs('tourism.show'), $this->horarios ?? []),
            'telefone' => $this->telefone,
            'whatsapp' => $this->whatsapp,
            'website' => $this->when($request->routeIs('tourism.show'), $this->website),
            'instagram' => $this->when($request->routeIs('tourism.show'), $this->instagram),

            // Ratings and Stats
            'rating' => (float) $this->rating_avg,
            'reviewsCount' => $this->reviews_count,
            'likesCount' => $this->likes_count,
            'viewsCount' => $this->when($request->routeIs('tourism.show'), $this->views_count),

            // User interactions (only if authenticated)
            'liked' => $user ? $this->isLikedBy($user) : false,
            'isSaved' => $user ? $this->isSavedBy($user) : false,

            // Extra info
            'preco' => $this->preco,
            'duracao' => $this->duracao,
            'dificuldade' => $this->dificuldade,
            'acessibilidade' => $this->when($request->routeIs('tourism.show'), $this->acessibilidade ?? []),
            'dicasVisita' => $this->when($request->routeIs('tourism.show'), $this->dicas_visita ?? []),

            // Flags
            'isDestaque' => $this->is_destaque,
            'isVerificado' => $this->is_verificado,

            // Metadata
            'createdAt' => $this->created_at->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),

            // Reviews (only on detail)
            'reviews' => $this->when(
                $request->routeIs('tourism.show') && $this->relationLoaded('reviews'),
                fn() => TourismReviewResource::collection($this->reviews->take(5))
            ),
        ];
    }
}
