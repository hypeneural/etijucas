<?php

namespace App\Http\Resources\Events;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventListResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     * Optimized for list views with minimal data.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $request->user();

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'category' => $this->when($this->relationLoaded('category'), [
                'id' => $this->category?->id,
                'name' => $this->category?->name,
                'slug' => $this->category?->slug,
                'icon' => $this->category?->icon,
                'color' => $this->category?->color,
            ]),
            'tags' => $this->when(
                $this->relationLoaded('tags'),
                fn() => $this->tags->pluck('name')->toArray()
            ),
            'descriptionShort' => $this->description_short,
            'startDateTime' => $this->start_datetime?->toIso8601String(),
            'endDateTime' => $this->end_datetime?->toIso8601String(),
            'venue' => $this->when($this->relationLoaded('venue'), [
                'id' => $this->venue?->id,
                'name' => $this->venue?->name,
                'bairro' => $this->when($this->venue?->relationLoaded('bairro'), [
                    'id' => $this->venue?->bairro?->id,
                    'nome' => $this->venue?->bairro?->nome,
                ]),
            ]),
            'ticket' => $this->when($this->relationLoaded('ticket'), [
                'type' => $this->ticket?->ticket_type?->value,
                'minPrice' => (float) ($this->ticket?->min_price ?? 0),
                'maxPrice' => $this->ticket?->max_price ? (float) $this->ticket->max_price : null,
            ]),
            'coverImage' => $this->cover_image_url,
            'flags' => [
                'ageRating' => $this->age_rating?->value,
                'outdoor' => $this->is_outdoor,
                'accessibility' => $this->has_accessibility,
                'parking' => $this->has_parking,
            ],
            'rsvpCount' => $this->going_count ?? 0,
            'popularityScore' => $this->popularity_score,
            'isFeatured' => $this->is_featured,

            // User-specific fields (only if authenticated)
            'isFavorited' => $this->when(
                $user,
                fn() => $this->is_favorited ?? $this->isFavoritedBy($user?->id),
                null
            ),
            'userRsvpStatus' => $this->when(
                $user,
                fn() => $this->getUserRsvpStatus($user?->id)?->value,
                null
            ),
        ];
    }
}
