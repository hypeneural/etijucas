/**
 * Events API Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { EventFilters } from '@repo/sdk';

export const eventsKeys = {
    all: ['events'] as const,
    list: (filters?: EventFilters) => [...eventsKeys.all, 'list', filters] as const,
    detail: (id: string) => [...eventsKeys.all, 'detail', id] as const,
    featured: () => [...eventsKeys.all, 'featured'] as const,
    today: () => [...eventsKeys.all, 'today'] as const,
    weekend: () => [...eventsKeys.all, 'weekend'] as const,
    calendar: (year: number, month: number) => [...eventsKeys.all, 'calendar', year, month] as const,
};

export function useEventsQuery(filters?: EventFilters) {
    return useQuery({
        queryKey: eventsKeys.list(filters),
        queryFn: async () => {
            throw new Error('TODO: Integrate with @repo/sdk');
        },
    });
}

export function useEventQuery(id: string) {
    return useQuery({
        queryKey: eventsKeys.detail(id),
        queryFn: async () => {
            throw new Error('TODO: Integrate with @repo/sdk');
        },
        enabled: !!id,
    });
}

export function useFeaturedEventsQuery() {
    return useQuery({
        queryKey: eventsKeys.featured(),
        queryFn: async () => {
            throw new Error('TODO: Integrate with @repo/sdk');
        },
    });
}

export function useEventRsvpMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ eventId, status }: { eventId: string; status: 'going' | 'interested' }) => {
            throw new Error('TODO: Integrate with @repo/sdk');
        },
        onSuccess: (_, { eventId }) => {
            queryClient.invalidateQueries({ queryKey: eventsKeys.detail(eventId) });
        },
    });
}
