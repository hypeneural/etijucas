// useEvents Hook
// React Query hooks for agenda events

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/api/config';
import { eventService } from '@/services';
import { Event } from '@/types';
import { EventFilters, PaginatedResponse } from '@/types/api.types';

/**
 * Get paginated events with filters
 */
export function useEvents(filters?: EventFilters) {
    return useQuery<PaginatedResponse<Event>>({
        queryKey: ['events', 'list', filters],
        queryFn: () => eventService.getAll(filters),
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}

/**
 * Get upcoming events
 */
export function useUpcomingEvents(limit = 5) {
    return useQuery<Event[]>({
        queryKey: ['events', 'upcoming', limit],
        queryFn: () => eventService.getUpcoming(limit),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Get events for a specific date
 */
export function useEventsByDate(date: string) {
    return useQuery<Event[]>({
        queryKey: ['events', 'date', date],
        queryFn: () => eventService.getByDate(date),
        enabled: !!date,
    });
}

/**
 * Get a single event by ID
 */
export function useEvent(id: string) {
    return useQuery<Event | undefined>({
        queryKey: ['events', 'detail', id],
        queryFn: () => eventService.getById(id),
        enabled: !!id,
    });
}
