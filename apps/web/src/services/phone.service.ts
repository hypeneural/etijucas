// Phone Service - Offline-First
// Useful phone numbers with IndexedDB caching

import { apiClient } from '@/api/client';
import { ENDPOINTS } from '@/api/config';
import { UsefulPhone, PhoneCategory } from '@/types';
import { phonesDB } from '@/lib/localDatabase';

// Seed data for first load (dev only)
import { usefulPhones as seedPhones } from '@/data/mockData';

/**
 * Initialize phones in IndexedDB if empty (first load)
 */
async function ensureInitialized(): Promise<void> {
    const cached = await phonesDB.getAll();
    if (cached.length === 0 && import.meta.env.DEV) {
        await phonesDB.saveMany(seedPhones);
        console.log('[PhoneService] Initialized with seed data');
    }
}

export const phoneService = {
    /**
     * Get all useful phones
     * Strategy: API first → IndexedDB fallback
     */
    async getAll(): Promise<UsefulPhone[]> {
        await ensureInitialized();

        try {
            const response = await apiClient.get<{ data: UsefulPhone[] }>(ENDPOINTS.phones.list);

            // Cache to IndexedDB
            if (response.data && response.data.length > 0) {
                await phonesDB.saveMany(response.data);
            }

            return response.data;
        } catch (error) {
            console.warn('[PhoneService] API failed, using cache:', error);
            return phonesDB.getAll();
        }
    },

    /**
     * Get phones by category
     */
    async getByCategory(categoria: PhoneCategory): Promise<UsefulPhone[]> {
        await ensureInitialized();

        try {
            const response = await apiClient.get<{ data: UsefulPhone[] }>(
                ENDPOINTS.phones.byCategory(categoria)
            );

            // Cache to IndexedDB
            if (response.data && response.data.length > 0) {
                await phonesDB.saveMany(response.data);
            }

            return response.data;
        } catch (error) {
            console.warn('[PhoneService] API failed for byCategory, using cache');
            const phones = await phonesDB.getAll();
            return phones.filter(p => p.categoria === categoria);
        }
    },

    /**
     * Search phones by name or description
     */
    async search(query: string): Promise<UsefulPhone[]> {
        await ensureInitialized();

        try {
            const response = await apiClient.get<{ data: UsefulPhone[] }>(
                ENDPOINTS.phones.list,
                { search: query }
            );

            return response.data;
        } catch (error) {
            console.warn('[PhoneService] API failed for search, using cache');
            const q = query.toLowerCase();
            const phones = await phonesDB.getAll();

            return phones.filter(
                p => p.nome.toLowerCase().includes(q) ||
                    p.descricao?.toLowerCase().includes(q)
            );
        }
    },

    /**
     * Get emergency phones (pinned at top)
     */
    async getEmergency(): Promise<UsefulPhone[]> {
        const phones = await this.getAll();
        return phones.filter(p => p.categoria === 'emergencias' || p.isPinned);
    },

    /**
     * Clear local cache and refetch from API
     */
    async refresh(): Promise<void> {
        await phonesDB.clear();
        await this.getAll();
    },
};

export default phoneService;
