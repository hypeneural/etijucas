<?php

namespace App\Http\Controllers\Api\Forum;

use App\Http\Controllers\Controller;
use App\Http\Requests\Forum\ReportRequest;
use App\Models\Comment;
use App\Models\CommentReport;
use App\Models\Topic;
use App\Models\TopicReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Report a topic.
     * 
     * POST /api/v1/forum/topics/{topic}/report
     */
    public function reportTopic(ReportRequest $request, Topic $topic): JsonResponse
    {
        $user = $request->user();

        // Check if user already reported this topic
        $existingReport = TopicReport::where('user_id', $user->id)
            ->where('topic_id', $topic->id)
            ->first();

        if ($existingReport) {
            return response()->json([
                'message' => 'Você já denunciou este tópico.',
            ], 409);
        }

        $validated = $request->validated();

        TopicReport::create([
            'topic_id' => $topic->id,
            'user_id' => $user->id,
            'motivo' => $validated['motivo'],
            'descricao' => $validated['descricao'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Denúncia enviada. Nossa equipe irá analisar.',
        ]);
    }

    /**
     * Report a comment.
     * 
     * POST /api/v1/forum/comments/{comment}/report
     */
    public function reportComment(ReportRequest $request, Comment $comment): JsonResponse
    {
        $user = $request->user();

        // Check if user already reported this comment
        $existingReport = CommentReport::where('user_id', $user->id)
            ->where('comment_id', $comment->id)
            ->first();

        if ($existingReport) {
            return response()->json([
                'message' => 'Você já denunciou este comentário.',
            ], 409);
        }

        $validated = $request->validated();

        CommentReport::create([
            'comment_id' => $comment->id,
            'user_id' => $user->id,
            'motivo' => $validated['motivo'],
            'descricao' => $validated['descricao'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Denúncia enviada. Nossa equipe irá analisar.',
        ]);
    }
}
