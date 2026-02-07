<?php

namespace App\Http\Controllers\Api\Events;

use App\Domain\Events\Enums\EventStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Events\EventCollection;
use App\Http\Resources\Events\EventResource;
use App\Models\Event;
use App\Support\TenantCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    /**
     * List events with filters and pagination.
     *
     * GET /api/v1/events
     */
    public function index(Request $request): EventCollection
    {
        // Authenticated users: bypass cache for personalized data
        if ($request->user()) {
            return new EventCollection($this->fetchEvents($request));
        }

        // Anonymous users: cache for performance
        $cacheKey = 'events:list:' . md5($request->fullUrl());

        $events = TenantCache::remember($cacheKey, 60, function () use ($request) {
            return $this->fetchEvents($request);
        });

        return new EventCollection($events);
    }

    /**
     * Get upcoming events.
     *
     * GET /api/v1/events/upcoming
     */
    public function upcoming(Request $request): EventCollection
    {
        $query = $this->baseQuery($request)
            ->upcoming()
            ->orderByStartDate();

        $perPage = min($request->input('perPage', 15), 50);

        return new EventCollection($query->paginate($perPage));
    }

    /**
     * Get today's events.
     *
     * GET /api/v1/events/today
     */
    public function today(Request $request): EventCollection
    {
        $query = $this->baseQuery($request)
            ->today()
            ->orderByStartDate();

        $perPage = min($request->input('perPage', 15), 50);

        return new EventCollection($query->paginate($perPage));
    }

    /**
     * Get weekend events.
     *
     * GET /api/v1/events/weekend
     */
    public function weekend(Request $request): EventCollection
    {
        $query = $this->baseQuery($request)
            ->weekend()
            ->orderByStartDate();

        $perPage = min($request->input('perPage', 15), 50);

        return new EventCollection($query->paginate($perPage));
    }

    /**
     * Get featured events.
     *
     * GET /api/v1/events/featured
     */
    public function featured(Request $request): EventCollection
    {
        $query = $this->baseQuery($request)
            ->featured()
            ->upcoming()
            ->orderByPopularity();

        $perPage = min($request->input('perPage', 10), 50);

        return new EventCollection($query->paginate($perPage));
    }

    /**
     * Search events.
     *
     * GET /api/v1/events/search
     */
    public function search(Request $request): EventCollection
    {
        $request->validate([
            'q' => 'required|string|min:2|max:100',
        ]);

        $query = $this->baseQuery($request)
            ->search($request->input('q'))
            ->orderByPopularity();

        $perPage = min($request->input('perPage', 15), 50);

        return new EventCollection($query->paginate($perPage));
    }

    /**
     * Get events by date.
     *
     * GET /api/v1/events/date/{date}
     */
    public function byDate(Request $request, string $date): EventCollection
    {
        $parsedDate = \Carbon\Carbon::parse($date);

        $query = $this->baseQuery($request)
            ->onDate($parsedDate)
            ->orderByStartDate();

        $perPage = min($request->input('perPage', 15), 50);

        return new EventCollection($query->paginate($perPage));
    }

    /**
     * Get events by month.
     *
     * GET /api/v1/events/month/{year}/{month}
     */
    public function byMonth(Request $request, int $year, int $month): EventCollection
    {
        $query = $this->baseQuery($request)
            ->inMonth($year, $month)
            ->orderByStartDate();

        $perPage = min($request->input('perPage', 50), 100);

        return new EventCollection($query->paginate($perPage));
    }

    /**
     * Get events by category.
     *
     * GET /api/v1/events/category/{slug}
     */
    public function byCategory(Request $request, string $slug): EventCollection
    {
        $query = $this->baseQuery($request)
            ->byCategory($slug)
            ->upcoming()
            ->orderByStartDate();

        $perPage = min($request->input('perPage', 15), 50);

        return new EventCollection($query->paginate($perPage));
    }

    /**
     * Get events by bairro.
     *
     * GET /api/v1/events/bairro/{bairro}
     */
    public function byBairro(Request $request, string $bairroId): EventCollection
    {
        $query = $this->baseQuery($request)
            ->byBairro($bairroId)
            ->upcoming()
            ->orderByStartDate();

        $perPage = min($request->input('perPage', 15), 50);

        return new EventCollection($query->paginate($perPage));
    }

    /**
     * Get events by venue.
     *
     * GET /api/v1/events/venue/{venue}
     */
    public function byVenue(Request $request, string $venueId): EventCollection
    {
        $query = $this->baseQuery($request)
            ->byVenue($venueId)
            ->upcoming()
            ->orderByStartDate();

        $perPage = min($request->input('perPage', 15), 50);

        return new EventCollection($query->paginate($perPage));
    }

    /**
     * Get events by tag.
     *
     * GET /api/v1/events/tag/{slug}
     */
    public function byTag(Request $request, string $slug): EventCollection
    {
        $query = $this->baseQuery($request)
            ->byTag($slug)
            ->upcoming()
            ->orderByStartDate();

        $perPage = min($request->input('perPage', 15), 50);

        return new EventCollection($query->paginate($perPage));
    }

    /**
     * Get events by organizer.
     *
     * GET /api/v1/events/organizer/{organizer}
     */
    public function byOrganizer(Request $request, string $organizerId): EventCollection
    {
        $query = $this->baseQuery($request)
            ->byOrganizer($organizerId)
            ->upcoming()
            ->orderByStartDate();

        $perPage = min($request->input('perPage', 15), 50);

        return new EventCollection($query->paginate($perPage));
    }

    /**
     * Get optimized data for home page.
     *
     * GET /api/v1/events/home-featured
     */
    public function homeFeatured(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;

        // Cache for 2 minutes for anonymous users
        $cacheKey = $userId ? null : 'events:home-featured';

        if ($cacheKey && TenantCache::has($cacheKey)) {
            return response()->json(TenantCache::get($cacheKey));
        }

        $baseQuery = fn() => Event::query()
            ->with(['category', 'venue.bairro', 'ticket'])
            ->published();

        // Highlight - most popular featured event
        $highlight = $baseQuery()
            ->featured()
            ->upcoming()
            ->orderByPopularity()
            ->first();

        // Today's events
        $today = $baseQuery()
            ->today()
            ->orderByStartDate()
            ->take(6)
            ->get();

        // Weekend events
        $weekend = $baseQuery()
            ->weekend()
            ->orderByPopularity()
            ->take(6)
            ->get();

        // Upcoming events
        $upcoming = $baseQuery()
            ->upcoming()
            ->where('is_featured', false)
            ->orderByStartDate()
            ->take(6)
            ->get();

        $response = [
            'data' => [
                'highlight' => $highlight ? [
                    'id' => $highlight->id,
                    'title' => $highlight->title,
                    'slug' => $highlight->slug,
                    'bannerImage' => $highlight->banner_image_url ?? $highlight->cover_image_url,
                    'coverImage' => $highlight->cover_image_url,
                    'startDateTime' => $highlight->start_datetime->toIso8601String(),
                    'venue' => $highlight->venue ? [
                        'name' => $highlight->venue->name,
                        'bairro' => $highlight->venue->bairro?->nome,
                    ] : null,
                    'category' => $highlight->category ? [
                        'name' => $highlight->category->name,
                        'color' => $highlight->category->color,
                    ] : null,
                    'badge' => $highlight->is_featured ? [
                        'text' => '🔥 Em destaque',
                        'color' => '#EF4444',
                    ] : null,
                ] : null,
                'today' => $this->formatHomeEvents($today),
                'weekend' => $this->formatHomeEvents($weekend),
                'upcoming' => $this->formatHomeEvents($upcoming),
            ],
            'success' => true,
        ];

        if ($cacheKey) {
            TenantCache::put($cacheKey, $response, 120);
        }

        return response()->json($response);
    }

    /**
     * Get calendar summary for a month.
     *
     * GET /api/v1/events/calendar-summary
     */
    public function calendarSummary(Request $request): JsonResponse
    {
        $request->validate([
            'year' => 'required|integer|min:2020|max:2100',
            'month' => 'required|integer|min:1|max:12',
        ]);

        $year = (int) $request->input('year');
        $month = (int) $request->input('month');

        $cacheKey = "events:calendar:{$year}:{$month}";

        if (!$request->user() && TenantCache::has($cacheKey)) {
            return response()->json(TenantCache::get($cacheKey));
        }

        $startOfMonth = now()->setYear($year)->setMonth($month)->startOfMonth();
        $endOfMonth = $startOfMonth->copy()->endOfMonth();

        // Get all events in the month
        $events = Event::query()
            ->published()
            ->where('start_datetime', '<=', $endOfMonth)
            ->where('end_datetime', '>=', $startOfMonth)
            ->select(['id', 'start_datetime', 'end_datetime', 'is_featured'])
            ->get();

        // Group by date
        $summary = [];
        $period = new \DatePeriod(
            $startOfMonth,
            new \DateInterval('P1D'),
            $endOfMonth->copy()->addDay()
        );

        foreach ($period as $date) {
            $dateStr = $date->format('Y-m-d');
            $dayEvents = $events->filter(function ($event) use ($date) {
                return $event->start_datetime->startOfDay()->lte($date)
                    && $event->end_datetime->endOfDay()->gte($date);
            });

            if ($dayEvents->isNotEmpty()) {
                $summary[$dateStr] = [
                    'count' => $dayEvents->count(),
                    'hasHighlight' => $dayEvents->contains('is_featured', true),
                ];
            }
        }

        $response = [
            'data' => $summary,
            'meta' => [
                'year' => $year,
                'month' => $month,
                'totalEvents' => $events->count(),
            ],
            'success' => true,
        ];

        if (!$request->user()) {
            TenantCache::put($cacheKey, $response, 300);
        }

        return response()->json($response);
    }

    /**
     * Format events for home page response.
     */
    private function formatHomeEvents($events): array
    {
        return $events->map(fn($event) => [
            'id' => $event->id,
            'title' => $event->title,
            'slug' => $event->slug,
            'coverImage' => $event->cover_image_url,
            'startDateTime' => $event->start_datetime->toIso8601String(),
            'venue' => $event->venue ? [
                'name' => $event->venue->name,
                'bairro' => $event->venue->bairro?->nome,
            ] : null,
            'ticket' => $event->ticket ? [
                'type' => $event->ticket->ticket_type,
                'minPrice' => (float) $event->ticket->min_price,
            ] : null,
        ])->toArray();
    }

    /**
     * Get single event details.
     *
     * GET /api/v1/events/{event}
     */
    public function show(Request $request, Event $event): JsonResponse
    {
        // Only show published events to non-admin users
        if ($event->status !== EventStatus::Published) {
            $user = $request->user();
            if (!$user || !$user->hasAnyRole(['admin', 'moderator'])) {
                abort(404);
            }
        }

        $event->load([
            'category',
            'venue.bairro',
            'organizer',
            'ticket.lots',
            'schedules',
            'days.schedules',
            'tags',
            'media',
            'legacyMedia',
            'links',
            'rsvps.user',
        ]);

        return response()->json([
            'data' => new EventResource($event),
            'success' => true,
        ]);
    }

    /**
     * Build base query with common filters and relationships.
     */
    private function baseQuery(Request $request)
    {
        $query = Event::query()
            ->with(['category', 'venue.bairro', 'ticket', 'tags'])
            ->published();

        // User interactions
        if ($request->user()) {
            $query->withUserInteractions($request->user()->id);
        }

        // Apply filters
        $this->applyFilters($query, $request);

        return $query;
    }

    /**
     * Fetch events with all filters applied.
     */
    private function fetchEvents(Request $request)
    {
        $query = $this->baseQuery($request);

        // Ordering
        $orderBy = $request->input('orderBy', 'startDateTime');
        $order = $request->input('order', 'asc');

        $query = match ($orderBy) {
            'popularityScore' => $query->orderByPopularity($order),
            'createdAt' => $query->orderBy('created_at', $order),
            default => $query->orderByStartDate($order),
        };

        // Pagination
        $perPage = min($request->input('perPage', 15), 50);

        return $query->paginate($perPage);
    }

    /**
     * Apply filters from request.
     */
    private function applyFilters($query, Request $request): void
    {
        // Search
        if ($request->filled('search')) {
            $query->search($request->input('search'));
        }

        // Category
        if ($request->filled('categoryId') || $request->filled('category')) {
            $category = $request->input('categoryId') ?? $request->input('category');
            $query->byCategory($category);
        }

        // Bairro
        if ($request->filled('bairroId')) {
            $query->byBairro($request->input('bairroId'));
        }

        // Venue
        if ($request->filled('venueId')) {
            $query->byVenue($request->input('venueId'));
        }

        // Organizer
        if ($request->filled('organizerId')) {
            $query->byOrganizer($request->input('organizerId'));
        }

        // Tags
        if ($request->filled('tags')) {
            $tags = explode(',', $request->input('tags'));
            $query->byTags($tags);
        }

        // Date range
        if ($request->filled('fromDate') || $request->filled('toDate')) {
            $fromDate = $request->input('fromDate') ? \Carbon\Carbon::parse($request->input('fromDate')) : null;
            $toDate = $request->input('toDate') ? \Carbon\Carbon::parse($request->input('toDate')) : null;
            $query->inDateRange($fromDate, $toDate);
        }

        // Date preset
        if ($request->filled('datePreset')) {
            $query = match ($request->input('datePreset')) {
                'today' => $query->today(),
                'tomorrow' => $query->tomorrow(),
                'weekend' => $query->weekend(),
                'this_week' => $query->thisWeek(),
                'this_month' => $query->thisMonth(),
                default => $query->upcoming(),
            };
        } else {
            // Default to upcoming events
            $query->upcoming();
        }

        // Price
        if ($request->filled('price')) {
            $query->byPrice($request->input('price'));
        }

        if ($request->filled('priceMin') || $request->filled('priceMax')) {
            $query->byPriceRange(
                $request->input('priceMin') ? (float) $request->input('priceMin') : null,
                $request->input('priceMax') ? (float) $request->input('priceMax') : null
            );
        }

        // Time of day
        if ($request->filled('timeOfDay')) {
            $query->byTimeOfDay($request->input('timeOfDay'));
        }

        // Age rating
        if ($request->filled('ageRating')) {
            $query->byAgeRating($request->input('ageRating'));
        }

        // Flags
        if ($request->boolean('accessibility')) {
            $query->accessible();
        }

        if ($request->boolean('parking')) {
            $query->withParking();
        }

        if ($request->boolean('outdoor')) {
            $query->outdoor();
        }

        if ($request->boolean('kids')) {
            $query->kidsFriendly();
        }

        if ($request->boolean('featured')) {
            $query->featured();
        }

        // V2 Filters
        if ($request->boolean('hasSchedule')) {
            $query->whereHas('schedules');
        }

        if ($request->boolean('hasTickets')) {
            $query->whereHas('ticket');
        }

        if ($request->boolean('multiDay')) {
            $query->where('event_type', 'multi_day');
        }

        if ($request->filled('minCapacity')) {
            $query->whereHas('venue', fn($q) => $q->where('capacity', '>=', $request->input('minCapacity')));
        }

        if ($request->boolean('withRsvp')) {
            $query->whereHas('rsvps');
        }
    }
}
