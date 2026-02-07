<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\TrashSchedule;
use App\Support\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Trash Schedule Controller
 * 
 * API endpoints for garbage collection schedules.
 */
class TrashScheduleController extends Controller
{
    /**
     * List all trash schedules for current tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $query = TrashSchedule::query()
            ->active()
            ->ordered();

        // Filter by bairro (includes schedules with null bairro_id)
        if ($request->has('bairro_id')) {
            $query->forBairro($request->bairro_id);
        }

        // Filter by type
        if ($request->has('type')) {
            $query->byType($request->type);
        }

        $schedules = $query->get()->map(fn($schedule) => [
            'id' => $schedule->id,
            'type' => $schedule->type,
            'name' => $schedule->name,
            'icon' => $schedule->icon,
            'color' => $schedule->color,
            'daysOfWeek' => $schedule->days_of_week,
            'daysString' => $schedule->days_string,
            'startTime' => $schedule->start_time,
            'endTime' => $schedule->end_time,
            'notes' => $schedule->notes,
            'isToday' => $schedule->isToday(),
            'bairroId' => $schedule->bairro_id,
        ]);

        return response()->json([
            'success' => true,
            'data' => $schedules,
            'meta' => [
                'city' => Tenant::citySlug(),
                'count' => $schedules->count(),
            ],
        ]);
    }

    /**
     * Get schedules for today.
     */
    public function today(Request $request): JsonResponse
    {
        $schedules = TrashSchedule::query()
            ->active()
            ->ordered()
            ->get()
            ->filter(fn($s) => $s->isToday())
            ->map(fn($schedule) => [
                'id' => $schedule->id,
                'type' => $schedule->type,
                'name' => $schedule->name,
                'icon' => $schedule->icon,
                'color' => $schedule->color,
                'startTime' => $schedule->start_time,
                'endTime' => $schedule->end_time,
            ])
            ->values();

        return response()->json([
            'success' => true,
            'data' => $schedules,
        ]);
    }
}
