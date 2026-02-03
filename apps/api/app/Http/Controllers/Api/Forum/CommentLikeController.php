<?php

namespace App\Http\Controllers\Api\Forum;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentLikeController extends Controller
{
    /**
     * Toggle like/unlike on a comment.
     * 
     * POST /api/v1/forum/comments/{comment}/like
     */
    public function toggle(Request $request, Comment $comment): JsonResponse
    {
        $user = $request->user();

        // Check if already liked
        $isLiked = $comment->likes()->where('user_id', $user->id)->exists();

        if ($isLiked) {
            // Unlike
            $comment->likes()->detach($user->id);
            $comment->decrementLikes();
            $liked = false;
        } else {
            // Like
            $comment->likes()->attach($user->id);
            $comment->incrementLikes();
            $liked = true;
        }

        return response()->json([
            'liked' => $liked,
            'likesCount' => $comment->fresh()->likes_count,
        ]);
    }
}
