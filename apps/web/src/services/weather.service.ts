/**
 * Weather Service - Previsão do Tempo e Mar
 */

import { apiClient } from '@/api/client';
import type {
    WeatherHomeResponse,
    WeatherForecastResponse,
    MarineForecastResponse,
    InsightsResponse,
    PresetResponse,
    PresetType,
} from '@/types/weather';

const BASE_URL = '/weather';

// ======================================================
// Weather Home (for home card)
// ======================================================

export interface GetWeatherHomeParams {
    hours?: number;
    include?: string[];
}

export async function getWeatherHome(params?: GetWeatherHomeParams): Promise<WeatherHomeResponse> {
    const searchParams = new URLSearchParams();

    if (params?.hours !== undefined) {
        searchParams.append('hours', String(params.hours));
    }
    if (params?.include?.length) {
        searchParams.append('include', params.include.join(','));
    }

    const queryString = searchParams.toString();
    const url = queryString ? `${BASE_URL}/home?${queryString}` : `${BASE_URL}/home`;

    const response = await apiClient.get<WeatherHomeResponse>(url);
    return response;
}

// ======================================================
// Weather Forecast (full land forecast)
// ======================================================

export interface GetWeatherForecastParams {
    days?: number;
    hours?: number;
    include?: string[];
}

export async function getWeatherForecast(params?: GetWeatherForecastParams): Promise<WeatherForecastResponse> {
    const searchParams = new URLSearchParams();

    if (params?.days !== undefined) {
        searchParams.append('days', String(params.days));
    }
    if (params?.hours !== undefined) {
        searchParams.append('hours', String(params.hours));
    }
    if (params?.include?.length) {
        searchParams.append('include', params.include.join(','));
    }

    const queryString = searchParams.toString();
    const url = queryString ? `${BASE_URL}/forecast?${queryString}` : `${BASE_URL}/forecast`;

    const response = await apiClient.get<WeatherForecastResponse>(url);
    return response;
}

// ======================================================
// Marine Forecast
// ======================================================

export interface GetMarineForecastParams {
    days?: number;
    hours?: number;
    include?: string[];
}

export async function getMarineForecast(params?: GetMarineForecastParams): Promise<MarineForecastResponse> {
    const searchParams = new URLSearchParams();

    if (params?.days !== undefined) {
        searchParams.append('days', String(params.days));
    }
    if (params?.hours !== undefined) {
        searchParams.append('hours', String(params.hours));
    }
    if (params?.include?.length) {
        searchParams.append('include', params.include.join(','));
    }

    const queryString = searchParams.toString();
    const url = queryString ? `${BASE_URL}/marine?${queryString}` : `${BASE_URL}/marine`;

    const response = await apiClient.get<MarineForecastResponse>(url);
    return response;
}

// ======================================================
// Insights (human-readable weather insights)
// ======================================================

export async function getWeatherInsights(): Promise<InsightsResponse> {
    const response = await apiClient.get<InsightsResponse>(`${BASE_URL}/insights`);
    return response;
}

// ======================================================
// Presets (activity-specific forecasts)
// ======================================================

export async function getWeatherPreset(type: PresetType): Promise<PresetResponse> {
    const response = await apiClient.get<PresetResponse>(`${BASE_URL}/preset/${type}`);
    return response;
}

// ======================================================
// React Query Hooks
// ======================================================

import { useQuery } from '@tanstack/react-query';

export const weatherKeys = {
    all: ['weather'] as const,
    home: () => [...weatherKeys.all, 'home'] as const,
    forecast: () => [...weatherKeys.all, 'forecast'] as const,
    marine: () => [...weatherKeys.all, 'marine'] as const,
    insights: () => [...weatherKeys.all, 'insights'] as const,
    preset: (type: PresetType) => [...weatherKeys.all, 'preset', type] as const,
};

export function useWeatherHome(params?: GetWeatherHomeParams) {
    return useQuery({
        queryKey: weatherKeys.home(),
        queryFn: () => getWeatherHome(params),
        staleTime: 1000 * 60 * 5, // 5 minutes (server caches for 6h)
        gcTime: 1000 * 60 * 30, // 30 minutes
        retry: 2,
    });
}

export function useWeatherForecast(params?: GetWeatherForecastParams) {
    return useQuery({
        queryKey: weatherKeys.forecast(),
        queryFn: () => getWeatherForecast(params),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        retry: 2,
    });
}

export function useMarineForecast(params?: GetMarineForecastParams) {
    return useQuery({
        queryKey: weatherKeys.marine(),
        queryFn: () => getMarineForecast(params),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        retry: 2,
    });
}

export function useWeatherInsights() {
    return useQuery({
        queryKey: weatherKeys.insights(),
        queryFn: () => getWeatherInsights(),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        retry: 2,
    });
}

export function useWeatherPreset(type: PresetType) {
    return useQuery({
        queryKey: weatherKeys.preset(type),
        queryFn: () => getWeatherPreset(type),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        retry: 2,
    });
}

// ======================================================
// Export
// ======================================================

export const weatherService = {
    getWeatherHome,
    getWeatherForecast,
    getMarineForecast,
    getWeatherInsights,
    getWeatherPreset,
};

export default weatherService;

