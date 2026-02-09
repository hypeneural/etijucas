<?php

namespace App\Http\Controllers\Api\Forum;

use App\Domain\Forum\Enums\ReactionType;
use App\Http\Controllers\Controller;
use App\Models\Topic;
use App\Models\TopicReaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Enum;

/**
 * TopicReactionController
 * 
 * Handles "Eu vi também" (confirm) and "Apoiar" (support) reactions on topics.
 */
class TopicReactionController extends Controller
{
    /**
     * Toggle reaction on a topic.
     * 
     * POST /api/v1/forum/topics/{topic}/react
     * Body: { "type": "confirm" | "support" }
     */
    public function toggle(Request $request, Topic $topic): JsonResponse
    {
        $request->validate([
            'type' => ['required', new Enum(ReactionType::class)],
        ]);

        $user = $request->user();
        $type = ReactionType::from($request->input('type'));

        // Check if reaction already exists
        $existing = TopicReaction::where('topic_id', $topic->id)
            ->where('user_id', $user->id)
            ->where('type', $type)
            ->first();

        if ($existing) {
            // Remove reaction
            $existing->delete();
            $this->decrementCount($topic, $type);
            $reacted = false;
        } else {
            // Add reaction
            TopicReaction::create([
                'topic_id' => $topic->id,
                'user_id' => $user->id,
                'type' => $type,
            ]);
            $this->incrementCount($topic, $type);
            $reacted = true;
        }

        $topic->refresh();

        return response()->json([
            'reacted' => $reacted,
            'type' => $type->value,
            'confirmsCount' => $topic->confirms_count,
            'supportsCount' => $topic->supports_count,
        ]);
    }

    /**
     * Get current user's reactions on a topic.
     * 
     * GET /api/v1/forum/topics/{topic}/reactions
     */
    public function show(Request $request, Topic $topic): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'confirmed' => false,
                'supported' => false,
                'confirmsCount' => $topic->confirms_count,
                'supportsCount' => $topic->supports_count,
            ]);
        }

        $reactions = TopicReaction::where('topic_id', $topic->id)
            ->where('user_id', $user->id)
            ->pluck('type')
            ->map(fn($t) => $t->value)
            ->toArray();

        return response()->json([
            'confirmed' => in_array('confirm', $reactions),
            'supported' => in_array('support', $reactions),
            'confirmsCount' => $topic->confirms_count,
            'supportsCount' => $topic->supports_count,
        ]);
    }

    private function incrementCount(Topic $topic, ReactionType $type): void
    {
        match ($type) {
            ReactionType::Confirm => $topic->increment('confirms_count'),
            ReactionType::Support => $topic->increment('supports_count'),
        };
    }

    private function decrementCount(Topic $topic, ReactionType $type): void
    {
        match ($type) {
            ReactionType::Confirm => $topic->decrement('confirms_count'),
            ReactionType::Support => $topic->decrement('supports_count'),
        };
    }
}
