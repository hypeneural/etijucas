/**
 * useHomeData - Offline-First Hook for Home Aggregator
 * 
 * Strategy:
 * 1. Return cached data immediately (stale-while-revalidate)
 * 2. Fetch fresh data in background
 * 3. Update UI seamlessly when new data arrives
 * 4. Auto-refetch when coming back online
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { homeService } from '@/services/home.service';
import { useNetworkStatus } from './useNetworkStatus';
import { useAppStore } from '@/store/useAppStore';
import {
    HomeDataResponse,
    BoletimDoDiaPayload,
    TijucanosCounterPayload,
    getAlertBanner,
    getWeatherMini,
    getBoletimDoDia,
    getFiscalizaVivo,
    getForumVivo,
    getQuickAccess,
    getEventsCarousel,
    getTourismCarousel,
    getTijucanosCounter,
} from '@/types/home.types';

// Query keys
const HOME_KEY = ['home', 'aggregator'] as const;
const BOLETIM_KEY = ['home', 'boletim'] as const;
const STATS_KEY = ['home', 'stats'] as const;

// Cache config
const STALE_TIME = 1000 * 60 * 5; // 5 minutes
const GC_TIME = 1000 * 60 * 60; // 1 hour

/**
 * Main hook - fetches all home data in a single request
 */
export function useHomeData(options?: { enabled?: boolean }) {
    const { isOnline } = useNetworkStatus();
    const queryClient = useQueryClient();
    const { selectedBairro } = useAppStore();

    const query = useQuery<HomeDataResponse>({
        queryKey: [...HOME_KEY, selectedBairro?.id],
        queryFn: async () => {
            console.log('[useHomeData] Fetching home data...', { bairro_id: selectedBairro?.id });
            try {
                const data = await homeService.getHomeData({
                    bairro_id: selectedBairro?.id || undefined,
                });
                console.log('[useHomeData] Success:', data);
                return data;
            } catch (error) {
                console.error('[useHomeData] Error fetching home data:', error);
                throw error;
            }
        },
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        enabled: options?.enabled !== false,
        retry: 2,
    });

    // Refetch when coming back online
    useEffect(() => {
        if (isOnline) {
            queryClient.invalidateQueries({ queryKey: HOME_KEY });
        }
    }, [isOnline, queryClient]);

    // Manual refresh
    const refresh = useCallback(() => {
        return queryClient.invalidateQueries({ queryKey: HOME_KEY });
    }, [queryClient]);

    // Typed block getters
    const alerts = getAlertBanner(query.data);
    const weather = getWeatherMini(query.data);
    const boletim = getBoletimDoDia(query.data);
    const fiscaliza = getFiscalizaVivo(query.data);
    const forum = getForumVivo(query.data);
    const quickAccess = getQuickAccess(query.data);
    const events = getEventsCarousel(query.data);
    const tourism = getTourismCarousel(query.data);
    const stats = getTijucanosCounter(query.data);

    return {
        // Query state
        ...query,
        refresh,

        // Meta
        meta: query.data?.meta,
        isStale: query.isStale,

        // Typed blocks
        blocks: {
            alerts,
            weather,
            boletim,
            fiscaliza,
            forum,
            quickAccess,
            events,
            tourism,
            stats,
        },
    };
}

/**
 * Lightweight hook - just the Boletim do Dia
 */
export function useBoletimDoDia() {
    const { isOnline } = useNetworkStatus();
    const { selectedBairro } = useAppStore();

    return useQuery<BoletimDoDiaPayload>({
        queryKey: [...BOLETIM_KEY, selectedBairro?.id],
        queryFn: () => homeService.getBoletimDoDia(selectedBairro?.id || undefined),
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        enabled: isOnline,
    });
}

/**
 * User stats for Tijucanos counter
 */
export function useUserStats() {
    const { isOnline } = useNetworkStatus();

    return useQuery<TijucanosCounterPayload>({
        queryKey: STATS_KEY,
        queryFn: () => homeService.getUserStats(),
        staleTime: 1000 * 60 * 10, // 10 minutes (less frequent)
        gcTime: GC_TIME,
        enabled: isOnline,
    });
}

export default {
    useHomeData,
    useBoletimDoDia,
    useUserStats,
};
