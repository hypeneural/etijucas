// ======================================================
// Event Filters Hook - Real API Integration
// Replaces useEventFilters with API-backed version
// ======================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { parseISO } from 'date-fns';
import { eventApiService } from '@/services/event.api.service';
import type {
    EventListItem,
    EventFiltersState,
    EventFiltersParams,
    EventCategory,
} from '@/types/events.api';
import {
    getDateKey,
    getNextEvent,
    getTimeOfDay,
    isToday,
    isTomorrow,
    isWeekend,
} from '@/utils/date';

// ======================================================
// Storage Keys
// ======================================================

const STORAGE_FILTERS_KEY = 'etijucas_event_filters_v2';
const STORAGE_FAVORITES_KEY = 'etijucas_event_favorites';

// ======================================================
// Default Filters
// ======================================================

const DEFAULT_FILTERS: EventFiltersState = {
    search: '',
    datePreset: 'all',
    dateRange: { start: null, end: null },
    categories: [],
    neighborhoods: [],
    venues: [],
    price: 'all',
    priceRange: [0, 150],
    timeOfDay: [],
    accessibility: false,
    parking: false,
    kids: false,
    outdoor: false,
    sortBy: 'upcoming',
};

// ======================================================
// Helper Functions
// ======================================================

interface EventWithDates extends EventListItem {
    start: Date;
    end: Date;
}

const hydrateEvents = (events: EventListItem[]): EventWithDates[] =>
    events.map((event) => ({
        ...event,
        start: parseISO(event.startDateTime),
        end: parseISO(event.endDateTime),
    }));

const loadFilters = (): EventFiltersState => {
    if (typeof window === 'undefined') return DEFAULT_FILTERS;
    try {
        const stored = window.localStorage.getItem(STORAGE_FILTERS_KEY);
        if (!stored) return DEFAULT_FILTERS;
        const parsed = JSON.parse(stored) as EventFiltersState;
        return { ...DEFAULT_FILTERS, ...parsed };
    } catch {
        return DEFAULT_FILTERS;
    }
};

const loadFavorites = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
        const stored = window.localStorage.getItem(STORAGE_FAVORITES_KEY);
        return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
        return [];
    }
};

// ======================================================
// Filter Events Locally (for cached data)
// ======================================================

export const filterEventsLocally = (
    events: EventWithDates[],
    filters: EventFiltersState
): EventWithDates[] => {
    const search = filters.search.trim().toLowerCase();

    return events.filter((event) => {
        // Search filter
        if (search) {
            const inTitle = event.title.toLowerCase().includes(search);
            const inVenue = event.venue?.name?.toLowerCase().includes(search) ?? false;
            const inNeighborhood = event.venue?.bairro?.nome?.toLowerCase().includes(search) ?? false;
            const inTags = event.tags.some((tag) => tag.toLowerCase().includes(search));
            if (!inTitle && !inVenue && !inNeighborhood && !inTags) {
                return false;
            }
        }

        // Category filter
        if (filters.categories.length > 0 && event.category) {
            if (!filters.categories.includes(event.category.slug)) {
                return false;
            }
        }

        // Neighborhood filter
        if (filters.neighborhoods.length > 0) {
            const bairroName = event.venue?.bairro?.nome;
            if (!bairroName || !filters.neighborhoods.includes(bairroName)) {
                return false;
            }
        }

        // Venue filter
        if (filters.venues.length > 0) {
            const venueName = event.venue?.name;
            if (!venueName || !filters.venues.includes(venueName)) {
                return false;
            }
        }

        // Price filter
        if (filters.price === 'free' && event.ticket?.type !== 'free') return false;
        if (filters.price === 'paid' && event.ticket?.type !== 'paid') return false;
        if (filters.price === 'paid' && event.ticket?.type === 'paid') {
            const [minPrice, maxPrice] = filters.priceRange;
            if ((event.ticket?.minPrice ?? 0) < minPrice || (event.ticket?.minPrice ?? 0) > maxPrice) {
                return false;
            }
        }

        // Date preset filter
        if (filters.datePreset === 'today' && !isToday(event.start)) return false;
        if (filters.datePreset === 'tomorrow' && !isTomorrow(event.start)) return false;
        if (filters.datePreset === 'weekend' && !isWeekend(event.start)) return false;
        if (filters.datePreset === 'range' && filters.dateRange.start && filters.dateRange.end) {
            const start = new Date(filters.dateRange.start);
            const end = new Date(filters.dateRange.end);
            if (event.start < start || event.start > end) return false;
        }

        // Time of day filter
        if (filters.timeOfDay.length > 0) {
            const period = getTimeOfDay(event.start);
            if (!filters.timeOfDay.includes(period)) return false;
        }

        // Flags filter
        if (filters.accessibility && !event.flags.accessibility) return false;
        if (filters.parking && !event.flags.parking) return false;
        if (filters.outdoor && !event.flags.outdoor) return false;
        if (filters.kids && event.flags.ageRating !== 'livre') return false;

        return true;
    });
};

// ======================================================
// Convert Filters to API Params
// ======================================================

