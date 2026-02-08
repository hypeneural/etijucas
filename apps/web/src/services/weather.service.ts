/**
 * Weather Service - tenant-aware transport, query cache and offline cache.
 */

import { apiClient } from '@/api/client';
import { useOfflineQuery } from '@/hooks/useOfflineWeather';
import { useTenantStore } from '@/store/useTenantStore';
import { buildWeatherCacheKey } from '@/services/weather-cache.service';
import type {
    WeatherBundleResponse,
    WeatherBundleSection,
    WeatherForecastResponse,
    WeatherHomeResponse,
    MarineForecastResponse,
    InsightsResponse,
    PresetResponse,
    PresetType,
} from '@/types/weather';

const BASE_URL = '/weather';
const DEFAULT_BUNDLE_DAYS = 7;
const DEFAULT_BUNDLE_UNITS: 'metric' | 'imperial' = 'metric';
const DEFAULT_BUNDLE_SECTIONS: WeatherBundleSection[] = ['current', 'hourly', 'daily', 'insights'];
const BUNDLE_SECTION_ORDER: Record<WeatherBundleSection, number> = {
    current: 1,
    hourly: 2,
    daily: 3,
    marine: 4,
    insights: 5,
};

export interface GetWeatherHomeParams {
    hours?: number;
    include?: string[];
}

export interface GetWeatherForecastParams {
    days?: number;
    hours?: number;
    include?: string[];
}

export interface GetMarineForecastParams {
    days?: number;
    hours?: number;
    include?: string[];
}

export interface GetWeatherBundleParams {
    sections?: WeatherBundleSection[];
    days?: number;
    units?: 'metric' | 'imperial';
}

export interface UseWeatherBundleOptions {
    enabled?: boolean;
}

export interface UseWeatherInsightsOptions {
    enabled?: boolean;
}

function resolveTenantToken(tenantKey: string | null, citySlug: string | null): string {
    return tenantKey ?? citySlug ?? 'global';
}

function normalizeStringList(values?: string[]): string[] | undefined {
    if (!values || values.length === 0) {
        return undefined;
    }

    const normalized = values
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

    if (normalized.length === 0) {
        return undefined;
    }

    return Array.from(new Set(normalized)).sort();
}

function includeSignature(values?: string[]): string {
    const normalized = normalizeStringList(values);
    return normalized?.join(',') ?? 'default';
}

function normalizeBundleSections(sections?: WeatherBundleSection[]): WeatherBundleSection[] {
    const source = sections && sections.length > 0 ? sections : DEFAULT_BUNDLE_SECTIONS;
    const unique = Array.from(new Set(source)).filter((section): section is WeatherBundleSection =>
        section in BUNDLE_SECTION_ORDER
    );

    unique.sort((a, b) => BUNDLE_SECTION_ORDER[a] - BUNDLE_SECTION_ORDER[b]);

    return unique;
}

function sectionsSignature(sections?: WeatherBundleSection[]): string {
    return normalizeBundleSections(sections).join(',');
}

function buildUrl(path: string, params: URLSearchParams): string {
    const query = params.toString();
    return query ? `${path}?${query}` : path;
}

export async function getWeatherHome(params?: GetWeatherHomeParams): Promise<WeatherHomeResponse> {
    const search = new URLSearchParams();

    if (params?.hours !== undefined) {
        search.append('hours', String(params.hours));
    }

    const include = normalizeStringList(params?.include);
    if (include && include.length > 0) {
        search.append('include', include.join(','));
    }

    return apiClient.get<WeatherHomeResponse>(buildUrl(`${BASE_URL}/home`, search));
}

export async function getWeatherForecast(params?: GetWeatherForecastParams): Promise<WeatherForecastResponse> {
    const search = new URLSearchParams();

    if (params?.days !== undefined) {
        search.append('days', String(params.days));
    }
    if (params?.hours !== undefined) {
        search.append('hours', String(params.hours));
    }

    const include = normalizeStringList(params?.include);
    if (include && include.length > 0) {
        search.append('include', include.join(','));
    }

    return apiClient.get<WeatherForecastResponse>(buildUrl(`${BASE_URL}/forecast`, search));
}

