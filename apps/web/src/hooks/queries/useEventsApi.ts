// ======================================================
// Events API React Query Hooks
// Complete integration with real API
// ======================================================

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { eventApiService } from '@/services/event.api.service';
import type {
    EventFiltersParams,
    EventListItem,
    EventDetail,
    EventCategory,
    EventTag,
    CreateRsvpRequest,
    RsvpStatus,
} from '@/types/events.api';

// ======================================================
// Query Keys
// ======================================================

export const eventQueryKeys = {
    all: ['events'] as const,
    lists: () => [...eventQueryKeys.all, 'list'] as const,
    list: (filters: EventFiltersParams) => [...eventQueryKeys.lists(), filters] as const,
    upcoming: (limit?: number) => [...eventQueryKeys.all, 'upcoming', limit] as const,
    today: () => [...eventQueryKeys.all, 'today'] as const,
    weekend: () => [...eventQueryKeys.all, 'weekend'] as const,
    featured: (limit?: number) => [...eventQueryKeys.all, 'featured', limit] as const,
    search: (query: string, filters?: EventFiltersParams) => [...eventQueryKeys.all, 'search', query, filters] as const,
    byDate: (date: string) => [...eventQueryKeys.all, 'date', date] as const,
    byMonth: (year: number, month: number) => [...eventQueryKeys.all, 'month', year, month] as const,
    byCategory: (slug: string, filters?: EventFiltersParams) => [...eventQueryKeys.all, 'category', slug, filters] as const,
    byBairro: (bairroId: string, filters?: EventFiltersParams) => [...eventQueryKeys.all, 'bairro', bairroId, filters] as const,
    byTag: (slug: string, filters?: EventFiltersParams) => [...eventQueryKeys.all, 'tag', slug, filters] as const,
    detail: (id: string) => [...eventQueryKeys.all, 'detail', id] as const,
    categories: () => [...eventQueryKeys.all, 'categories'] as const,
    tags: () => [...eventQueryKeys.all, 'tags'] as const,
    tagsTrending: () => [...eventQueryKeys.all, 'tags', 'trending'] as const,
    rsvp: (eventId: string) => [...eventQueryKeys.all, 'rsvp', eventId] as const,
    attendees: (eventId: string) => [...eventQueryKeys.all, 'attendees', eventId] as const,
    myEvents: (params?: object) => [...eventQueryKeys.all, 'my-events', params] as const,
    myFavorites: (params?: object) => [...eventQueryKeys.all, 'my-favorites', params] as const,
    // V2 query keys
    homeFeatured: () => [...eventQueryKeys.all, 'home-featured'] as const,
    calendarSummary: (year: number, month: number) => [...eventQueryKeys.all, 'calendar-summary', year, month] as const,
};

// ======================================================
// Cache Times
// ======================================================

const CACHE_TIMES = {
    events: 5 * 60 * 1000, // 5 minutes
    categories: 10 * 60 * 1000, // 10 minutes
    tags: 10 * 60 * 1000, // 10 minutes
    detail: 2 * 60 * 1000, // 2 minutes
    rsvp: 30 * 1000, // 30 seconds
    // V2 cache times
    homeFeatured: 2 * 60 * 1000, // 2 minutes
    calendarSummary: 5 * 60 * 1000, // 5 minutes
};

// ======================================================
// List Hooks
// ======================================================

/**
 * Get paginated list of events with filters
 */
export function useEvents(filters: EventFiltersParams = {}, enabled = true) {
    return useQuery({
        queryKey: eventQueryKeys.list(filters),
        queryFn: () => eventApiService.getAll(filters),
        staleTime: CACHE_TIMES.events,
        enabled,
    });
}

/**
 * Get events with infinite scroll
 */
