import { get, set, del } from 'idb-keyval';
import { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

const CACHE_KEY = 'etijucas-react-query-cache';

/**
 * Creates an IndexedDB persister for React Query
 * This allows the cache to survive page reloads and work offline
 */
export function createIDBPersister(): Persister {
    return {
        persistClient: async (client: PersistedClient) => {
            try {
                await set(CACHE_KEY, client);
            } catch (error) {
                console.warn('Failed to persist React Query cache:', error);
            }
        },
        restoreClient: async () => {
            try {
                return await get<PersistedClient>(CACHE_KEY);
            } catch (error) {
                console.warn('Failed to restore React Query cache:', error);
                return undefined;
            }
        },
        removeClient: async () => {
            try {
                await del(CACHE_KEY);
            } catch (error) {
                console.warn('Failed to remove React Query cache:', error);
            }
        },
    };
}

// Singleton instance
export const idbPersister = createIDBPersister();