export async function getMarineForecast(params?: GetMarineForecastParams): Promise<MarineForecastResponse> {
    const search = new URLSearchParams();

    if (params?.days !== undefined) {
        search.append('days', String(params.days));
    }
    if (params?.hours !== undefined) {
        search.append('hours', String(params.hours));
    }

    const include = normalizeStringList(params?.include);
    if (include && include.length > 0) {
        search.append('include', include.join(','));
    }

    return apiClient.get<MarineForecastResponse>(buildUrl(`${BASE_URL}/marine`, search));
}

export async function getWeatherInsights(): Promise<InsightsResponse> {
    return apiClient.get<InsightsResponse>(`${BASE_URL}/insights`);
}

export async function getWeatherPreset(type: PresetType): Promise<PresetResponse> {
    return apiClient.get<PresetResponse>(`${BASE_URL}/preset/${type}`);
}

export async function getWeatherBundle(params?: GetWeatherBundleParams): Promise<WeatherBundleResponse> {
    const search = new URLSearchParams();
    const sections = normalizeBundleSections(params?.sections);
    const days = params?.days ?? DEFAULT_BUNDLE_DAYS;
    const units = params?.units ?? DEFAULT_BUNDLE_UNITS;

    search.append('sections', sections.join(','));
    search.append('days', String(days));
    search.append('units', units);

    return apiClient.get<WeatherBundleResponse>(buildUrl(`${BASE_URL}/bundle`, search));
}

export const weatherKeys = {
    all: ['weather'] as const,
    home: (tenantToken: string, params?: GetWeatherHomeParams) =>
        [
            ...weatherKeys.all,
            'home',
            tenantToken,
            `hours:${params?.hours ?? 'default'}`,
            `include:${includeSignature(params?.include)}`,
        ] as const,
    forecast: (tenantToken: string, params?: GetWeatherForecastParams) =>
        [
            ...weatherKeys.all,
            'forecast',
            tenantToken,
            `days:${params?.days ?? 'default'}`,
            `hours:${params?.hours ?? 'default'}`,
            `include:${includeSignature(params?.include)}`,
        ] as const,
    marine: (tenantToken: string, params?: GetMarineForecastParams) =>
        [
            ...weatherKeys.all,
            'marine',
            tenantToken,
            `days:${params?.days ?? 'default'}`,
            `hours:${params?.hours ?? 'default'}`,
            `include:${includeSignature(params?.include)}`,
        ] as const,
    insights: (tenantToken: string) =>
        [...weatherKeys.all, 'insights', tenantToken] as const,
    preset: (tenantToken: string, type: PresetType) =>
        [...weatherKeys.all, 'preset', tenantToken, type] as const,
    bundle: (tenantToken: string, params?: GetWeatherBundleParams) =>
        [
            ...weatherKeys.all,
            'bundle',
            tenantToken,
            `days:${params?.days ?? DEFAULT_BUNDLE_DAYS}`,
            `units:${params?.units ?? DEFAULT_BUNDLE_UNITS}`,
            `sections:${sectionsSignature(params?.sections)}`,
        ] as const,
};

export function useWeatherHome(params?: GetWeatherHomeParams) {
    const tenantKey = useTenantStore((state) => state.tenantKey);
    const citySlug = useTenantStore((state) => state.city?.slug ?? null);
    const tenantToken = resolveTenantToken(tenantKey, citySlug);

    const cacheKey = buildWeatherCacheKey({
        scope: 'home',
        tenantKey: tenantToken,
        params: {
            hours: params?.hours ?? 'default',
            include: includeSignature(params?.include),
        },
    });

    return useOfflineQuery(
        [...weatherKeys.home(tenantToken, params)],
        () => getWeatherHome(params),
        {
            cacheKey,
            ttlType: 'home',
        }
    );
}