export function useInfiniteEvents(filters: EventFiltersParams = {}) {
    return useInfiniteQuery({
        queryKey: eventQueryKeys.list(filters),
        queryFn: ({ pageParam = 1 }) => eventApiService.getAll({ ...filters, page: pageParam }),
        getNextPageParam: (lastPage) => {
            if (lastPage.meta.page < lastPage.meta.lastPage) {
                return lastPage.meta.page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        staleTime: CACHE_TIMES.events,
    });
}

/**
 * Get upcoming events
 */
export function useUpcomingEvents(limit = 10) {
    return useQuery({
        queryKey: eventQueryKeys.upcoming(limit),
        queryFn: () => eventApiService.getUpcoming(limit),
        staleTime: CACHE_TIMES.events,
    });
}

/**
 * Get today's events
 */
export function useTodayEvents() {
    return useQuery({
        queryKey: eventQueryKeys.today(),
        queryFn: () => eventApiService.getToday(),
        staleTime: CACHE_TIMES.events,
    });
}

/**
 * Get weekend events
 */
export function useWeekendEvents() {
    return useQuery({
        queryKey: eventQueryKeys.weekend(),
        queryFn: () => eventApiService.getWeekend(),
        staleTime: CACHE_TIMES.events,
    });
}

/**
 * Get featured events
 */
export function useFeaturedEvents(limit = 6) {
    return useQuery({
        queryKey: eventQueryKeys.featured(limit),
        queryFn: () => eventApiService.getFeatured(limit),
        staleTime: CACHE_TIMES.events,
    });
}

/**
 * Search events
 */
export function useSearchEvents(query: string, filters: EventFiltersParams = {}) {
    return useQuery({
        queryKey: eventQueryKeys.search(query, filters),
        queryFn: () => eventApiService.search(query, filters),
        staleTime: CACHE_TIMES.events,
        enabled: query.length >= 2,
    });
}

// ======================================================
// V2 Optimized Hooks
// ======================================================

/**
 * V2: Get home featured data (optimized single request for home page)
 */
export function useHomeFeatured() {
    return useQuery({
        queryKey: eventQueryKeys.homeFeatured(),
        queryFn: () => eventApiService.getHomeFeatured(),
        staleTime: CACHE_TIMES.homeFeatured,
    });
}

/**
 * V2: Get calendar summary (optimized for calendar view)
 */
export function useCalendarSummary(year: number, month: number) {
    return useQuery({
        queryKey: eventQueryKeys.calendarSummary(year, month),
        queryFn: () => eventApiService.getCalendarSummary(year, month),
        staleTime: CACHE_TIMES.calendarSummary,
    });
}

// ======================================================
// Date Filter Hooks
// ======================================================

/**
 * Get events by date
 */
export function useEventsByDate(date: string, enabled = true) {
    return useQuery({
        queryKey: eventQueryKeys.byDate(date),
        queryFn: () => eventApiService.getByDate(date),
        staleTime: CACHE_TIMES.events,
        enabled,
    });
}

/**
 * Get events by month (for calendar)
 */
export function useEventsByMonth(year: number, month: number) {
    return useQuery({
        queryKey: eventQueryKeys.byMonth(year, month),
        queryFn: () => eventApiService.getByMonth(year, month),
        staleTime: CACHE_TIMES.events,
    });
}

// ======================================================
// Category/Tag/Location Filter Hooks
// ======================================================

/**
 * Get events by category
 */
export function useEventsByCategory(slug: string, filters: EventFiltersParams = {}) {
    return useQuery({
        queryKey: eventQueryKeys.byCategory(slug, filters),
        queryFn: () => eventApiService.getByCategory(slug, filters),
        staleTime: CACHE_TIMES.events,
        enabled: !!slug,
    });
}

/**
 * Get events by bairro
 */
export function useEventsByBairro(bairroId: string, filters: EventFiltersParams = {}) {
    return useQuery({
        queryKey: eventQueryKeys.byBairro(bairroId, filters),
        queryFn: () => eventApiService.getByBairro(bairroId, filters),
        staleTime: CACHE_TIMES.events,
        enabled: !!bairroId,
    });
}

/**
 * Get events by tag
 */
export function useEventsByTag(slug: string, filters: EventFiltersParams = {}) {
    return useQuery({
        queryKey: eventQueryKeys.byTag(slug, filters),
        queryFn: () => eventApiService.getByTag(slug, filters),
        staleTime: CACHE_TIMES.events,
        enabled: !!slug,
    });
}

// ======================================================
// Detail Hook
// ======================================================

/**
 * Get single event details
 */
export function useEvent(id: string, enabled = true) {
    return useQuery({
        queryKey: eventQueryKeys.detail(id),
        queryFn: () => eventApiService.getById(id),
        staleTime: CACHE_TIMES.detail,
        enabled: enabled && !!id,
    });
}

// ======================================================
// Categories & Tags Hooks
// ======================================================

/**
 * Get all categories
 */
export function useEventCategories() {
    return useQuery({
        queryKey: eventQueryKeys.categories(),
        queryFn: () => eventApiService.getCategories(),
        staleTime: CACHE_TIMES.categories,
    });
}

/**
 * Get all tags
 */
export function useEventTags() {
    return useQuery({
        queryKey: eventQueryKeys.tags(),
        queryFn: () => eventApiService.getTags(),
        staleTime: CACHE_TIMES.tags,
    });
}

/**
 * Get trending tags
 */
export function useTrendingTags() {
    return useQuery({
        queryKey: eventQueryKeys.tagsTrending(),
        queryFn: () => eventApiService.getTrendingTags(),
        staleTime: CACHE_TIMES.tags,
    });
}

// ======================================================
// RSVP Hooks
// ======================================================

/**
 * Get user's RSVP for an event
 */
export function useEventRsvp(eventId: string, enabled = true) {
    return useQuery({
        queryKey: eventQueryKeys.rsvp(eventId),
        queryFn: () => eventApiService.getRsvp(eventId),
        staleTime: CACHE_TIMES.rsvp,
        enabled: enabled && !!eventId,
    });
}

/**
 * Create RSVP mutation
 */
export function useCreateRsvp() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ eventId, data }: { eventId: string; data: CreateRsvpRequest }) =>
            eventApiService.createRsvp(eventId, data),
        onSuccess: (response, { eventId }) => {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: eventQueryKeys.rsvp(eventId) });
            queryClient.invalidateQueries({ queryKey: eventQueryKeys.detail(eventId) });
            queryClient.invalidateQueries({ queryKey: eventQueryKeys.attendees(eventId) });
            queryClient.invalidateQueries({ queryKey: eventQueryKeys.myEvents() });

            // Update event in list cache
            queryClient.setQueriesData(
                { queryKey: eventQueryKeys.lists() },
                (old: { data: EventListItem[] } | undefined) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: old.data.map(event =>
                            event.id === eventId
                                ? { ...event, userRsvpStatus: response.data.status as RsvpStatus, rsvpCount: event.rsvpCount + 1 }
                                : event
                        ),
                    };
                }
            );
        },
    });
}