const toApiParams = (filters: EventFiltersState): EventFiltersParams => {
    const params: EventFiltersParams = {
        perPage: 50,
    };

    if (filters.search) params.search = filters.search;
    if (filters.categories.length > 0) params.tags = filters.categories.join(',');
    if (filters.price !== 'all') params.price = filters.price;
    if (filters.priceRange[0] > 0) params.priceMin = filters.priceRange[0];
    if (filters.priceRange[1] < 150) params.priceMax = filters.priceRange[1];
    if (filters.accessibility) params.accessibility = true;
    if (filters.parking) params.parking = true;
    if (filters.outdoor) params.outdoor = true;
    if (filters.kids) params.kids = true;
    if (filters.sortBy === 'popular') {
        params.orderBy = 'popularityScore';
        params.order = 'desc';
    } else {
        params.orderBy = 'startDateTime';
        params.order = 'asc';
    }

    // Date preset
    if (filters.datePreset !== 'all' && filters.datePreset !== 'range') {
        params.datePreset = filters.datePreset;
    }
    if (filters.datePreset === 'range' && filters.dateRange.start && filters.dateRange.end) {
        params.fromDate = filters.dateRange.start;
        params.toDate = filters.dateRange.end;
    }

    // Time of day
    if (filters.timeOfDay.length === 1) {
        params.timeOfDay = filters.timeOfDay[0];
    }

    return params;
};

// ======================================================
// Main Hook
// ======================================================

export const useEventFiltersApi = () => {
    const [filters, setFilters] = useState<EventFiltersState>(loadFilters);
    const [favorites, setFavorites] = useState<string[]>(loadFavorites);

    // Fetch all events from API
    const {
        data: eventsResponse,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['events', 'all', toApiParams(filters)],
        queryFn: () => eventApiService.getAll(toApiParams(filters)),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Fetch categories
    const { data: categoriesResponse } = useQuery({
        queryKey: ['events', 'categories'],
        queryFn: () => eventApiService.getCategories(),
        staleTime: 10 * 60 * 1000, // 10 minutes
    });

    // Hydrate events with Date objects
    const allEvents = useMemo(() => {
        return hydrateEvents(eventsResponse?.data ?? []);
    }, [eventsResponse?.data]);

    // Apply local filters
    const filteredEvents = useMemo(() => {
        const list = filterEventsLocally(allEvents, filters);
        if (filters.sortBy === 'popular') {
            return [...list].sort((a, b) => b.popularityScore - a.popularityScore);
        }
        return [...list].sort((a, b) => a.start.getTime() - b.start.getTime());
    }, [allEvents, filters]);

    // Group events by date
    const groupedEvents = useMemo(() => {
        const groups: Record<string, EventWithDates[]> = {};
        filteredEvents.forEach((event) => {
            const key = getDateKey(event.start);
            if (!groups[key]) groups[key] = [];
            groups[key].push(event);
        });
        return groups;
    }, [filteredEvents]);

    // Events by date (all events, not filtered)
    const eventsByDate = useMemo(() => {
        const groups: Record<string, EventWithDates[]> = {};
        allEvents.forEach((event) => {
            const key = getDateKey(event.start);
            if (!groups[key]) groups[key] = [];
            groups[key].push(event);
        });
        return groups;
    }, [allEvents]);

    // Available neighborhoods
    const availableNeighborhoods = useMemo(() => {
        const unique = new Set(
            allEvents
                .map((event) => event.venue?.bairro?.nome)
                .filter((name): name is string => !!name)
        );
        return Array.from(unique).sort();
    }, [allEvents]);

    // Available venues
    const availableVenues = useMemo(() => {
        const unique = new Set(
            allEvents
                .map((event) => event.venue?.name)
                .filter((name): name is string => !!name)
        );
        return Array.from(unique).sort();
    }, [allEvents]);

    // Available categories
    const availableCategories = useMemo(() => {
        if (categoriesResponse?.data) {
            return categoriesResponse.data;
        }
        return eventApiService.getDefaultCategories();
    }, [categoriesResponse?.data]);

    // Persist filters to localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(STORAGE_FILTERS_KEY, JSON.stringify(filters));
    }, [filters]);

    // Persist favorites to localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(favorites));
    }, [favorites]);

    // Favorite management
    const toggleFavorite = useCallback((eventId: string) => {
        setFavorites((prev) => {
            const next = prev.includes(eventId)
                ? prev.filter((id) => id !== eventId)
                : [...prev, eventId];
            return next;
        });
    }, []);

    const isFavorite = useCallback(
        (eventId: string) => favorites.includes(eventId),
        [favorites]
    );

    // Next event
    const nextEvent = useMemo(() => getNextEvent(allEvents), [allEvents]);

    // Meta information
    const meta = {
        city: 'Tijucas/SC',
        timezone: 'America/Sao_Paulo',
        currency: 'BRL',
        lastUpdated: new Date().toISOString(),
    };

    return {
        meta,
        allEvents,
        filteredEvents,
        groupedEvents,
        eventsByDate,
        filters,
        setFilters,
        availableNeighborhoods,
        availableVenues,
        availableCategories,
        favorites,
        toggleFavorite,
        isFavorite,
        nextEvent,
        isLoading,
        error,
        refetch,
    };
};

// Default export for backwards compatibility
export default useEventFiltersApi;
