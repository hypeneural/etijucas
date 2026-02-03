<?php

namespace App\Http\Resources;

use App\Domain\Forum\Enums\TopicCategory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TopicResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $request->user();

        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'texto' => $this->texto,
            'categoria' => $this->categoria->value,
            'categoriaLabel' => $this->categoria->label(),
            'categoriaColor' => $this->categoria->color(),
            'bairroId' => $this->bairro_id,
            'isAnon' => $this->is_anon,
            'fotoUrl' => $this->foto_url,
            'likesCount' => $this->likes_count,
            'commentsCount' => $this->comments_count,
            'status' => $this->status->value,

            // User-specific fields (computed if user is authenticated)
            'liked' => $this->when(
                $user,
                fn() => $this->liked ?? $this->likes()->where('user_id', $user?->id)->exists(),
                null
            ),
            'isSaved' => $this->when(
                $user,
                fn() => $this->is_saved ?? $this->saves()->where('user_id', $user?->id)->exists(),
                null
            ),

            // Author (hide if anonymous, but admins/moderators see full info)
            'autor' => $this->getAutor($request),

            // Bairro
            'bairro' => $this->when($this->relationLoaded('bairro'), [
                'id' => $this->bairro?->id,
                'nome' => $this->bairro?->nome,
            ]),

            // Timestamps
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }

    protected function getAutor(Request $request): array
    {
        $user = $request->user();
        $isOwnTopic = $user && $user->id === $this->user_id;
        $canSeeAuthor = $isOwnTopic || ($user && $user->hasAnyRole(['admin', 'moderator']));

        // If topic is anonymous and viewer shouldn't see author
        if ($this->is_anon && !$canSeeAuthor) {
            return [
                'id' => null,
                'nome' => 'Anônimo',
                'avatarUrl' => null,
            ];
        }

        return [
            'id' => $this->user?->id,
            'nome' => $this->user?->nome ?? 'Usuário',
            'avatarUrl' => $this->user?->avatar_url,
        ];
    }
}
