// ======================================================
// Event Filters Hook - Connected to Real API
// No mock data - fully API-powered
// ======================================================

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useEvents, useEventCategories } from '@/hooks/queries/useEventsApi';
import type {
  EventFiltersState,
  EventWithDates,
  EventItem,
  EventCategory,
} from '@/types/events';
import type { EventFiltersParams } from '@/types/events.api';
import {
  getDateKey,
  getTimeOfDay,
  isToday,
  isTomorrow,
  isWeekend,
  getNextEvent,
} from '@/utils/date';
import { endOfDay, isWithinInterval, parseISO, startOfDay } from 'date-fns';

const STORAGE_FILTERS_KEY = 'etijucas_event_filters';
const STORAGE_FAVORITES_KEY = 'etijucas_event_favorites';

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

// Hydrate events with parsed Date objects
const hydrateEvents = (events: unknown[]): EventWithDates[] =>
  (events as EventItem[]).map((event) => ({
    ...event,
    start: parseISO(event.startDateTime),
    end: parseISO(event.endDateTime),
  }));

// Load filters from localStorage
const loadFilters = (): EventFiltersState => {
  if (typeof window === 'undefined') return DEFAULT_FILTERS;
  try {
    const stored = window.localStorage.getItem(STORAGE_FILTERS_KEY);
    if (!stored) return DEFAULT_FILTERS;
    const parsed = JSON.parse(stored) as Partial<EventFiltersState>;
    return { ...DEFAULT_FILTERS, ...parsed };
  } catch {
    return DEFAULT_FILTERS;
  }
};

// Load favorites from localStorage
const loadFavorites = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_FAVORITES_KEY);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
};

// Convert UI filters to API query params
const filtersToApiParams = (filters: EventFiltersState): EventFiltersParams => {
  const params: EventFiltersParams = {
    perPage: 100,
  };

  if (filters.search) params.search = filters.search;
  if (filters.categories.length > 0) params.category = filters.categories[0];
  if (filters.neighborhoods.length > 0) params.bairroId = filters.neighborhoods[0];
  if (filters.venues.length > 0) params.venueId = filters.venues[0];

  // Date presets
  if (filters.datePreset === 'today') params.datePreset = 'today';
  else if (filters.datePreset === 'tomorrow') params.datePreset = 'tomorrow';
  else if (filters.datePreset === 'weekend') params.datePreset = 'weekend';
  else if (filters.datePreset === 'this_week') params.datePreset = 'this_week';
  else if (filters.datePreset === 'this_month') params.datePreset = 'this_month';
  else if (filters.datePreset === 'range' && filters.dateRange.start && filters.dateRange.end) {
    params.fromDate = filters.dateRange.start;
    params.toDate = filters.dateRange.end;
  }

  // Price filter
  if (filters.price === 'free') params.price = 'free';
  else if (filters.price === 'paid') {
    params.price = 'paid';
    if (filters.priceRange[0] > 0) params.priceMin = filters.priceRange[0];
    if (filters.priceRange[1] < 150) params.priceMax = filters.priceRange[1];
  }

  // Time of day
  if (filters.timeOfDay.length > 0) params.timeOfDay = filters.timeOfDay[0];

  // Boolean flags
  if (filters.accessibility) params.accessibility = true;
  if (filters.parking) params.parking = true;
  if (filters.outdoor) params.outdoor = true;
  if (filters.kids) params.kids = true;

  // Sorting
  if (filters.sortBy === 'popular') {
    params.orderBy = 'popularityScore';
    params.order = 'desc';
  } else {
    params.orderBy = 'startDateTime';
    params.order = 'asc';
  }

  return params;
};

