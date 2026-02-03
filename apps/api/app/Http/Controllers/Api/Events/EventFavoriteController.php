<?php

namespace App\Http\Controllers\Api\Events;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventFavoriteController extends Controller
{
    /**
     * Toggle event favorite status.
     *
     * POST /api/v1/events/{event}/favorite
     */
    public function toggle(Request $request, Event $event): JsonResponse
    {
        $user = $request->user();

        $isFavorited = $event->favorites()
            ->where('user_id', $user->id)
            ->exists();

        if ($isFavorited) {
            $event->favorites()->detach($user->id);
            $message = 'Evento removido dos favoritos.';
        } else {
            $event->favorites()->attach($user->id, [
                'created_at' => now(),
            ]);
            $message = 'Evento adicionado aos favoritos! ⭐';
        }

        return response()->json([
            'data' => [
                'isFavorited' => !$isFavorited,
            ],
            'success' => true,
            'message' => $message,
        ]);
    }
}
