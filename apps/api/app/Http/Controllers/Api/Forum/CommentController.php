<?php

namespace App\Http\Controllers\Api\Forum;

use App\Http\Controllers\Controller;
use App\Http\Requests\Forum\StoreCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    /**
     * List comments for a topic with tree structure.
     * 
     * GET /api/v1/forum/topics/{topic}/comments
     */
    public function index(Request $request, Topic $topic): JsonResponse
    {
        $query = Comment::query()
            ->where('topic_id', $topic->id)
            ->with(['user', 'allReplies.user']);

        // User liked status
        if ($request->user()) {
            $query->withUserLiked($request->user()->id);
        }

        // Filter by parent (null = root comments only)
        if ($request->has('parentId')) {
            $parentId = $request->input('parentId');
            $query->where('parent_id', $parentId);
        } else {
            // Default: only root comments with their replies tree
            $query->root()->withRepliesTree();
        }

        // Ordering
        $orderBy = $request->input('orderBy', 'createdAt');
        $order = $request->input('order', 'asc');

        $query = match ($orderBy) {
            'likesCount' => $query->orderBy('likes_count', $order),
            default => $query->orderBy('created_at', $order),
        };

        // Pagination
        $perPage = min($request->input('perPage', 20), 50);
        $comments = $query->paginate($perPage);

        return response()->json([
            'data' => CommentResource::collection($comments->items()),
            'meta' => [
                'total' => $comments->total(),
                'page' => $comments->currentPage(),
                'perPage' => $comments->perPage(),
                'lastPage' => $comments->lastPage(),
                'from' => $comments->firstItem(),
                'to' => $comments->lastItem(),
            ],
        ]);
    }

    /**
     * Create a new comment.
     * 
     * POST /api/v1/forum/topics/{topic}/comments
     */
    public function store(StoreCommentRequest $request, Topic $topic): JsonResponse
    {
        $validated = $request->validated();

        // Calculate depth based on parent
        $depth = 0;
        $parentId = $validated['parentId'] ?? null;

        if ($parentId) {
            $parent = Comment::find($parentId);
            if ($parent) {
                // Max depth is 2, so if parent is at depth 2, new comment stays at 2
                $depth = min($parent->depth + 1, Comment::MAX_DEPTH);
            }
        }

        $comment = Comment::create([
            'topic_id' => $topic->id,
            'user_id' => $request->user()->id,
            'parent_id' => $parentId,
            'texto' => $validated['texto'],
            'image_url' => $validated['imageUrl'] ?? null,
            'is_anon' => $validated['isAnon'] ?? false,
            'depth' => $depth,
        ]);

        // Increment topic comments count
        $topic->incrementComments();

        $comment->load('user');

        return response()->json([
            'data' => new CommentResource($comment),
            'success' => true,
            'message' => 'Comentário adicionado',
        ], 201);
    }

    /**
     * Soft delete a comment.
     * 
     * DELETE /api/v1/forum/topics/{topic}/comments/{comment}
     */
    public function destroy(Request $request, Topic $topic, Comment $comment): JsonResponse
    {
        // Ensure comment belongs to topic
        if ($comment->topic_id !== $topic->id) {
            return response()->json([
                'message' => 'Comentário não encontrado neste tópico',
            ], 404);
        }

        $this->authorize('delete', $comment);

        // Soft delete (texto will show "Comentário removido" via Resource)
        $comment->delete();

        // Decrement topic comments count
        $topic->decrementComments();

        return response()->json([
            'success' => true,
            'message' => 'Comentário removido',
        ]);
    }
}
