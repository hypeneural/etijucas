<?php

declare(strict_types=1);

namespace App\Domains\Votes\Http\Controllers;

use App\Domains\Votes\Models\Votacao;
use App\Http\Controllers\Controller;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VotacaoCommentController extends Controller
{
    /**
     * GET /api/v1/votacoes/{votacao}/comments
     * List comments for a voting session (PUBLIC)
     */
    public function index(Request $request, Votacao $votacao): JsonResponse
    {
        $query = $votacao->comments()
            ->with(['user', 'allReplies.user'])
            ->whereNull('parent_id');

        // User liked status
        if ($request->user()) {
            $query->withUserLiked($request->user()->id);
        }

        // Ordering
        $orderBy = $request->input('orderBy', 'createdAt');
        $order = $request->input('order', 'desc');

        $query = match ($orderBy) {
            'likesCount' => $query->orderBy('likes_count', $order),
            default => $query->orderBy('created_at', $order),
        };

        $comments = $query->get();

        return response()->json([
            'success' => true,
            'data' => CommentResource::collection($comments),
            'meta' => [
                'total' => $comments->count(),
            ],
        ]);
    }

    /**
     * POST /api/v1/votacoes/{votacao}/comments
     * Create a comment on a voting session (AUTH REQUIRED)
     */
    public function store(Request $request, Votacao $votacao): JsonResponse
    {
        $validated = $request->validate([
            'texto' => 'required|string|max:1000',
            'parentId' => 'nullable|uuid|exists:comments,id',
            'isAnon' => 'boolean',
            'imageUrl' => 'nullable|url|max:500',
        ]);

        // Calculate depth based on parent
        $depth = 0;
        $parentId = $validated['parentId'] ?? null;

        if ($parentId) {
            $parent = Comment::find($parentId);
            if ($parent) {
                $depth = min($parent->depth + 1, Comment::MAX_DEPTH);
            }
        }

        $comment = Comment::create([
            'commentable_type' => Votacao::class,
            'commentable_id' => $votacao->id,
            'user_id' => $request->user()->id,
            'parent_id' => $parentId,
            'texto' => $validated['texto'],
            'image_url' => $validated['imageUrl'] ?? null,
            'is_anon' => $validated['isAnon'] ?? false,
            'depth' => $depth,
        ]);

        $comment->load('user');

        return response()->json([
            'success' => true,
            'data' => new CommentResource($comment),
            'message' => 'Comentário adicionado',
        ], 201);
    }

    /**
     * POST /api/v1/votacoes/{votacao}/comments/{comment}/like
     * Toggle like on a comment (AUTH REQUIRED)
     */
    public function like(Request $request, Votacao $votacao, Comment $comment): JsonResponse
    {
        // Ensure comment belongs to this votação
        if ($comment->commentable_id !== $votacao->id || $comment->commentable_type !== Votacao::class) {
            return response()->json([
                'success' => false,
                'message' => 'Comentário não encontrado nesta votação',
            ], 404);
        }

        $user = $request->user();
        $liked = $comment->likes()->where('user_id', $user->id)->exists();

        if ($liked) {
            $comment->likes()->detach($user->id);
            $comment->decrementLikes();
            $message = 'Curtida removida';
        } else {
            $comment->likes()->attach($user->id);
            $comment->incrementLikes();
            $message = 'Curtida adicionada';
        }

        return response()->json([
            'success' => true,
            'liked' => !$liked,
            'likesCount' => $comment->fresh()->likes_count,
            'message' => $message,
        ]);
    }

    /**
     * DELETE /api/v1/votacoes/{votacao}/comments/{comment}
     * Delete a comment (AUTH REQUIRED - owner or admin)
     */
    public function destroy(Request $request, Votacao $votacao, Comment $comment): JsonResponse
    {
        // Ensure comment belongs to this votação
        if ($comment->commentable_id !== $votacao->id || $comment->commentable_type !== Votacao::class) {
            return response()->json([
                'success' => false,
                'message' => 'Comentário não encontrado nesta votação',
            ], 404);
        }

        $user = $request->user();

        // Check if user owns the comment or is admin
        if ($comment->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Você não tem permissão para remover este comentário',
            ], 403);
        }

        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Comentário removido',
        ]);
    }
}
