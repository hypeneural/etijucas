/**
 * Weather Types - Previsão do Tempo e Mar
 */

// ======================================================
// Location & Cache
// ======================================================

export interface WeatherLocation {
    key: string;
    name: string;
    lat: number;
    lon: number;
    timezone: string;
}

export interface CacheMeta {
    provider: string;
    cached: boolean;
    stale: boolean;
    fetched_at: string;
    expires_at: string;
}

// ======================================================
// Weather Current
// ======================================================

export interface WeatherCurrent {
    temp_c: number;
    feels_like_c: number;
    weather_code: number;
    description: string;
    precipitation_mm: number;
    wind_kmh: number;
    gust_kmh: number;
    wind_dir_deg: number;
    cloud_cover_pct: number;
}

// ======================================================
// Weather Today
// ======================================================

export interface WeatherToday {
    min_c: number;
    max_c: number;
    rain_prob_max_pct: number;
    sunrise?: string;
    sunset?: string;
}

// ======================================================
// Hourly Weather
// ======================================================

export interface WeatherHourPoint {
    t: string;
    temp_c: number;
    rain_prob_pct: number;
    precipitation_mm: number;
    weather_code: number;
    wind_kmh: number;
    gust_kmh?: number;
    wind_dir_deg?: number;
    uv_index?: number;
    cloud_cover_pct?: number;
}

// ======================================================
// Daily Weather
// ======================================================

export interface WeatherDayPoint {
    date: string;
    weather_code: number;
    description: string;
    min_c: number;
    max_c: number;
    precipitation_sum_mm?: number;
    rain_prob_max_pct?: number;
    wind_max_kmh?: number;
    gust_max_kmh?: number;
    wind_dir_dominant_deg?: number;
    sunrise?: string;
    sunset?: string;
    uv_max?: number;
}

// ======================================================
// Marine
// ======================================================

export interface MarinePreview {
    wave_m: number;
    wave_period_s: number;
    wave_dir_deg: number;
    sea_temp_c?: number;
}

export interface MarineHourPoint {
    t: string;
    wave_m: number;
    wave_period_s: number;
    wave_dir_deg: number;
    swell_m?: number;
    swell_period_s?: number;
    swell_dir_deg?: number;
    wind_wave_m?: number;
    wind_wave_period_s?: number;
    wind_wave_dir_deg?: number;
    sea_temp_c?: number;
    current_ms?: number;
    current_dir_deg?: number;
}

export interface MarineDayPoint {
    date: string;
    wave_max_m: number;
    wave_period_max_s?: number;
    wave_dir_dominant_deg: number;
    swell_max_m?: number;
    swell_period_max_s?: number;
    swell_dir_dominant_deg?: number;
}

// ======================================================
// API Responses
// ======================================================

export interface WeatherHomeResponse {
    location?: WeatherLocation;
    cache?: CacheMeta;
    current?: WeatherCurrent;
    today?: WeatherToday;
    next_hours?: WeatherHourPoint[];
    marine_preview?: MarinePreview;
}

export interface WeatherForecastResponse {
    location?: WeatherLocation;
    cache?: CacheMeta;
    current?: WeatherCurrent;
    hourly?: WeatherHourPoint[];
    daily?: WeatherDayPoint[];
    icon_hints?: Record<string, string>;
}

export interface MarineForecastResponse {
    location?: WeatherLocation;
    cache?: CacheMeta;
    hourly?: MarineHourPoint[];
    daily?: MarineDayPoint[];
    icon_hints?: Record<string, string>;
}

// ======================================================
// Weather Code Mapping
// ======================================================

export interface WeatherCodeInfo {
    description: string;
    icon: string;
    iconNight?: string;
    color: string;
}

