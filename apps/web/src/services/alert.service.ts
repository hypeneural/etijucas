// Alert Service - Offline-First
// City alerts and notifications with IndexedDB caching

import { apiClient } from '@/api/client';
import { ENDPOINTS } from '@/api/config';
import { Alert } from '@/types';
import { alertsDB } from '@/lib/localDatabase';

// Seed data for first load (dev only)
import { alerts as seedAlerts } from '@/data/mockData';

/**
 * Initialize alerts in IndexedDB if empty (first load)
 */
async function ensureInitialized(): Promise<void> {
    const cached = await alertsDB.getAll();
    if (cached.length === 0 && import.meta.env.DEV) {
        await alertsDB.saveMany(seedAlerts);
        console.log('[AlertService] Initialized with seed data');
    }
}

export const alertService = {
    /**
     * Get all alerts
     * Strategy: API first → IndexedDB fallback
     */
    async getAll(): Promise<Alert[]> {
        await ensureInitialized();

        try {
            const response = await apiClient.get<{ data: Alert[] }>(ENDPOINTS.alerts.list);

            // Cache to IndexedDB
            if (response.data && response.data.length > 0) {
                await alertsDB.clear();
                await alertsDB.saveMany(response.data);
            }

            return response.data;
        } catch (error) {
            console.warn('[AlertService] API failed, using cache:', error);
            return alertsDB.getAll();
        }
    },

    /**
     * Get active alerts (not expired)
     */
    async getActive(): Promise<Alert[]> {
        await ensureInitialized();

        try {
            const response = await apiClient.get<{ data: Alert[] }>(ENDPOINTS.alerts.active);

            // Cache to IndexedDB
            if (response.data && response.data.length > 0) {
                await alertsDB.saveMany(response.data);
            }

            return response.data;
        } catch (error) {
            console.warn('[AlertService] API failed for getActive, using cache');

            // Filter cached alerts that are still active
            const alerts = await alertsDB.getAll();
            const now = new Date();

            return alerts.filter(a => {
                // If no expiration, consider active
                if (!a.expiresAt) return true;
                return new Date(a.expiresAt) > now;
            });
        }
    },

    /**
     * Get alerts by bairro
     */
    async getByBairro(bairroId: string): Promise<Alert[]> {
        await ensureInitialized();

        try {
            const response = await apiClient.get<{ data: Alert[] }>(
                ENDPOINTS.alerts.list,
                { bairroId }
            );
            return response.data;
        } catch (error) {
            console.warn('[AlertService] API failed for getByBairro, using cache');
            const alerts = await alertsDB.getAll();

            // Return alerts for this bairro OR city-wide alerts (no bairroId)
            return alerts.filter(a => a.bairroId === bairroId || !a.bairroId);
        }
    },

    /**
     * Clear local cache and refetch from API
     */
    async refresh(): Promise<void> {
        await alertsDB.clear();
        await this.getAll();
    },
};

export default alertService;
