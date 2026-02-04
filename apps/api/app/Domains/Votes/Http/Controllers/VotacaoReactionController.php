<?php

declare(strict_types=1);

namespace App\Domains\Votes\Http\Controllers;

use App\Domains\Votes\Models\Votacao;
use App\Domains\Votes\Models\VotacaoReaction;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VotacaoReactionController extends Controller
{
    /**
     * POST /api/v1/votacoes/{votacao}/reaction
     * Toggle like/dislike on a voting session
     */
    public function toggle(Request $request, Votacao $votacao): JsonResponse
    {
        $validated = $request->validate([
            'reaction' => 'required|in:like,dislike',
        ]);

        $user = $request->user();
        $reactionType = $validated['reaction'];

        // Check if user already has a reaction
        $existingReaction = $votacao->reactions()
            ->where('user_id', $user->id)
            ->first();

        $message = '';
        $action = ''; // 'added', 'removed', 'changed'

        DB::transaction(function () use ($votacao, $user, $reactionType, $existingReaction, &$message, &$action) {
            if ($existingReaction) {
                if ($existingReaction->reaction === $reactionType) {
                    // Same reaction: toggle off (remove)
                    $existingReaction->delete();

                    if ($reactionType === 'like') {
                        $votacao->decrement('likes_count');
                    } else {
                        $votacao->decrement('dislikes_count');
                    }

                    $message = 'Reação removida';
                    $action = 'removed';
                } else {
                    // Different reaction: switch
                    $oldReaction = $existingReaction->reaction;
                    $existingReaction->update(['reaction' => $reactionType]);

                    if ($oldReaction === 'like') {
                        $votacao->decrement('likes_count');
                    } else {
                        $votacao->decrement('dislikes_count');
                    }

                    if ($reactionType === 'like') {
                        $votacao->increment('likes_count');
                    } else {
                        $votacao->increment('dislikes_count');
                    }

                    $message = 'Reação atualizada';
                    $action = 'changed';
                }
            } else {
                // No reaction: add
                $votacao->reactions()->create([
                    'user_id' => $user->id,
                    'reaction' => $reactionType,
                ]);

                if ($reactionType === 'like') {
                    $votacao->increment('likes_count');
                } else {
                    $votacao->increment('dislikes_count');
                }

                $message = 'Reação adicionada';
                $action = 'added';
            }
        });

        // Refresh votação to get updated counts
        $votacao->refresh();

        return response()->json([
            'success' => true,
            'message' => $message,
            'action' => $action,
            'user_reaction' => $action === 'removed' ? null : $reactionType,
            'likes_count' => $votacao->likes_count,
            'dislikes_count' => $votacao->dislikes_count,
        ]);
    }
}