export function useWeatherForecast(params?: GetWeatherForecastParams) {
    const tenantKey = useTenantStore((state) => state.tenantKey);
    const citySlug = useTenantStore((state) => state.city?.slug ?? null);
    const tenantToken = resolveTenantToken(tenantKey, citySlug);

    const cacheKey = buildWeatherCacheKey({
        scope: 'forecast',
        tenantKey: tenantToken,
        days: params?.days,
        params: {
            hours: params?.hours ?? 'default',
            include: includeSignature(params?.include),
        },
    });

    return useOfflineQuery(
        [...weatherKeys.forecast(tenantToken, params)],
        () => getWeatherForecast(params),
        {
            cacheKey,
            ttlType: 'forecast',
        }
    );
}

export function useMarineForecast(params?: GetMarineForecastParams) {
    const tenantKey = useTenantStore((state) => state.tenantKey);
    const citySlug = useTenantStore((state) => state.city?.slug ?? null);
    const tenantToken = resolveTenantToken(tenantKey, citySlug);

    const cacheKey = buildWeatherCacheKey({
        scope: 'marine',
        tenantKey: tenantToken,
        days: params?.days,
        params: {
            hours: params?.hours ?? 'default',
            include: includeSignature(params?.include),
        },
    });

    return useOfflineQuery(
        [...weatherKeys.marine(tenantToken, params)],
        () => getMarineForecast(params),
        {
            cacheKey,
            ttlType: 'marine',
        }
    );
}

export function useWeatherInsights(options?: UseWeatherInsightsOptions) {
    const tenantKey = useTenantStore((state) => state.tenantKey);
    const citySlug = useTenantStore((state) => state.city?.slug ?? null);
    const tenantToken = resolveTenantToken(tenantKey, citySlug);

    const cacheKey = buildWeatherCacheKey({
        scope: 'insights',
        tenantKey: tenantToken,
    });

    return useOfflineQuery(
        [...weatherKeys.insights(tenantToken)],
        () => getWeatherInsights(),
        {
            cacheKey,
            ttlType: 'insights',
            enabled: options?.enabled,
        }
    );
}

export function useWeatherPreset(type: PresetType) {
    const tenantKey = useTenantStore((state) => state.tenantKey);
    const citySlug = useTenantStore((state) => state.city?.slug ?? null);
    const tenantToken = resolveTenantToken(tenantKey, citySlug);

    const cacheKey = buildWeatherCacheKey({
        scope: 'preset',
        tenantKey: tenantToken,
        presetType: type,
    });

    return useOfflineQuery(
        [...weatherKeys.preset(tenantToken, type)],
        () => getWeatherPreset(type),
        {
            cacheKey,
            ttlType: 'insights',
        }
    );
}

export function useWeatherBundle(params?: GetWeatherBundleParams, options?: UseWeatherBundleOptions) {
    const tenantKey = useTenantStore((state) => state.tenantKey);
    const citySlug = useTenantStore((state) => state.city?.slug ?? null);
    const tenantToken = resolveTenantToken(tenantKey, citySlug);
    const sections = normalizeBundleSections(params?.sections);
    const days = params?.days ?? DEFAULT_BUNDLE_DAYS;
    const units = params?.units ?? DEFAULT_BUNDLE_UNITS;

    const cacheKey = buildWeatherCacheKey({
        scope: 'bundle',
        tenantKey: tenantToken,
        days,
        units,
        sections,
    });

    const ttlType = sections.includes('marine')
        ? 'marine'
        : sections.length === 1 && sections[0] === 'insights'
            ? 'insights'
            : 'forecast';

    return useOfflineQuery(
        [...weatherKeys.bundle(tenantToken, { ...params, sections, days, units })],
        () => getWeatherBundle({ ...params, sections, days, units }),
        {
            cacheKey,
            ttlType,
            enabled: options?.enabled,
        }
    );
}

export const weatherService = {
    getWeatherHome,
    getWeatherForecast,
    getMarineForecast,
    getWeatherInsights,
    getWeatherPreset,
    getWeatherBundle,
};

export default weatherService;
