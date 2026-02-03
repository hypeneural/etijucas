/**
 * useOfflineEvents - Hybrid Offline-First Hook for Agenda Events
 * 
 * Strategy:
 * 1. Read from IndexedDB first (instant, cached)
 * 2. Fetch from API in background (when online)
 * 3. Update IndexedDB with fresh data
 * 4. Automatic refetch when coming back online
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { eventsDB } from '@/lib/localDatabase';
import { eventService } from '@/services';
import { Event } from '@/types';
import { EventFilters, PaginatedResponse } from '@/types/api.types';
import { useNetworkStatus } from './useNetworkStatus';

// Query keys
const EVENTS_KEY = ['offline', 'events'] as const;
const UPCOMING_EVENTS_KEY = ['offline', 'events', 'upcoming'] as const;
const EVENT_KEY = (id: string) => ['offline', 'events', id] as const;

/**
 * Get all events with offline-first strategy
 */
export function useOfflineEvents(filters?: EventFilters) {
    const { isOnline } = useNetworkStatus();
    const queryClient = useQueryClient();

    const query = useQuery<PaginatedResponse<Event>>({
        queryKey: [...EVENTS_KEY, filters],
        queryFn: async () => {
            // 1. Start with IndexedDB cache for instant display
            let events = await eventsDB.getAll();

            // 2. If online, fetch fresh data
            if (isOnline) {
                try {
                    const response = await eventService.getAll(filters);

                    // Update IndexedDB with fresh data
                    if (response.data && response.data.length > 0) {
                        await eventsDB.saveMany(response.data);
                    }

                    return response;
                } catch (error) {
                    console.warn('[useOfflineEvents] API failed, using cache:', error);
                }
            }

            // 3. Apply local filters if using cached data
            if (filters?.bairroId) {
                events = events.filter(e => e.bairroId === filters.bairroId);
            }
            if (filters?.fromDate) {
                const from = new Date(filters.fromDate);
                events = events.filter(e => new Date(e.dateTime) >= from);
            }
            if (filters?.toDate) {
                const to = new Date(filters.toDate);
                events = events.filter(e => new Date(e.dateTime) <= to);
            }
            if (filters?.search) {
                const q = filters.search.toLowerCase();
                events = events.filter(e =>
                    e.titulo.toLowerCase().includes(q) ||
                    e.descricao?.toLowerCase().includes(q)
                );
            }

            // Sort by date (soonest first)
            events.sort((a, b) =>
                new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
            );

            // Paginate
            const page = filters?.page || 1;
            const perPage = filters?.perPage || 20;
            const start = (page - 1) * perPage;
            const end = start + perPage;

            return {
                data: events.slice(start, end),
                meta: {
                    total: events.length,
                    page,
                    perPage,
                    lastPage: Math.ceil(events.length / perPage),
                    from: start + 1,
                    to: Math.min(end, events.length),
                },
            };
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });

    // Refetch when coming back online
    useEffect(() => {
        if (isOnline) {
            queryClient.invalidateQueries({ queryKey: EVENTS_KEY });
        }
    }, [isOnline, queryClient]);

    return query;
}

/**
 * Get upcoming events with offline support
 */
export function useUpcomingOfflineEvents(limit = 5) {
    const { isOnline } = useNetworkStatus();

    return useQuery<Event[]>({
        queryKey: [...UPCOMING_EVENTS_KEY, limit],
        queryFn: async () => {
            // Try API first if online
            if (isOnline) {
                try {
                    const events = await eventService.getUpcoming(limit);
                    return events;
                } catch (error) {
                    console.warn('[useUpcomingOfflineEvents] API failed, using cache');
                }
            }

            // Fallback to IndexedDB
            const now = new Date();
            const events = await eventsDB.getAll();

            return events
                .filter(e => new Date(e.dateTime) >= now)
                .slice(0, limit);
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Get events by date with offline support
 */
export function useEventsByDateOffline(date: string) {
    const { isOnline } = useNetworkStatus();

    return useQuery<Event[]>({
        queryKey: [...EVENTS_KEY, 'date', date],
        queryFn: async () => {
            // Try API first if online
            if (isOnline) {
                try {
                    const events = await eventService.getByDate(date);
                    return events;
                } catch (error) {
                    console.warn('[useEventsByDateOffline] API failed, using cache');
                }
            }

            // Fallback to IndexedDB
            const targetDate = new Date(date).toDateString();
            const events = await eventsDB.getAll();

            return events.filter(
                e => new Date(e.dateTime).toDateString() === targetDate
            );
        },
        enabled: !!date,
    });
}

/**
 * Get single event by ID with offline support
 */
export function useOfflineEvent(id: string) {
    const { isOnline } = useNetworkStatus();

    return useQuery<Event | undefined>({
        queryKey: EVENT_KEY(id),
        queryFn: async () => {
            // Try IndexedDB first
            let event = await eventsDB.getById(id);

            // If online, try API
            if (isOnline) {
                try {
                    const fresh = await eventService.getById(id);
                    if (fresh) {
                        await eventsDB.save(fresh);
                        event = fresh;
                    }
                } catch (error) {
                    console.warn('[useOfflineEvent] API failed, using cache');
                }
            }

            return event;
        },
        enabled: !!id,
    });
}

export default {
    useOfflineEvents,
    useUpcomingOfflineEvents,
    useEventsByDateOffline,
    useOfflineEvent,
};
