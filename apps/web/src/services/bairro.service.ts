// Bairro Service - Offline-First
// Neighborhood data with IndexedDB caching (long TTL since rarely changes)

import { apiClient } from '@/api/client';
import { ENDPOINTS } from '@/api/config';
import { Bairro } from '@/types';
import { bairrosDB } from '@/lib/localDatabase';

// Seed data for first load (dev only)
import { bairros as seedBairros } from '@/data/mockData';

/**
 * Initialize bairros in IndexedDB if empty (first load)
 */
async function ensureInitialized(): Promise<void> {
    const cached = await bairrosDB.getAll();
    if (cached.length === 0 && import.meta.env.DEV) {
        await bairrosDB.saveMany(seedBairros);
        console.log('[BairroService] Initialized with seed data');
    }
}

export const bairroService = {
    /**
     * Get all bairros (neighborhoods)
     * Strategy: API first → IndexedDB fallback
     * Long cache TTL since bairros rarely change
     */
    async getAll(): Promise<Bairro[]> {
        await ensureInitialized();

        try {
            const response = await apiClient.get<{ data: Bairro[] }>(ENDPOINTS.bairros.list);

            // Cache to IndexedDB
            if (response.data && response.data.length > 0) {
                await bairrosDB.clear();
                await bairrosDB.saveMany(response.data);
            }

            return response.data;
        } catch (error) {
            console.warn('[BairroService] API failed, using cache:', error);
            return bairrosDB.getAll();
        }
    },

    /**
     * Get a single bairro by ID
     */
    async getById(id: string): Promise<Bairro | undefined> {
        await ensureInitialized();

        try {
            const response = await apiClient.get<{ data: Bairro }>(ENDPOINTS.bairros.get(id));
            return response.data;
        } catch (error) {
            console.warn('[BairroService] API failed for getById, using cache');
            const bairros = await bairrosDB.getAll();
            return bairros.find(b => b.id === id);
        }
    },

    /**
     * Search bairros by name
     */
    async search(query: string): Promise<Bairro[]> {
        await ensureInitialized();

        const q = query.toLowerCase();
        const bairros = await bairrosDB.getAll();

        return bairros.filter(b => b.nome.toLowerCase().includes(q));
    },

    /**
     * Clear local cache and refetch from API
     */
    async refresh(): Promise<void> {
        await bairrosDB.clear();
        await this.getAll();
    },
};

export default bairroService;
