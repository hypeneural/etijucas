<?php

namespace App\Http\Controllers\Api\Forum;

use App\Http\Controllers\Controller;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TopicLikeController extends Controller
{
    /**
     * Toggle like/unlike on a topic.
     * 
     * POST /api/v1/forum/topics/{topic}/like
     */
    public function toggle(Request $request, Topic $topic): JsonResponse
    {
        $user = $request->user();

        // Check if already liked
        $isLiked = $topic->likes()->where('user_id', $user->id)->exists();

        if ($isLiked) {
            // Unlike
            $topic->likes()->detach($user->id);
            $topic->decrementLikes();
            $liked = false;
        } else {
            // Like
            $topic->likes()->attach($user->id);
            $topic->incrementLikes();
            $liked = true;
        }

        return response()->json([
            'liked' => $liked,
            'likesCount' => $topic->fresh()->likes_count,
        ]);
    }
}
