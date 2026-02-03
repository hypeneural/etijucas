<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
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
            'topicId' => $this->topic_id,
            'parentId' => $this->parent_id,
            'texto' => $this->deleted_at ? 'Comentário removido' : $this->texto,
            'imageUrl' => $this->deleted_at ? null : $this->image_url,
            'isAnon' => $this->is_anon,
            'likesCount' => $this->likes_count,
            'depth' => $this->depth,

            // User-specific fields
            'liked' => $this->when(
                $user,
                fn() => $this->liked ?? $this->likes()->where('user_id', $user?->id)->exists(),
                false
            ),

            // Author
            'autor' => $this->getAutor($request),

            // Nested replies (recursive)
            'replies' => CommentResource::collection($this->whenLoaded('allReplies')),
            'repliesCount' => $this->replies_count ?? $this->replies()->count(),

            // Timestamps
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }

    protected function getAutor(Request $request): array
    {
        $user = $request->user();
        $isOwnComment = $user && $user->id === $this->user_id;
        $canSeeAuthor = $isOwnComment || ($user && $user->hasAnyRole(['admin', 'moderator']));

        // If comment is anonymous and viewer shouldn't see author
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
