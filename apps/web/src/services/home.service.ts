/**
 * home.service.ts - Service for Home aggregator API
 * 
 * Uses the /api/v1/home endpoint to fetch all home data in a single request.
 */

import api from '@/lib/api';
import { HomeDataResponse, BoletimDoDiaPayload, TijucanosCounterPayload } from '@/types/home.types';

const HOME_ENDPOINT = '/v1/home';
const BOLETIM_ENDPOINT = '/v1/today/brief';
const STATS_ENDPOINT = '/v1/stats/users';

export interface HomeQueryParams {
    bairro_id?: string;
    include?: string[];
    version?: number;
}

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

    const response = await api.get<HomeDataResponse>(url);
    return response.data;
}

/**
 * Fetch the Boletim do Dia (daily brief)
 */
export async function getBoletimDoDia(bairroId?: string): Promise<BoletimDoDiaPayload> {
    const queryParams = bairroId ? `?bairro_id=${bairroId}` : '';
    const response = await api.get<{ success: boolean; data: BoletimDoDiaPayload }>(
        `${BOLETIM_ENDPOINT}${queryParams}`
    );
    return response.data.data;
}

/**
 * Fetch user stats for Tijucanos counter
 */
export async function getUserStats(): Promise<TijucanosCounterPayload> {
    const response = await api.get<{ success: boolean; data: TijucanosCounterPayload }>(
        STATS_ENDPOINT
    );
    return response.data.data;
}

export const homeService = {
    getHomeData,
    getBoletimDoDia,
    getUserStats,
};

export default homeService;
