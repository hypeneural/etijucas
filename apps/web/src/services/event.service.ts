// Event Service - Offline-First
// Agenda/Events with IndexedDB caching and API sync

import { apiClient } from '@/api/client';
import { ENDPOINTS } from '@/api/config';
import { Event } from '@/types';
import { EventFilters, PaginatedResponse } from '@/types/api.types';
import { eventsDB } from '@/lib/localDatabase';

// Seed data for first load (dev only)
import { events as seedEvents } from '@/data/mockData';

/**
 * Initialize events in IndexedDB if empty (first load)
 */
async function ensureInitialized(): Promise<void> {
    const cached = await eventsDB.getAll();
    if (cached.length === 0 && import.meta.env.DEV) {
        await eventsDB.saveMany(seedEvents);
        console.log('[EventService] Initialized with seed data');
    }
}

export const eventService = {
    /**
     * Get all events with optional filters
     * Strategy: API first → IndexedDB fallback
     */
    async getAll(filters?: EventFilters): Promise<PaginatedResponse<Event>> {
        await ensureInitialized();

        try {
            // 1. Try API
            const response = await apiClient.get<PaginatedResponse<Event>>(
                ENDPOINTS.events.list,
                filters as Record<string, string | number | boolean | undefined>
            );

            // Cache to IndexedDB
            if (response.data && response.data.length > 0) {
                await eventsDB.saveMany(response.data);
            }

            return response;
        } catch (error) {
            console.warn('[EventService] API failed, using cache:', error);

            // 2. Fallback to IndexedDB
            let events = await eventsDB.getAll();

            // Apply filters locally
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

            // Sort by date
            events.sort((a, b) =>
                new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
            );

            // Paginate
            const page = filters?.page || 1;
            const perPage = filters?.perPage || 10;
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
        }
    },

    /**
     * Get upcoming events (from today onwards)
     */
    async getUpcoming(limit = 5): Promise<Event[]> {
        await ensureInitialized();

        try {
            const response = await apiClient.get<{ data: Event[] }>(
                ENDPOINTS.events.upcoming,
                { limit }
            );

            // Cache to IndexedDB
            if (response.data && response.data.length > 0) {
                await eventsDB.saveMany(response.data);
            }

            return response.data;
        } catch (error) {
            console.warn('[EventService] API failed for upcoming, using cache');

            const now = new Date();
            const events = await eventsDB.getAll();

            return events
                .filter(e => new Date(e.dateTime) >= now)
                .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
                .slice(0, limit);
        }
    },

    /**
     * Get events for a specific date
     */
    async getByDate(date: string): Promise<Event[]> {
        await ensureInitialized();

        try {
            const response = await apiClient.get<{ data: Event[] }>(
                ENDPOINTS.events.byDate(date)
            );

            // Cache to IndexedDB
            if (response.data && response.data.length > 0) {
                await eventsDB.saveMany(response.data);
            }

            return response.data;
        } catch (error) {
            console.warn('[EventService] API failed for byDate, using cache');

            const targetDate = new Date(date).toDateString();
            const events = await eventsDB.getAll();

            return events.filter(
                e => new Date(e.dateTime).toDateString() === targetDate
            );
        }
    },

    /**
     * Get a single event by ID
     */
    async getById(id: string): Promise<Event | undefined> {
        await ensureInitialized();

        try {
            const response = await apiClient.get<{ data: Event }>(ENDPOINTS.events.get(id));

            // Cache to IndexedDB
            if (response.data) {
                await eventsDB.save(response.data);
            }

            return response.data;
        } catch (error) {
            console.warn('[EventService] API failed for getById, using cache');
            return eventsDB.getById(id);
        }
    },

    /**
     * Clear local cache and refetch from API
     */
    async refresh(): Promise<void> {
        await eventsDB.clear();
        await this.getAll();
    },
};

export default eventService;
