<?php

namespace App\Http\Controllers\Api\Events;

use App\Domain\Events\Enums\RsvpStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Events\StoreRsvpRequest;
use App\Http\Requests\Events\UpdateRsvpRequest;
use App\Http\Resources\Events\EventRsvpResource;
use App\Models\Event;
use App\Models\EventRsvp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventRsvpController extends Controller
{
    /**
     * Get user's RSVP status for an event.
     *
     * GET /api/v1/events/{event}/rsvp
     */
    public function show(Request $request, Event $event): JsonResponse
    {
        $rsvp = $event->rsvps()
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$rsvp) {
            return response()->json([
                'data' => null,
                'success' => true,
                'message' => 'Você ainda não confirmou presença neste evento.',
            ]);
        }

        return response()->json([
            'data' => new EventRsvpResource($rsvp),
            'success' => true,
        ]);
    }

    /**
     * Create RSVP (confirm attendance).
     *
     * POST /api/v1/events/{event}/rsvp
     */
    public function store(StoreRsvpRequest $request, Event $event): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        // Check if user already has an RSVP
        $existingRsvp = $event->rsvps()
            ->where('user_id', $user->id)
            ->first();

        if ($existingRsvp) {
            return response()->json([
                'success' => false,
                'message' => 'Você já confirmou presença neste evento. Use PUT para atualizar.',
                'data' => new EventRsvpResource($existingRsvp),
            ], 409);
        }

        // Check if event is in the past
        if ($event->end_datetime->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Este evento já foi encerrado.',
            ], 422);
        }

        $rsvp = EventRsvp::create([
            'event_id' => $event->id,
            'user_id' => $user->id,
            'status' => $validated['status'],
            'guests_count' => $validated['guestsCount'] ?? 1,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'data' => new EventRsvpResource($rsvp),
            'success' => true,
            'message' => $this->getRsvpMessage($rsvp->status),
        ], 201);
    }

    /**
     * Update RSVP.
     *
     * PUT /api/v1/events/{event}/rsvp
     */
    public function update(UpdateRsvpRequest $request, Event $event): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $rsvp = $event->rsvps()
            ->where('user_id', $user->id)
            ->first();

        if (!$rsvp) {
            return response()->json([
                'success' => false,
                'message' => 'Você ainda não confirmou presença neste evento.',
            ], 404);
        }

        $updateData = [];

        if (isset($validated['status'])) {
            $updateData['status'] = $validated['status'];
        }
        if (isset($validated['guestsCount'])) {
            $updateData['guests_count'] = $validated['guestsCount'];
        }
        if (array_key_exists('notes', $validated)) {
            $updateData['notes'] = $validated['notes'];
        }

        $rsvp->update($updateData);

        return response()->json([
            'data' => new EventRsvpResource($rsvp),
            'success' => true,
            'message' => 'Confirmação atualizada com sucesso!',
        ]);
    }

    /**
     * Delete RSVP (cancel attendance).
     *
     * DELETE /api/v1/events/{event}/rsvp
     */
    public function destroy(Request $request, Event $event): JsonResponse
    {
        $user = $request->user();

        $rsvp = $event->rsvps()
            ->where('user_id', $user->id)
            ->first();

        if (!$rsvp) {
            return response()->json([
                'success' => false,
                'message' => 'Você não possui confirmação neste evento.',
            ], 404);
        }

        $rsvp->delete();

        return response()->json([
            'success' => true,
            'message' => 'Confirmação cancelada.',
        ]);
    }

    /**
     * Get public list of attendees.
     *
     * GET /api/v1/events/{event}/attendees
     */
    public function attendees(Request $request, Event $event): JsonResponse
    {
        $goingCount = $event->rsvps()->going()->sum('guests_count');
        $maybeCount = $event->rsvps()->maybe()->sum('guests_count');

        $attendees = $event->rsvps()
            ->going()
            ->with('user')
            ->latest()
            ->paginate(min($request->input('perPage', 20), 50));

        $attendeesList = $attendees->getCollection()->map(fn($rsvp) => [
            'id' => $rsvp->user?->id,
            'nome' => $this->getDisplayName($rsvp->user),
            'avatarUrl' => $rsvp->user?->avatar_url,
            'guestsCount' => $rsvp->guests_count,
        ])->filter(fn($a) => $a['id'] !== null)->values();

        return response()->json([
            'data' => [
                'total' => $goingCount + $maybeCount,
                'goingCount' => $goingCount,
                'maybeCount' => $maybeCount,
                'attendees' => $attendeesList,
            ],
            'meta' => [
                'page' => $attendees->currentPage(),
                'perPage' => $attendees->perPage(),
                'lastPage' => $attendees->lastPage(),
            ],
            'success' => true,
        ]);
    }

    /**
     * Get appropriate message for RSVP status.
     */
    private function getRsvpMessage(RsvpStatus $status): string
    {
        return match ($status) {
            RsvpStatus::Going => 'Presença confirmada! Nos vemos lá! 🎉',
            RsvpStatus::Maybe => 'Você marcou como "talvez". Esperamos que possa ir!',
            RsvpStatus::NotGoing => 'Entendido. Talvez na próxima!',
        };
    }

    /**
     * Get display name (first name + last initial for privacy).
     */
    private function getDisplayName($user): string
    {
        if (!$user || !$user->nome) {
            return 'Usuário';
        }

        $parts = explode(' ', $user->nome);
        $firstName = $parts[0];

        if (count($parts) > 1) {
            return $firstName . ' ' . substr($parts[count($parts) - 1], 0, 1) . '.';
        }

        return $firstName;
    }
}
