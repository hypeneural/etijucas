// Tourism Service - Offline-First
// Tourist spots and attractions with IndexedDB caching

import { apiClient } from '@/api/client';
import { ENDPOINTS } from '@/api/config';
import { TourismSpot } from '@/types';
import { tourismDB } from '@/lib/localDatabase';

// Seed data for first load (dev only)
import { tourismSpots as seedSpots } from '@/data/mockData';

/**
 * Initialize tourism spots in IndexedDB if empty (first load)
 */
async function ensureInitialized(): Promise<void> {
    const cached = await tourismDB.getAll();
    if (cached.length === 0 && import.meta.env.DEV) {
        await tourismDB.saveMany(seedSpots);
        console.log('[TourismService] Initialized with seed data');
    }
}

export const tourismService = {
    /**
     * Get all tourism spots
     * Strategy: API first → IndexedDB fallback
     */
    async getAll(): Promise<TourismSpot[]> {
        await ensureInitialized();

        try {
            const response = await apiClient.get<{ data: TourismSpot[] }>(ENDPOINTS.tourism.spots);

            // Cache to IndexedDB
            if (response.data && response.data.length > 0) {
                await tourismDB.clear();
                await tourismDB.saveMany(response.data);
            }

            return response.data;
        } catch (error) {
            console.warn('[TourismService] API failed, using cache:', error);
            return tourismDB.getAll();
        }
    },

    /**
     * Get a single spot by ID
     */
    async getById(id: string): Promise<TourismSpot | undefined> {
        await ensureInitialized();

        try {
            const response = await apiClient.get<{ data: TourismSpot }>(ENDPOINTS.tourism.get(id));

            // Cache to IndexedDB
            if (response.data) {
                const spots = await tourismDB.getAll();
                const existingIndex = spots.findIndex(s => s.id === id);
                if (existingIndex === -1) {
                    await tourismDB.saveMany([response.data]);
                }
            }

            return response.data;
        } catch (error) {
            console.warn('[TourismService] API failed for getById, using cache');
            const spots = await tourismDB.getAll();
            return spots.find(s => s.id === id);
        }
    },

    /**
     * Get spots by tag
     */
    async getByTag(tag: string): Promise<TourismSpot[]> {
        await ensureInitialized();

        try {
            const response = await apiClient.get<{ data: TourismSpot[] }>(
                ENDPOINTS.tourism.spots,
                { tag }
            );
            return response.data;
        } catch (error) {
            console.warn('[TourismService] API failed for getByTag, using cache');
            const spots = await tourismDB.getAll();
            return spots.filter(s => s.tags.includes(tag));
        }
    },

    /**
     * Search spots by title or description
     */
    async search(query: string): Promise<TourismSpot[]> {
        await ensureInitialized();

        const q = query.toLowerCase();
        const spots = await tourismDB.getAll();

        return spots.filter(
            s => s.titulo.toLowerCase().includes(q) ||
                s.descCurta?.toLowerCase().includes(q) ||
                s.descLonga?.toLowerCase().includes(q) ||
                s.tags.some(t => t.toLowerCase().includes(q))
        );
    },

    /**
     * Clear local cache and refetch from API
     */
    async refresh(): Promise<void> {
        await tourismDB.clear();
        await this.getAll();
    },
};

export default tourismService;
