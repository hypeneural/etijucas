/**
 * useCityRoute - Hook for generating city-aware routes
 * 
 * When in multi-city mode (URL has /uf/cidade prefix), preserves the prefix.
 * Falls back to normal routes when accessing via root domain.
 */

import { useMemo } from 'react';
import { useTenantStore } from '@/store/useTenantStore';

interface UseCityRouteResult {
    /**
     * Generate a route with city prefix if applicable
     * Example: buildRoute('/coleta-lixo') => '/sc/itajai/coleta-lixo' or '/coleta-lixo'
     */
    buildRoute: (path: string) => string;

    /**
     * Current city path prefix (e.g., '/sc/tijucas' or '')
     */
    prefix: string;

    /**
     * Whether we're in multi-city URL mode
     */
    isMultiCityMode: boolean;
}

export function useCityRoute(): UseCityRouteResult {
    const city = useTenantStore((state) => state.city);

    // Detect if current URL has /uf/cidade prefix
    const { prefix, isMultiCityMode } = useMemo(() => {
        const path = window.location.pathname;
        const match = path.match(/^\/([a-z]{2})\/([a-z0-9-]+)/i);

        if (match) {
            const [fullMatch] = match;
            return { prefix: fullMatch, isMultiCityMode: true };
        }

        return { prefix: '', isMultiCityMode: false };
    }, []);

    const buildRoute = (path: string): string => {
        // If not in multi-city mode, return path as-is
        if (!isMultiCityMode) {
            return path;
        }

        // Ensure path starts with /
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;

        // Avoid double prefix
        if (normalizedPath.startsWith(prefix)) {
            return normalizedPath;
        }

        return `${prefix}${normalizedPath}`;
    };

    return { buildRoute, prefix, isMultiCityMode };
}

export default useCityRoute;
