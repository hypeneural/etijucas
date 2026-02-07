<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MassSchedule;
use App\Support\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Mass Schedule Controller
 * 
 * API endpoints for church mass times.
 */
class MassScheduleController extends Controller
{
    /**
     * List all mass schedules for current tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $query = MassSchedule::query()
            ->active()
            ->ordered();

        // Filter by day type
        if ($request->has('day_type')) {
            $query->byDayType($request->day_type);
        }

        // Filter by bairro
        if ($request->has('bairro_id')) {
            $query->where('bairro_id', $request->bairro_id);
        }

        $schedules = $query->get()->map(fn($schedule) => [
            'id' => $schedule->id,
            'churchName' => $schedule->church_name,
            'address' => $schedule->address,
            'phone' => $schedule->phone,
            'dayType' => $schedule->day_type,
            'dayTypeLabel' => $schedule->day_type_label,
            'times' => $schedule->times,
            'timesString' => $schedule->times_string,
            'notes' => $schedule->notes,
            'location' => $schedule->lat && $schedule->lon ? [
                'lat' => (float) $schedule->lat,
                'lon' => (float) $schedule->lon,
            ] : null,
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
     * Get masses for today based on day of week.
     */
    public function today(Request $request): JsonResponse
    {
        $schedules = MassSchedule::query()
            ->active()
            ->forToday()
            ->ordered()
            ->get()
            ->map(fn($schedule) => [
                'id' => $schedule->id,
                'churchName' => $schedule->church_name,
                'times' => $schedule->times,
                'address' => $schedule->address,
            ]);

        return response()->json([
            'success' => true,
            'data' => $schedules,
            'meta' => [
                'dayType' => now()->isSunday() ? 'sunday' : (now()->isSaturday() ? 'saturday' : 'weekday'),
            ],
        ]);
    }

    /**
     * Get grouped schedules by church.
     */
    public function byChurch(Request $request): JsonResponse
    {
        $schedules = MassSchedule::query()
            ->active()
            ->ordered()
            ->get()
            ->groupBy('church_name')
            ->map(fn($group) => [
                'churchName' => $group->first()->church_name,
                'address' => $group->first()->address,
                'phone' => $group->first()->phone,
                'location' => $group->first()->lat && $group->first()->lon ? [
                    'lat' => (float) $group->first()->lat,
                    'lon' => (float) $group->first()->lon,
                ] : null,
                'schedules' => $group->map(fn($s) => [
                    'dayType' => $s->day_type,
                    'dayTypeLabel' => $s->day_type_label,
                    'times' => $s->times,
                ])->values(),
            ])
            ->values();

        return response()->json([
            'success' => true,
            'data' => $schedules,
        ]);
    }
}
