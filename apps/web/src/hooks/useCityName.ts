/**
 * useCityName Hook
 * 
 * Returns dynamic city name from tenant store.
 * Provides fallback for when tenant is not yet bootstrapped.
 */

import { useTenantStore } from '@/store/useTenantStore';
import { DEFAULT_CITY } from '@/constants/tenant';

interface CityInfo {
    name: string;
    fullName: string;
    uf: string;
    slug: string | null;
}

/**
 * Get current city info from tenant store with fallback
 */
export function useCityName(): CityInfo {
    const city = useTenantStore((s) => s.city);

    return {
        name: city?.name ?? DEFAULT_CITY.name,
        fullName: city?.fullName ?? DEFAULT_CITY.fullName,
        uf: city?.uf ?? DEFAULT_CITY.uf,
        slug: city?.slug ?? null,
    };
}

/**
 * Get brand name for the app (e.g., "eTijucas", "eFloripa")
 */
export function useAppName(): string {
    const brand = useTenantStore((s) => s.brand);
    const city = useTenantStore((s) => s.city);

    return brand?.appName ?? `e${city?.name ?? DEFAULT_CITY.name}`;
}

/**
 * Static getter for non-hook contexts
 */
export function getCityName(): string {
    return useTenantStore.getState().city?.name ?? DEFAULT_CITY.name;
}

export function getCityFullName(): string {
    return useTenantStore.getState().city?.fullName ?? DEFAULT_CITY.fullName;
}

export default useCityName;