/**
 * Update RSVP mutation
 */
export function useUpdateRsvp() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ eventId, data }: { eventId: string; data: Partial<CreateRsvpRequest> }) =>
            eventApiService.updateRsvp(eventId, data),
        onSuccess: (response, { eventId }) => {
            queryClient.invalidateQueries({ queryKey: eventQueryKeys.rsvp(eventId) });
            queryClient.invalidateQueries({ queryKey: eventQueryKeys.detail(eventId) });
            queryClient.invalidateQueries({ queryKey: eventQueryKeys.attendees(eventId) });
        },
    });
}

/**
 * Delete RSVP mutation
 */
export function useDeleteRsvp() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (eventId: string) => eventApiService.deleteRsvp(eventId),
        onSuccess: (_, eventId) => {
            queryClient.invalidateQueries({ queryKey: eventQueryKeys.rsvp(eventId) });
            queryClient.invalidateQueries({ queryKey: eventQueryKeys.detail(eventId) });
            queryClient.invalidateQueries({ queryKey: eventQueryKeys.attendees(eventId) });
            queryClient.invalidateQueries({ queryKey: eventQueryKeys.myEvents() });

            // Update event in list cache
            queryClient.setQueriesData(
                { queryKey: eventQueryKeys.lists() },
                (old: { data: EventListItem[] } | undefined) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: old.data.map(event =>
                            event.id === eventId
                                ? { ...event, userRsvpStatus: null, rsvpCount: Math.max(0, event.rsvpCount - 1) }
                                : event
                        ),
                    };
                }
            );
        },
    });
}