// Client-side filtering for additional filters
export const filterEvents = (
  events: EventWithDates[],
  filters: EventFiltersState
): EventWithDates[] => {
  const search = filters.search.trim().toLowerCase();

  return events.filter((event) => {
    // Search filter
    if (search) {
      const inTitle = event.title.toLowerCase().includes(search);
      const inVenue = event.venue?.name?.toLowerCase().includes(search) ?? false;
      const inBairro = event.venue?.bairro?.nome?.toLowerCase().includes(search) ?? false;
      const inTags = event.tags.some((tag) => {
        const tagStr = typeof tag === 'string' ? tag : tag.name;
        return tagStr.toLowerCase().includes(search);
      });
      if (!inTitle && !inVenue && !inBairro && !inTags) {
        return false;
      }
    }

    // Category filter (by slug)
    if (filters.categories.length > 0 && event.category) {
      const categorySlug = typeof event.category === 'string'
        ? event.category
        : event.category.slug;
      if (!filters.categories.includes(categorySlug)) {
        return false;
      }
    }

    // Neighborhood filter (by bairro nome)
    if (filters.neighborhoods.length > 0 && event.venue?.bairro) {
      if (!filters.neighborhoods.includes(event.venue.bairro.nome) &&
        !filters.neighborhoods.includes(event.venue.bairro.id)) {
        return false;
      }
    }

    // Venue filter
    if (filters.venues.length > 0 && event.venue) {
      if (!filters.venues.includes(event.venue.name) &&
        !filters.venues.includes(event.venue.id)) {
        return false;
      }
    }

    // Price filter
    if (filters.price === 'free' && event.ticket?.type !== 'free') return false;
    if (filters.price === 'paid' && event.ticket?.type !== 'paid') return false;
    if (filters.price === 'paid' && event.ticket?.type === 'paid') {
      const [minPrice, maxPrice] = filters.priceRange;
      const eventPrice = event.ticket?.minPrice ?? 0;
      if (eventPrice < minPrice || eventPrice > maxPrice) {
        return false;
      }
    }

    // Date preset filter (client-side backup)
    if (filters.datePreset === 'today' && !isToday(event.start)) return false;
    if (filters.datePreset === 'tomorrow' && !isTomorrow(event.start)) return false;
    if (filters.datePreset === 'weekend' && !isWeekend(event.start)) return false;
    if (filters.datePreset === 'range' && filters.dateRange.start && filters.dateRange.end) {
      const range = {
        start: startOfDay(parseISO(filters.dateRange.start)),
        end: endOfDay(parseISO(filters.dateRange.end)),
      };
      if (!isWithinInterval(event.start, range)) return false;
    }

    // Time of day filter
    if (filters.timeOfDay.length > 0) {
      const period = getTimeOfDay(event.start);
      if (!filters.timeOfDay.includes(period as 'morning' | 'afternoon' | 'night')) return false;
    }

    // Flags filters
    if (filters.accessibility && !event.flags?.accessibility) return false;
    if (filters.parking && !event.flags?.parking) return false;
    if (filters.outdoor && !event.flags?.outdoor) return false;

    return true;
  });
};

export const useEventFilters = () => {
  const [filters, setFilters] = useState<EventFiltersState>(loadFilters);
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);

  // Convert filters to API params
  const apiParams = useMemo(() => filtersToApiParams(filters), [filters]);

  // Fetch events from API
  const { data: eventsResponse, isLoading, error } = useEvents(apiParams);

  // Fetch categories for filter options
  const { data: categoriesResponse } = useEventCategories();

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

  // Hydrate events with parsed dates
  const allEvents = useMemo((): EventWithDates[] => {
    if (!eventsResponse?.data) return [];
    return hydrateEvents(eventsResponse.data);
  }, [eventsResponse?.data]);

  // Apply client-side filtering
  const filteredEvents = useMemo(() => {
    const list = filterEvents(allEvents, filters);
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

  // Group all events by date (for calendar)
  const eventsByDate = useMemo(() => {
    const groups: Record<string, EventWithDates[]> = {};
    allEvents.forEach((event) => {
      const key = getDateKey(event.start);
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    });
    return groups;
  }, [allEvents]);

  // Extract unique neighborhoods
  const availableNeighborhoods = useMemo(() => {
    const unique = new Set(
      allEvents
        .filter((e) => e.venue?.bairro?.nome)
        .map((e) => e.venue!.bairro!.nome)
    );
    return Array.from(unique).sort();
  }, [allEvents]);

  // Extract unique venues
  const availableVenues = useMemo(() => {
    const unique = new Set(
      allEvents
        .filter((e) => e.venue?.name)
        .map((e) => e.venue!.name)
    );
    return Array.from(unique).sort();
  }, [allEvents]);

  // Use categories from API
  const availableCategories = useMemo((): EventCategory[] => {
    if (categoriesResponse?.data) {
      return categoriesResponse.data as unknown as EventCategory[];
    }
    // Fallback: extract from events
    const categoryMap = new Map<string, EventCategory>();
    allEvents.forEach((e) => {
      if (e.category && typeof e.category === 'object') {
        categoryMap.set(e.category.slug, e.category);
      }
    });
    return Array.from(categoryMap.values());
  }, [categoriesResponse?.data, allEvents]);

  // Toggle favorite
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

  // Get next upcoming event
  const nextEvent = useMemo(() => {
    return getNextEvent(allEvents);
  }, [allEvents]);

  // Meta information
  const meta = useMemo(() => ({
    page: eventsResponse?.meta?.page ?? 1,
    perPage: eventsResponse?.meta?.perPage ?? 100,
    lastPage: eventsResponse?.meta?.lastPage ?? 1,
    total: eventsResponse?.meta?.total ?? 0,
  }), [eventsResponse?.meta]);

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
  };
};
