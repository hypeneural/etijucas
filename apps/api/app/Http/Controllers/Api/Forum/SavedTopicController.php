<?php

namespace App\Http\Controllers\Api\Forum;

use App\Http\Controllers\Controller;
use App\Http\Resources\TopicCollection;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavedTopicController extends Controller
{
    /**
     * Toggle save/unsave on a topic.
     * 
     * POST /api/v1/forum/topics/{topic}/save
     */
    public function toggle(Request $request, Topic $topic): JsonResponse
    {
        $user = $request->user();

        // Check if already saved
        $isSaved = $topic->saves()->where('user_id', $user->id)->exists();

        if ($isSaved) {
            // Unsave
            $topic->saves()->detach($user->id);
            $saved = false;
        } else {
            // Save
            $topic->saves()->attach($user->id);
            $saved = true;
        }

        return response()->json([
            'saved' => $saved,
        ]);
    }

    /**
     * List saved topics for authenticated user.
     * 
     * GET /api/v1/forum/saved
     */
    public function index(Request $request): TopicCollection
    {
        $user = $request->user();

        $query = Topic::query()
            ->whereHas('saves', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->with(['user', 'bairro'])
            ->active()
            ->withUserInteractions($user->id)
            ->orderBy('created_at', 'desc');

        $perPage = min($request->input('perPage', 15), 50);
        $topics = $query->paginate($perPage);

        return new TopicCollection($topics);
    }
}
