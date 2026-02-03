<?php

namespace App\Http\Controllers\Api\Events;

use App\Domain\Events\Enums\RsvpStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Events\EventCollection;
use App\Http\Resources\Events\EventListResource;
use App\Models\Event;
use App\Models\EventRsvp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserEventController extends Controller
{
    /**
     * Get events the user has RSVP'd to.
     *
     * GET /api/v1/users/me/events
     */
    public function myEvents(Request $request): JsonResponse
    {
        $user = $request->user();
        $status = $request->input('status', 'going');
        $timeframe = $request->input('timeframe', 'upcoming');

        $query = $user->eventRsvps()
            ->with(['event.category', 'event.venue.bairro', 'event.ticket'])
            ->latest();

        // Filter by RSVP status
        if ($status !== 'all') {
            $rsvpStatus = RsvpStatus::tryFrom($status);
            if ($rsvpStatus) {
                $query->where('status', $rsvpStatus);
            }
        }

        // Filter by timeframe
        $query->whereHas('event', function ($q) use ($timeframe) {
            $q->published();

            match ($timeframe) {
                'upcoming' => $q->where('end_datetime', '>=', now()),
                'past' => $q->where('end_datetime', '<', now()),
                default => null,
            };
        });

        $perPage = min($request->input('perPage', 15), 50);
        $rsvps = $query->paginate($perPage);

        $events = $rsvps->getCollection()->map(fn($rsvp) => [
            'event' => new EventListResource($rsvp->event),
            'rsvp' => [
                'status' => $rsvp->status->value,
                'guestsCount' => $rsvp->guests_count,
                'createdAt' => $rsvp->created_at?->toIso8601String(),
            ],
        ]);

        return response()->json([
            'data' => $events,
            'meta' => [
                'total' => $rsvps->total(),
                'page' => $rsvps->currentPage(),
                'perPage' => $rsvps->perPage(),
                'lastPage' => $rsvps->lastPage(),
            ],
            'success' => true,
        ]);
    }

    /**
     * Get user's favorite events.
     *
     * GET /api/v1/users/me/favorites/events
     */
    public function myFavorites(Request $request): JsonResponse
    {
        $user = $request->user();
        $timeframe = $request->input('timeframe', 'upcoming');

        $query = Event::query()
            ->with(['category', 'venue.bairro', 'ticket'])
            ->published()
            ->whereHas('favorites', fn($q) => $q->where('user_id', $user->id))
            ->withUserInteractions($user->id);

        // Filter by timeframe
        match ($timeframe) {
            'upcoming' => $query->where('end_datetime', '>=', now()),
            'past' => $query->where('end_datetime', '<', now()),
            default => null,
        };

        $query->orderBy('start_datetime');

        $perPage = min($request->input('perPage', 15), 50);
        $events = $query->paginate($perPage);

        return response()->json([
            'data' => EventListResource::collection($events),
            'meta' => [
                'total' => $events->total(),
                'page' => $events->currentPage(),
                'perPage' => $events->perPage(),
                'lastPage' => $events->lastPage(),
            ],
            'success' => true,
        ]);
    }
}
