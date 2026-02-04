<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckInController extends Controller
{
    /**
     * POST /api/v1/user/check-in
     * 
     * Perform a daily check-in for the authenticated user.
     * This is part of the gamification system to encourage daily app usage.
     */
    public function checkIn(Request $request): JsonResponse
    {
        $user = $request->user();
        $streak = $user->getOrCreateStreak();

        $result = $streak->performCheckIn();

        return response()->json([
            'success' => true,
            'message' => $this->getCheckInMessage($result),
            'data' => [
                'streak' => $result,
            ],
        ]);
    }

    /**
     * GET /api/v1/user/streak
     * 
     * Get the current user's streak data without checking in.
     */
    public function getStreak(Request $request): JsonResponse
    {
        $user = $request->user();
        $streak = $user->getOrCreateStreak();

        return response()->json([
            'success' => true,
            'data' => [
                'streak' => $streak->getStreakData(),
            ],
        ]);
    }

    /**
     * Generate a motivational message based on streak status.
     */
    private function getCheckInMessage(array $result): string
    {
        if ($result['is_milestone']) {
            $milestoneMessages = [
                7 => '🎉 1 semana! Você é dedicado!',
                14 => '🔥 2 semanas seguidas! Continue assim!',
                30 => '🏆 1 mês! Você é um verdadeiro Tijucano!',
                60 => '⭐ 2 meses! Impressionante!',
                90 => '💎 3 meses! Você é lenda!',
                180 => '👑 6 meses! Cidadão exemplar!',
                365 => '🎊 1 ANO! Você é incrível!',
            ];
            return $milestoneMessages[$result['milestone_value']] ?? '🎉 Marco alcançado!';
        }

        if ($result['checked_in_today'] && $result['current'] === 1) {
            return 'Primeiro dia! Continue amanhã para aumentar seu streak.';
        }

        if ($result['current'] > 1) {
            return "🔥 Dia {$result['current']} acompanhando Tijucas!";
        }

        return 'Check-in realizado!';
    }
}
