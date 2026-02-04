/**
 * useOfflineWeather - React Query + IndexedDB integration
 * Stale-while-revalidate pattern for offline-first weather data
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { getCached, setCached, CACHE_KEYS, type CacheStatus } from '@/services/weather-cache.service';

// Types for the hook
interface UseOfflineQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
    cacheKey: string;
    ttlType?: 'home' | 'forecast' | 'marine' | 'insights';
}

interface UseOfflineQueryResult<T> {
    data: T | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    isFetching: boolean;
    refetch: () => Promise<void>;
    cacheStatus: CacheStatus;
}

/**
 * Hook that wraps React Query with IndexedDB cache
 * Returns data from cache immediately, then updates from network
 */
export function useOfflineQuery<T>(
    queryKey: string[],
    queryFn: () => Promise<T>,
    options: UseOfflineQueryOptions<T>
): UseOfflineQueryResult<T> {
    const { cacheKey, ttlType = 'forecast', ...queryOptions } = options;
    const queryClient = useQueryClient();

    const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
        isFromCache: false,
        isStale: false,
        cachedAt: null,
        isUpdating: false,
    });

    // Load from IndexedDB on mount
    useEffect(() => {
        const loadFromCache = async () => {
            try {
                const cached = await getCached<T>(cacheKey);

                if (cached) {
                    // Set cached data as initial data
                    queryClient.setQueryData(queryKey, cached.data);

                    setCacheStatus({
                        isFromCache: true,
                        isStale: cached.isStale,
                        cachedAt: new Date(cached.cachedAt),
                        isUpdating: cached.isStale, // Will update if stale
                    });
                }
            } catch (error) {
                console.error('[useOfflineQuery] Cache load error:', error);
            }
        };

        loadFromCache();
    }, [cacheKey, queryKey, queryClient]);

    // Main query
    const query = useQuery({
        queryKey,
        queryFn: async () => {
            setCacheStatus(prev => ({ ...prev, isUpdating: true }));

            try {
                const data = await queryFn();

                // Save to IndexedDB
                await setCached(cacheKey, data, ttlType);

                setCacheStatus({
                    isFromCache: false,
                    isStale: false,
                    cachedAt: new Date(),
                    isUpdating: false,
                });

                return data;
            } catch (error) {
                setCacheStatus(prev => ({ ...prev, isUpdating: false }));
                throw error;
            }
        },
        // Use stale data while revalidating
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 60, // 1 hour (previously cacheTime)
        retry: 2,
        retryDelay: 1000,
        ...queryOptions,
    });

    const refetch = useCallback(async () => {
        setCacheStatus(prev => ({ ...prev, isUpdating: true }));
        await query.refetch();
    }, [query]);

    return {
        data: query.data,
        isLoading: query.isLoading && !cacheStatus.isFromCache,
        isError: query.isError,
        error: query.error as Error | null,
        isFetching: query.isFetching,
        refetch,
        cacheStatus,
    };
}

/**
 * Hook to detect network status
 */
export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return { isOnline, isOffline: !isOnline };
}

/**
 * Format cache age for display
 */
export function formatCacheAge(cachedAt: Date | null): string {
    if (!cachedAt) return '';

    const now = new Date();
    const diffMs = now.getTime() - cachedAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'agora mesmo';
    if (diffMins === 1) return 'há 1 minuto';
    if (diffMins < 60) return `há ${diffMins} minutos`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'há 1 hora';
    if (diffHours < 24) return `há ${diffHours} horas`;

    return 'há mais de um dia';
}

export default useOfflineQuery;
