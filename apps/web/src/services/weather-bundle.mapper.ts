import {
    type CacheMeta,
    type MarineDayPoint,
    type MarineForecastResponse,
    type MarineHourPoint,
    type WeatherBundleResponse,
    type WeatherCurrent,
    type WeatherDayPoint,
    type WeatherForecastResponse,
    type WeatherHourPoint,
    type WeatherInsight,
    getWeatherInfo,
} from '@/types/weather';
import { extractDateFromLocalIso, getNowInTimeZone } from '@/lib/timezone';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as UnknownRecord;
    }

    return {};
}

function asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter((item): item is string => typeof item === 'string');
}

function asNumberArray(value: unknown): number[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.map((item) => (typeof item === 'number' ? item : Number(item))).map((item) => (Number.isFinite(item) ? item : 0));
}

function asNumber(value: unknown, fallback = 0): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function cityNameFromSlug(slug: string): string {
    const segments = slug.split('-').filter(Boolean);
    if (segments.length < 2) {
        return slug || 'Cidade';
    }

    const uf = (segments.pop() ?? '').toUpperCase();
    const name = segments
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');

    return `${name}/${uf}`;
}

function toCache(bundle: WeatherBundleResponse): CacheMeta {
    return {
        provider: bundle.provider,
        cached: true,
        stale: bundle.cache.degraded,
        fetched_at: bundle.cache.generated_at_utc,
        expires_at: bundle.cache.expires_at_utc,
    };
}

function toCurrent(raw: UnknownRecord): WeatherCurrent | undefined {
    if (Object.keys(raw).length === 0) {
        return undefined;
    }

    const weatherCode = asNumber(raw.weather_code, 0);

    return {
        temp_c: asNumber(raw.temperature_2m),
        feels_like_c: asNumber(raw.apparent_temperature),
        weather_code: weatherCode,
        description: getWeatherInfo(weatherCode).description,
        precipitation_mm: asNumber(raw.precipitation),
        wind_kmh: asNumber(raw.wind_speed_10m),
        gust_kmh: asNumber(raw.wind_gusts_10m),
        wind_dir_deg: asNumber(raw.wind_direction_10m),
        cloud_cover_pct: asNumber(raw.cloud_cover),
    };
}

function toHourly(raw: UnknownRecord, timezone: string, limit?: number): WeatherHourPoint[] {
    const times = asStringArray(raw.time);
    const temps = asNumberArray(raw.temperature_2m);
    const rainProb = asNumberArray(raw.precipitation_probability);
    const precipitation = asNumberArray(raw.precipitation);
    const weatherCodes = asNumberArray(raw.weather_code);
    const wind = asNumberArray(raw.wind_speed_10m);
    const gust = asNumberArray(raw.wind_gusts_10m);
    const windDir = asNumberArray(raw.wind_direction_10m);
    const uv = asNumberArray(raw.uv_index);
    const cloud = asNumberArray(raw.cloud_cover);
    const now = getNowInTimeZone(timezone).dateTime;

    const points: WeatherHourPoint[] = [];

    for (let index = 0; index < times.length; index += 1) {
        const time = times[index];
        if (!time || time < now) {
            continue;
        }

        points.push({
            t: time,
            temp_c: temps[index] ?? 0,
            rain_prob_pct: rainProb[index] ?? 0,
            precipitation_mm: precipitation[index] ?? 0,
            weather_code: weatherCodes[index] ?? 0,
            wind_kmh: wind[index] ?? 0,
            gust_kmh: gust[index] ?? 0,
            wind_dir_deg: windDir[index] ?? 0,
            uv_index: uv[index] ?? 0,
            cloud_cover_pct: cloud[index] ?? 0,
        });

        if (typeof limit === 'number' && points.length >= limit) {
            break;
        }
    }

    return points;
}

function toDaily(raw: UnknownRecord, limit?: number): WeatherDayPoint[] {
    const dates = asStringArray(raw.time);
    const weatherCodes = asNumberArray(raw.weather_code);
    const tempMin = asNumberArray(raw.temperature_2m_min);
    const tempMax = asNumberArray(raw.temperature_2m_max);
    const precipitation = asNumberArray(raw.precipitation_sum);
    const rainProb = asNumberArray(raw.precipitation_probability_max);
    const windMax = asNumberArray(raw.wind_speed_10m_max);
    const gustMax = asNumberArray(raw.wind_gusts_10m_max);
    const windDir = asNumberArray(raw.wind_direction_10m_dominant);
    const sunrise = asStringArray(raw.sunrise);
    const sunset = asStringArray(raw.sunset);
    const uv = asNumberArray(raw.uv_index_max);

    const points: WeatherDayPoint[] = [];

    for (let index = 0; index < dates.length; index += 1) {
        const date = dates[index];
        const weatherCode = weatherCodes[index] ?? 0;

        points.push({
            date,
            weather_code: weatherCode,
            description: getWeatherInfo(weatherCode).description,
            min_c: tempMin[index] ?? 0,
            max_c: tempMax[index] ?? 0,
            precipitation_sum_mm: precipitation[index] ?? 0,
            rain_prob_max_pct: rainProb[index] ?? 0,
            wind_max_kmh: windMax[index] ?? 0,
            gust_max_kmh: gustMax[index] ?? 0,
            wind_dir_dominant_deg: windDir[index] ?? 0,
            sunrise: sunrise[index],
            sunset: sunset[index],
            uv_max: uv[index] ?? 0,
        });

        if (typeof limit === 'number' && points.length >= limit) {
            break;
        }
    }

    return points;
}