export const WEATHER_CODES: Record<number, WeatherCodeInfo> = {
    0: { description: 'Céu limpo', icon: 'mdi:weather-sunny', iconNight: 'mdi:weather-night', color: '#FFD700' },
    1: { description: 'Predominantemente limpo', icon: 'mdi:weather-sunny', iconNight: 'mdi:weather-night', color: '#FFD700' },
    2: { description: 'Parcialmente nublado', icon: 'mdi:weather-partly-cloudy', iconNight: 'mdi:weather-night-partly-cloudy', color: '#87CEEB' },
    3: { description: 'Nublado', icon: 'mdi:weather-cloudy', color: '#9CA3AF' },
    45: { description: 'Neblina', icon: 'mdi:weather-fog', color: '#9CA3AF' },
    48: { description: 'Neblina congelante', icon: 'mdi:weather-fog', color: '#9CA3AF' },
    51: { description: 'Garoa leve', icon: 'mdi:weather-rainy', color: '#60A5FA' },
    53: { description: 'Garoa moderada', icon: 'mdi:weather-rainy', color: '#60A5FA' },
    55: { description: 'Garoa forte', icon: 'mdi:weather-rainy', color: '#3B82F6' },
    61: { description: 'Chuva leve', icon: 'mdi:weather-rainy', color: '#3B82F6' },
    63: { description: 'Chuva moderada', icon: 'mdi:weather-pouring', color: '#2563EB' },
    65: { description: 'Chuva forte', icon: 'mdi:weather-pouring', color: '#1D4ED8' },
    80: { description: 'Pancadas leves', icon: 'mdi:weather-pouring', color: '#3B82F6' },
    81: { description: 'Pancadas moderadas', icon: 'mdi:weather-pouring', color: '#2563EB' },
    82: { description: 'Pancadas fortes', icon: 'mdi:weather-pouring', color: '#1D4ED8' },
    95: { description: 'Tempestade', icon: 'mdi:weather-lightning-rainy', color: '#6366F1' },
    96: { description: 'Tempestade com granizo', icon: 'mdi:weather-lightning-rainy', color: '#6366F1' },
    99: { description: 'Tempestade severa', icon: 'mdi:weather-lightning-rainy', color: '#4F46E5' },
};

export function getWeatherInfo(code: number): WeatherCodeInfo {
    return WEATHER_CODES[code] ?? { description: 'Desconhecido', icon: 'mdi:weather-cloudy', color: '#9CA3AF' };
}

// ======================================================
// Wind Direction Helpers
// ======================================================

export function getWindDirection(degrees: number): string {
    const directions = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

export function getWindDirectionFull(degrees: number): string {
    const map: Record<string, string> = {
        'N': 'Norte',
        'NE': 'Nordeste',
        'L': 'Leste',
        'SE': 'Sudeste',
        'S': 'Sul',
        'SO': 'Sudoeste',
        'O': 'Oeste',
        'NO': 'Noroeste',
    };
    return map[getWindDirection(degrees)] ?? 'Desconhecido';
}

// ======================================================
// Insights
// ======================================================

export type InsightSeverity = 'success' | 'info' | 'warning' | 'danger';
export type InsightType = 'rain' | 'rain_window' | 'wind' | 'temperature' | 'uv' | 'sea' | 'beach' | 'warning';

export interface WeatherInsight {
    type: InsightType;
    icon: string;
    severity: InsightSeverity;
    priority: number;
    title: string;
    message: string;
    detail?: string | null;
    badge?: string;
    meta?: {
        score?: number;
        positives?: string[];
        negatives?: string[];
        condition?: string;
        wave_m?: number;
        period_s?: number;
        sea_temp_c?: number;
    };
}

export interface InsightsResponse {
    location: WeatherLocation;
    cache: {
        fetched_at: string;
        stale: boolean;
    };
    insights: WeatherInsight[];
}

// ======================================================
// Presets
// ======================================================

export type PresetType = 'going_out' | 'beach' | 'fishing' | 'hiking';

export interface WeatherPreset {
    type: 'preset';
    name: PresetType;
    title: string;
    focus: string[];
    insights: WeatherInsight[];
}

export interface PresetResponse {
    location: WeatherLocation;
    cache: {
        fetched_at: string;
        stale: boolean;
    };
    preset: WeatherPreset;
}

// ======================================================
// Sea Condition Helpers
// ======================================================

export type SeaCondition = 'calm' | 'moderate' | 'rough';

export function getSeaConditionInfo(condition: SeaCondition): { label: string; emoji: string; color: string } {
    const map: Record<SeaCondition, { label: string; emoji: string; color: string }> = {
        calm: { label: 'Calmo', emoji: '✅', color: '#10B981' },
        moderate: { label: 'Moderado', emoji: '⚠️', color: '#F59E0B' },
        rough: { label: 'Agitado', emoji: '⛔', color: '#EF4444' },
    };
    return map[condition] ?? map.calm;
}

export function classifySeaCondition(waveHeight: number): SeaCondition {
    if (waveHeight >= 1.5) return 'rough';
    if (waveHeight >= 1.0) return 'moderate';
    return 'calm';
}

// ======================================================
// Preset Metadata
// ======================================================

export const PRESET_INFO: Record<PresetType, { title: string; icon: string; description: string }> = {
    going_out: { title: 'Vou sair', icon: 'mdi:walk', description: 'Chuva, sensação térmica e vento' },
    beach: { title: 'Praia', icon: 'mdi:beach', description: 'Mar, vento, UV e cobertura' },
    fishing: { title: 'Pescar', icon: 'mdi:fish', description: 'Ondas, vento e corrente' },
    hiking: { title: 'Trilha', icon: 'mdi:hiking', description: 'Chuva, sensação e rajadas' },
};