/**
 * Get event attendees
 */
export function useEventAttendees(eventId: string, page = 1, perPage = 20) {
    return useQuery({
        queryKey: [...eventQueryKeys.attendees(eventId), page, perPage],
        queryFn: () => eventApiService.getAttendees(eventId, page, perPage),
        staleTime: CACHE_TIMES.rsvp,
        enabled: !!eventId,
    });
}

// ======================================================
// Favorite Hooks
// ======================================================

/**
 * Toggle favorite mutation with optimistic update
 */
export function useToggleFavorite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (eventId: string) => eventApiService.toggleFavorite(eventId),
        onMutate: async (eventId) => {
            // Cancel outgoing requests
            await queryClient.cancelQueries({ queryKey: eventQueryKeys.lists() });
            await queryClient.cancelQueries({ queryKey: eventQueryKeys.detail(eventId) });

            // Snapshot previous value
            const previousDetail = queryClient.getQueryData<{ data: EventDetail }>(eventQueryKeys.detail(eventId));

            // Optimistically update detail
            if (previousDetail) {
                queryClient.setQueryData(eventQueryKeys.detail(eventId), {
                    ...previousDetail,
                    data: { ...previousDetail.data, isFavorited: !previousDetail.data.isFavorited },
                });
            }

            return { previousDetail };
        },
        onError: (err, eventId, context) => {
            // Rollback on error
            if (context?.previousDetail) {
                queryClient.setQueryData(eventQueryKeys.detail(eventId), context.previousDetail);
            }
        },
        onSuccess: (response, eventId) => {
            // Update all list caches
            queryClient.setQueriesData(
                { queryKey: eventQueryKeys.lists() },
                (old: { data: EventListItem[] } | undefined) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: old.data.map(event =>
                            event.id === eventId
                                ? { ...event, isFavorited: response.data.isFavorited }
                                : event
                        ),
                    };
                }
            );

            // Invalidate favorites list
            queryClient.invalidateQueries({ queryKey: eventQueryKeys.myFavorites() });
        },
    });
}

// ======================================================
// User Events Hooks
// ======================================================

/**
 * Get user's RSVP'd events
 */
export function useMyEvents(params: {
    status?: 'going' | 'maybe' | 'not_going' | 'all';
    timeframe?: 'upcoming' | 'past' | 'all';
    page?: number;
    perPage?: number;
} = {}) {
    return useQuery({
        queryKey: eventQueryKeys.myEvents(params),
        queryFn: () => eventApiService.getMyEvents(params),
        staleTime: CACHE_TIMES.events,
    });
}

/**
 * Get user's favorite events
 */
export function useMyFavoriteEvents(params: {
    timeframe?: 'upcoming' | 'past' | 'all';
    page?: number;
    perPage?: number;
} = {}) {
    return useQuery({
        queryKey: eventQueryKeys.myFavorites(params),
        queryFn: () => eventApiService.getMyFavorites(params),
        staleTime: CACHE_TIMES.events,
    });
}

// ======================================================
// Utility Hooks
// ======================================================

/**
 * Prefetch event detail
 */
export function usePrefetchEvent() {
    const queryClient = useQueryClient();

    return (eventId: string) => {
        queryClient.prefetchQuery({
            queryKey: eventQueryKeys.detail(eventId),
            queryFn: () => eventApiService.getById(eventId),
            staleTime: CACHE_TIMES.detail,
        });
    };
}

/**
 * Prefetch categories and tags
 */
export function usePrefetchEventMeta() {
    const queryClient = useQueryClient();

    return () => {
        queryClient.prefetchQuery({
            queryKey: eventQueryKeys.categories(),
            queryFn: () => eventApiService.getCategories(),
            staleTime: CACHE_TIMES.categories,
        });

        queryClient.prefetchQuery({
            queryKey: eventQueryKeys.tags(),
            queryFn: () => eventApiService.getTags(),
            staleTime: CACHE_TIMES.tags,
        });
    };
}