function toMarineHourly(raw: UnknownRecord, timezone: string, limit?: number): MarineHourPoint[] {
    const times = asStringArray(raw.time);
    const wave = asNumberArray(raw.wave_height);
    const wavePeriod = asNumberArray(raw.wave_period);
    const waveDir = asNumberArray(raw.wave_direction);
    const swell = asNumberArray(raw.swell_wave_height);
    const swellPeriod = asNumberArray(raw.swell_wave_period);
    const swellDir = asNumberArray(raw.swell_wave_direction);
    const windWave = asNumberArray(raw.wind_wave_height);
    const windWavePeriod = asNumberArray(raw.wind_wave_period);
    const windWaveDir = asNumberArray(raw.wind_wave_direction);
    const seaTemp = asNumberArray(raw.sea_surface_temperature);
    const current = asNumberArray(raw.ocean_current_velocity);
    const currentDir = asNumberArray(raw.ocean_current_direction);
    const now = getNowInTimeZone(timezone).dateTime;

    const points: MarineHourPoint[] = [];

    for (let index = 0; index < times.length; index += 1) {
        const time = times[index];
        if (!time || time < now) {
            continue;
        }

        points.push({
            t: time,
            wave_m: wave[index] ?? 0,
            wave_period_s: wavePeriod[index] ?? 0,
            wave_dir_deg: waveDir[index] ?? 0,
            swell_m: swell[index] ?? 0,
            swell_period_s: swellPeriod[index] ?? 0,
            swell_dir_deg: swellDir[index] ?? 0,
            wind_wave_m: windWave[index] ?? 0,
            wind_wave_period_s: windWavePeriod[index] ?? 0,
            wind_wave_dir_deg: windWaveDir[index] ?? 0,
            sea_temp_c: seaTemp[index],
            current_ms: current[index] ?? 0,
            current_dir_deg: currentDir[index] ?? 0,
        });

        if (typeof limit === 'number' && points.length >= limit) {
            break;
        }
    }

    return points;
}

function toMarineDaily(raw: UnknownRecord, limit?: number): MarineDayPoint[] {
    const dates = asStringArray(raw.time);
    const wave = asNumberArray(raw.wave_height_max);
    const wavePeriod = asNumberArray(raw.wave_period_max);
    const waveDir = asNumberArray(raw.wave_direction_dominant);
    const swell = asNumberArray(raw.swell_wave_height_max);
    const swellPeriod = asNumberArray(raw.swell_wave_period_max);
    const swellDir = asNumberArray(raw.swell_wave_direction_dominant);

    const points: MarineDayPoint[] = [];

    for (let index = 0; index < dates.length; index += 1) {
        points.push({
            date: dates[index],
            wave_max_m: wave[index] ?? 0,
            wave_period_max_s: wavePeriod[index] ?? 0,
            wave_dir_dominant_deg: waveDir[index] ?? 0,
            swell_max_m: swell[index] ?? 0,
            swell_period_max_s: swellPeriod[index] ?? 0,
            swell_dir_dominant_deg: swellDir[index] ?? 0,
        });

        if (typeof limit === 'number' && points.length >= limit) {
            break;
        }
    }

    return points;
}

export function mapBundleToForecast(
    bundle: WeatherBundleResponse | undefined,
    options?: { hoursLimit?: number; daysLimit?: number }
): WeatherForecastResponse | undefined {
    if (!bundle) {
        return undefined;
    }

    const timezone = bundle.location.timezone || 'America/Sao_Paulo';
    const current = toCurrent(asRecord(bundle.data.current));
    const hourly = toHourly(asRecord(bundle.data.hourly), timezone, options?.hoursLimit);
    const daily = toDaily(asRecord(bundle.data.daily), options?.daysLimit);

    return {
        location: {
            key: bundle.location.city_slug,
            name: cityNameFromSlug(bundle.location.city_slug),
            lat: asNumber(bundle.location.lat),
            lon: asNumber(bundle.location.lon),
            timezone,
        },
        cache: toCache(bundle),
        current,
        hourly,
        daily,
    };
}

export function mapBundleToMarine(
    bundle: WeatherBundleResponse | undefined,
    options?: { hoursLimit?: number; daysLimit?: number }
): MarineForecastResponse | undefined {
    if (!bundle || !bundle.data.marine) {
        return undefined;
    }

    const timezone = bundle.location.timezone || 'America/Sao_Paulo';
    const marine = asRecord(bundle.data.marine);

    return {
        location: {
            key: bundle.location.city_slug,
            name: cityNameFromSlug(bundle.location.city_slug),
            lat: asNumber(bundle.location.lat),
            lon: asNumber(bundle.location.lon),
            timezone,
        },
        cache: toCache(bundle),
        hourly: toMarineHourly(marine, timezone, options?.hoursLimit),
        daily: toMarineDaily(marine, options?.daysLimit),
    };
}

export function mapBundleInsights(bundle: WeatherBundleResponse | undefined): WeatherInsight[] {
    const candidate = bundle?.data?.insights;
    if (!Array.isArray(candidate)) {
        return [];
    }

    return candidate as WeatherInsight[];
}

export function localDateFromHourlyPoint(value: string): string {
    return extractDateFromLocalIso(value);
}
