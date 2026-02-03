<?php

namespace App\Http\Controllers\Admin;

use App\Domain\Forum\Enums\TopicStatus;
use App\Http\Controllers\Controller;
use App\Models\Topic;
use App\Models\User;
use App\Models\UserRestriction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminForumController extends Controller
{
    /**
     * Hide a topic (moderation).
     * 
     * POST /api/v1/admin/forum/topics/{topic}/hide
     */
    public function hideTopic(Request $request, Topic $topic): JsonResponse
    {
        $request->validate([
            'motivo' => ['required', 'string', 'max:500'],
        ], [
            'motivo.required' => 'O motivo é obrigatório.',
        ]);

        $this->authorize('hide', $topic);

        $topic->update(['status' => TopicStatus::Hidden]);

        // Log activity
        activity()
            ->causedBy($request->user())
            ->performedOn($topic)
            ->withProperties([
                'motivo' => $request->input('motivo'),
            ])
            ->log('topic_hidden');

        return response()->json([
            'success' => true,
            'message' => 'Tópico ocultado',
        ]);
    }

    /**
     * Suspend a user from the forum.
     * 
     * POST /api/v1/admin/forum/users/{user}/suspend
     */
    public function suspendUser(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'duracao' => ['required', 'in:24h,7d,30d,permanente'],
            'motivo' => ['required', 'string', 'max:500'],
        ], [
            'duracao.required' => 'A duração é obrigatória.',
            'duracao.in' => 'Duração inválida.',
            'motivo.required' => 'O motivo é obrigatório.',
        ]);

        $duracao = $request->input('duracao');
        $expiresAt = match ($duracao) {
            '24h' => now()->addHours(24),
            '7d' => now()->addDays(7),
            '30d' => now()->addDays(30),
            'permanente' => null,
        };

        // Create or update user restriction
        UserRestriction::updateOrCreate(
            [
                'user_id' => $user->id,
                'type' => 'forum_suspension',
            ],
            [
                'reason' => $request->input('motivo'),
                'expires_at' => $expiresAt,
                'created_by' => $request->user()->id,
            ]
        );

        // Log activity
        activity()
            ->causedBy($request->user())
            ->performedOn($user)
            ->withProperties([
                'duracao' => $duracao,
                'motivo' => $request->input('motivo'),
            ])
            ->log('forum_user_suspended');

        return response()->json([
            'success' => true,
            'message' => "Usuário suspenso do fórum por {$duracao}",
        ]);
    }
}
