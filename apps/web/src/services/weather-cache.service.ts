/**
 * Weather Cache - IndexedDB storage for offline-first weather data
 * Implements stale-while-revalidate pattern
 */

// Database configuration
const DB_NAME = 'etijucas-weather-cache';
const DB_VERSION = 1;
const STORE_NAME = 'weather-data';

export type WeatherCacheScope = 'home' | 'forecast' | 'marine' | 'insights' | 'preset' | 'bundle';

// Cache TTLs (in milliseconds)
const CACHE_TTLS = {
    home: 30 * 60 * 1000,      // 30 minutes
    forecast: 60 * 60 * 1000,   // 1 hour
    marine: 60 * 60 * 1000,     // 1 hour
    insights: 30 * 60 * 1000,   // 30 minutes
};

// Types
export interface CacheEntry<T = unknown> {
    key: string;
    data: T;
    cachedAt: number;
    expiresAt: number;
    isStale: boolean;
}

export interface CacheStatus {
    isFromCache: boolean;
    isStale: boolean;
    cachedAt: Date | null;
    isUpdating: boolean;
}

export interface BuildWeatherCacheKeyOptions {
    scope: WeatherCacheScope;
    tenantKey: string;
    days?: number;
    units?: 'metric' | 'imperial';
    sections?: string[];
    presetType?: string;
    params?: Record<string, string | number | boolean | undefined>;
}

// Initialize IndexedDB
let dbPromise: Promise<IDBDatabase> | null = null;

function normalizeSegment(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-');
}

function normalizeSections(sections?: string[]): string {
    if (!sections || sections.length === 0) {
        return 'none';
    }

    const normalized = sections
        .map(normalizeSegment)
        .filter(Boolean);

    normalized.sort();

    return normalized.join(',');
}

/**
 * Build tenant-aware cache key for IndexedDB.
 * Format: weather:{scope}:{tenantKey}:days:{n}:units:{u}:sections:{s}:v1
 */
export function buildWeatherCacheKey(options: BuildWeatherCacheKeyOptions): string {
    const parts: string[] = [
        'weather',
        normalizeSegment(options.scope),
        normalizeSegment(options.tenantKey || 'global'),
    ];

    if (typeof options.days === 'number') {
        parts.push('days', String(options.days));
    }

    if (options.units) {
        parts.push('units', normalizeSegment(options.units));
    }

    if (options.presetType) {
        parts.push('preset', normalizeSegment(options.presetType));
    }

    if (options.sections && options.sections.length > 0) {
        parts.push('sections', normalizeSections(options.sections));
    }

    if (options.params) {
        const paramPairs = Object.entries(options.params)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => `${normalizeSegment(key)}=${normalizeSegment(String(value))}`)
            .sort();

        if (paramPairs.length > 0) {
            parts.push('params', paramPairs.join('&'));
        }
    }

    parts.push('v1');

    return parts.join(':');
}

function getDB(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('IndexedDB open error:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create weather data store
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
                store.createIndex('expiresAt', 'expiresAt', { unique: false });
            }
        };
    });

    return dbPromise;
}

// Get cached data
export async function getCached<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
        const db = await getDB();

        return new Promise((resolve) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);

            request.onsuccess = () => {
                const entry = request.result as CacheEntry<T> | undefined;

                if (!entry) {
                    resolve(null);
                    return;
                }

                // Check if stale
                const now = Date.now();
                const isStale = now > entry.expiresAt;

                resolve({
                    ...entry,
                    isStale,
                });
            };

            request.onerror = () => {
                console.error('Cache read error:', request.error);
                resolve(null);
            };
        });
    } catch (error) {
        console.error('getCached error:', error);
        return null;
    }
}

// Set cached data
export async function setCached<T>(
    key: string,
    data: T,
    ttlType: keyof typeof CACHE_TTLS = 'forecast'
): Promise<void> {
    try {
        const db = await getDB();
        const now = Date.now();
        const ttl = CACHE_TTLS[ttlType];

        const entry: CacheEntry<T> = {
            key,
            data,
            cachedAt: now,
            expiresAt: now + ttl,
            isStale: false,
        };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(entry);

            request.onsuccess = () => resolve();
            request.onerror = () => {
                console.error('Cache write error:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('setCached error:', error);
    }
}

// Delete cached data
export async function deleteCached(key: string): Promise<void> {
    try {
        const db = await getDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('deleteCached error:', error);
    }
}

// Clear all cached data
export async function clearAllCache(): Promise<void> {
    try {
        const db = await getDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('clearAllCache error:', error);
    }
}

// Clear expired entries
export async function clearExpiredCache(): Promise<number> {
    try {
        const db = await getDB();
        const now = Date.now();
        let deletedCount = 0;

        return new Promise((resolve) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('expiresAt');

            // Get all expired entries (expiresAt < now)
            const range = IDBKeyRange.upperBound(now);
            const request = index.openCursor(range);

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

                if (cursor) {
                    cursor.delete();
                    deletedCount++;
                    cursor.continue();
                } else {
                    resolve(deletedCount);
                }
            };

            request.onerror = () => {
                console.error('clearExpiredCache error:', request.error);
                resolve(deletedCount);
            };
        });
    } catch (error) {
        console.error('clearExpiredCache error:', error);
        return 0;
    }
}

// Get cache statistics
export async function getCacheStats(): Promise<{
    totalEntries: number;
    staleEntries: number;
    freshEntries: number;
    totalSizeKB: number;
}> {
    try {
        const db = await getDB();

        return new Promise((resolve) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const entries = request.result as CacheEntry[];
                const now = Date.now();

                const staleEntries = entries.filter(e => now > e.expiresAt).length;
                const freshEntries = entries.length - staleEntries;

                // Estimate size
                const totalSizeKB = Math.round(
                    JSON.stringify(entries).length / 1024
                );

                resolve({
                    totalEntries: entries.length,
                    staleEntries,
                    freshEntries,
                    totalSizeKB,
                });
            };

            request.onerror = () => {
                resolve({
                    totalEntries: 0,
                    staleEntries: 0,
                    freshEntries: 0,
                    totalSizeKB: 0,
                });
            };
        });
    } catch (error) {
        console.error('getCacheStats error:', error);
        return {
            totalEntries: 0,
            staleEntries: 0,
            freshEntries: 0,
            totalSizeKB: 0,
        };
    }
}

// Prefetch common weather data
export async function prefetchWeatherData(): Promise<void> {
    // This will be called on app start to warm up cache
    // The actual fetching is handled by React Query hooks
    console.log('[WeatherCache] Prefetch triggered');

    // Clear expired entries on prefetch
    const deleted = await clearExpiredCache();
    if (deleted > 0) {
        console.log(`[WeatherCache] Cleared ${deleted} expired entries`);
    }
}

// Export cache keys for consistency
export const CACHE_KEYS = {
    HOME: 'weather-home',
    FORECAST: 'weather-forecast',
    MARINE: 'weather-marine',
    INSIGHTS: 'weather-insights',
    BUNDLE: 'weather-bundle',
} as const;

export default {
    getCached,
    setCached,
    deleteCached,
    clearAllCache,
    clearExpiredCache,
    getCacheStats,
    prefetchWeatherData,
    CACHE_KEYS,
};
