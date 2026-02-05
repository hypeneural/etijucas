/**
 * home.service.ts - Service for Home aggregator API
 * 
 * Uses the /api/v1/home endpoint to fetch all home data in a single request.
 */

import { apiClient } from '@/api/client';
import { HomeDataResponse, BoletimDoDiaPayload, TijucanosCounterPayload } from '@/types/home.types';

const HOME_ENDPOINT = '/home';
const BOLETIM_ENDPOINT = '/today/brief';
const STATS_ENDPOINT = '/stats/users';

export interface HomeQueryParams {
    bairro_id?: string;
    include?: string[];
    version?: number;
}

// Standard API response wrapper
interface ApiResponse<T> {
    success: boolean;
    data: T;
}

/**
 * Fetch all home data in a single request
 */
/**
 * Fetch all home data in a single request
 */
export async function getHomeData(params?: HomeQueryParams): Promise<HomeDataResponse> {
    const queryParams = new URLSearchParams();

    if (params?.bairro_id) {
        queryParams.set('bairro_id', params.bairro_id);
    }

    if (params?.include && params.include.length > 0) {
        queryParams.set('include', params.include.join(','));
    }

    if (params?.version) {
        queryParams.set('version', params.version.toString());
    }

    const queryString = queryParams.toString();
    const url = queryString ? `${HOME_ENDPOINT}?${queryString}` : HOME_ENDPOINT;

    // Use any to inspect the structure safely
    const response = await apiClient.get<any>(url);
    console.log('[HomeService] Raw home data:', response);

    // Initial check: if response has 'data' property that holds the payload (Laravel Resource)
    if (response.data && !response.boletim) {
        return response.data;
    }

    // Fallback: maybe it's not wrapped or custom structure
    return response;
}

/**
 * Fetch the Boletim do Dia (daily brief)
 */
export async function getBoletimDoDia(bairroId?: string): Promise<BoletimDoDiaPayload> {
    const queryParams = bairroId ? `?bairro_id=${bairroId}` : '';
    const response = await apiClient.get<any>(
        `${BOLETIM_ENDPOINT}${queryParams}`
    );
    return response.data || response;
}

/**
 * Fetch user stats for Tijucanos counter
 */
export async function getUserStats(): Promise<TijucanosCounterPayload> {
    const response = await apiClient.get<any>(
        STATS_ENDPOINT
    );
    return response.data || response;
}

export const homeService = {
    getHomeData,
    getBoletimDoDia,
    getUserStats,
};

export default homeService;

