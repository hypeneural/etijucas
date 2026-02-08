/**
 * useCityDetection Hook
 *
 * Provides smart city detection with offline-first approach:
 * 1. URL pattern (/uf/cidade) - highest priority
 * 2. localStorage (last used) - fast fallback
 * 3. GPS + local cache - offline-friendly
 * 4. GPS + API - online fallback
 */

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/api/client';
import {
    CacheableCity,
    cacheCities,
    getCachedCities,
    isCacheStale,
    detectCityOffline,
    findCityBySlugUf,
} from '@/services/city-detection.service';

// Storage keys
const LAST_CITY_KEY = 'etijucas_last_city';

interface DetectionResult {
    city: CacheableCity;
    source: 'url' | 'storage' | 'gps-cache' | 'gps-api';
    distance?: number;
}

interface UseCityDetectionReturn {
    /** Detected city result */
    result: DetectionResult | null;
    /** Detection in progress */
    isDetecting: boolean;
    /** Error message if detection failed */
    error: string | null;
    /** Manually trigger detection */
    detect: () => Promise<DetectionResult | null>;
    /** Sync cities cache from API */
    syncCache: () => Promise<void>;
    /** Save city as last used */
    saveLastCity: (city: CacheableCity) => void;
}

/**
 * Extract city from URL pattern (/uf/cidade)
 */
function extractCityFromUrl(): { uf: string; slug: string } | null {
    const match = window.location.pathname.match(/^\/([a-z]{2})\/([a-z0-9-]+)/i);
    if (!match) return null;
    return { uf: match[1].toUpperCase(), slug: match[2].toLowerCase() };
}

/**
 * Get last used city from storage
 */
function getLastCity(): CacheableCity | null {
    try {
        const stored = localStorage.getItem(LAST_CITY_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

export function useCityDetection(): UseCityDetectionReturn {
    const [result, setResult] = useState<DetectionResult | null>(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Sync cities cache from API
     */
    const syncCache = useCallback(async () => {
        try {
            const response = await apiClient.get<{ data: CacheableCity[] }>('/v1/cities/cacheable');
            if (response.data?.length) {
                await cacheCities(response.data);
            }
        } catch (err) {
            console.warn('[useCityDetection] Failed to sync cache:', err);
        }
    }, []);

    /**
     * Save city as last used
     */
    const saveLastCity = useCallback((city: CacheableCity) => {
        try {
            localStorage.setItem(LAST_CITY_KEY, JSON.stringify(city));
        } catch {
            // Ignore storage errors
        }
    }, []);

    /**
     * Main detection flow
     */
    const detect = useCallback(async (): Promise<DetectionResult | null> => {
        setIsDetecting(true);
        setError(null);

        try {
            // 1. Check URL pattern first
            const urlCity = extractCityFromUrl();
            if (urlCity) {
                const cached = await findCityBySlugUf(urlCity.slug, urlCity.uf);
                if (cached) {
                    const detectionResult: DetectionResult = { city: cached, source: 'url' };
                    setResult(detectionResult);
                    saveLastCity(cached);
                    return detectionResult;
                }
            }

            // 2. Check localStorage
            const lastCity = getLastCity();
            if (lastCity) {
                const detectionResult: DetectionResult = { city: lastCity, source: 'storage' };
                setResult(detectionResult);
                return detectionResult;
            }

            // 3. Try GPS + local cache (offline-first)
            const cachedCities = await getCachedCities();
            if (cachedCities.length > 0) {
                const offlineResult = await detectCityOffline();
                if (offlineResult) {
                    const detectionResult: DetectionResult = {
                        city: offlineResult.city,
                        source: 'gps-cache',
                        distance: offlineResult.distance,
                    };
                    setResult(detectionResult);
                    saveLastCity(offlineResult.city);
                    return detectionResult;
                }
            }

            // 4. Fallback to API detection
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                    });
                });

                const response = await apiClient.get<{ data: CacheableCity }>(
                    `/v1/cities/detect?lat=${position.coords.latitude}&lng=${position.coords.longitude}`
                );

                if (response.data) {
                    const detectionResult: DetectionResult = {
                        city: response.data,
                        source: 'gps-api',
                    };
                    setResult(detectionResult);
                    saveLastCity(response.data);
                    return detectionResult;
                }
            } catch (apiErr) {
                console.warn('[useCityDetection] API detection failed:', apiErr);
            }

            setError('Não foi possível detectar sua cidade');
            return null;
        } finally {
            setIsDetecting(false);
        }
    }, [saveLastCity]);

    // Sync cache on mount if stale
    useEffect(() => {
        const checkAndSync = async () => {
            if (await isCacheStale()) {
                await syncCache();
            }
        };
        checkAndSync();
    }, [syncCache]);

    return {
        result,
        isDetecting,
        error,
        detect,
        syncCache,
        saveLastCity,
    };
}

export default useCityDetection;
