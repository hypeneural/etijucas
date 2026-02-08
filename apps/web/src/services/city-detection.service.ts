/**
 * City Detection Service
 *
 * Provides offline-first city detection using cached city coordinates
 * and Haversine distance formula.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Types
export interface CacheableCity {
    id: string;
    slug: string;
    name: string;
    uf: string;
    lat: number;
    lon: number;
}

interface CityDetectionDB extends DBSchema {
    cities: {
        key: string;
        value: CacheableCity;
        indexes: { 'by-uf': string };
    };
    meta: {
        key: string;
        value: { key: string; value: string | number };
    };
}

// Constants
const DB_NAME = 'etijucas-cities';
const DB_VERSION = 1;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_DETECTION_DISTANCE_KM = 50; // Max distance to match a city

let dbInstance: IDBPDatabase<CityDetectionDB> | null = null;

/**
 * Initialize the IndexedDB database
 */
async function getDB(): Promise<IDBPDatabase<CityDetectionDB>> {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB<CityDetectionDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Cities store
            if (!db.objectStoreNames.contains('cities')) {
                const citiesStore = db.createObjectStore('cities', { keyPath: 'id' });
                citiesStore.createIndex('by-uf', 'uf');
            }
            // Metadata store
            if (!db.objectStoreNames.contains('meta')) {
                db.createObjectStore('meta', { keyPath: 'key' });
            }
        },
    });

    return dbInstance;
}

/**
 * Haversine formula to calculate distance between two coordinates
 * @returns Distance in kilometers
 */
export function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Get all cached cities
 */
export async function getCachedCities(): Promise<CacheableCity[]> {
    try {
        const db = await getDB();
        return await db.getAll('cities');
    } catch (error) {
        console.warn('[CityDetection] Failed to get cached cities:', error);
        return [];
    }
}

/**
 * Get cached cities by UF
 */
export async function getCachedCitiesByUf(uf: string): Promise<CacheableCity[]> {
    try {
        const db = await getDB();
        return await db.getAllFromIndex('cities', 'by-uf', uf.toUpperCase());
    } catch (error) {
        console.warn('[CityDetection] Failed to get cities by UF:', error);
        return [];
    }
}

/**
 * Save cities to cache
 */
export async function cacheCities(cities: CacheableCity[]): Promise<void> {
    try {
        const db = await getDB();
        const tx = db.transaction(['cities', 'meta'], 'readwrite');

        // Clear and repopulate
        await tx.objectStore('cities').clear();

        for (const city of cities) {
            await tx.objectStore('cities').put(city);
        }

        // Update cache timestamp
        await tx.objectStore('meta').put({
            key: 'lastSync',
            value: Date.now(),
        });

        await tx.done;
        console.log(`[CityDetection] Cached ${cities.length} cities`);
    } catch (error) {
        console.error('[CityDetection] Failed to cache cities:', error);
    }
}

/**
 * Check if cache needs refresh
 */
export async function isCacheStale(): Promise<boolean> {
    try {
        const db = await getDB();
        const meta = await db.get('meta', 'lastSync');

        if (!meta) return true;

        const lastSync = meta.value as number;
        return Date.now() - lastSync > CACHE_TTL_MS;
    } catch {
        return true;
    }
}

/**
 * Find nearest city to given coordinates (OFFLINE)
 */
export async function findNearestCity(
    userLat: number,
    userLon: number
): Promise<{ city: CacheableCity; distance: number } | null> {
    const cities = await getCachedCities();

    if (cities.length === 0) {
        console.log('[CityDetection] No cached cities available');
        return null;
    }

    let nearest: CacheableCity | null = null;
    let minDistance = Infinity;

    for (const city of cities) {
        if (!city.lat || !city.lon) continue;

        const distance = haversineDistance(userLat, userLon, city.lat, city.lon);

        if (distance < minDistance && distance <= MAX_DETECTION_DISTANCE_KM) {
            minDistance = distance;
            nearest = city;
        }
    }

    if (nearest) {
        console.log(`[CityDetection] Found nearest city: ${nearest.name}/${nearest.uf} (${minDistance.toFixed(1)}km)`);
        return { city: nearest, distance: minDistance };
    }

    console.log('[CityDetection] No city found within range');
    return null;
}

/**
 * Find city by slug and UF (OFFLINE)
 */
export async function findCityBySlugUf(
    slug: string,
    uf: string
): Promise<CacheableCity | null> {
    const cities = await getCachedCitiesByUf(uf);
    return cities.find(c => c.slug === slug.toLowerCase()) || null;
}

/**
 * Get current GPS position
 */
export function getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
            }
        );
    });
}

/**
 * Detect city based on GPS (OFFLINE-FIRST)
 */
export async function detectCityOffline(): Promise<{
    city: CacheableCity;
    distance: number;
    source: 'cache' | 'gps';
} | null> {
    try {
        const position = await getCurrentPosition();
        const result = await findNearestCity(
            position.coords.latitude,
            position.coords.longitude
        );

        if (result) {
            return { ...result, source: 'cache' };
        }

        return null;
    } catch (error) {
        console.warn('[CityDetection] GPS detection failed:', error);
        return null;
    }
}
