import { afterEach, describe, expect, it, vi } from "vitest";
import {
  mapBundleInsights,
  mapBundleToForecast,
  mapBundleToMarine,
} from "./weather-bundle.mapper";
import type { WeatherBundleResponse } from "@/types/weather";

function baseBundle(data: WeatherBundleResponse["data"]): WeatherBundleResponse {
  return {
    contract_version: "2.0",
    provider: "open_meteo",
    request_id: "req-test",
    location: {
      city_slug: "tijucas-sc",
      lat: -27.24,
      lon: -48.63,
      timezone: "America/Sao_Paulo",
      is_coastal: true,
    },
    cache: {
      generated_at_utc: "2026-02-08T15:00:00Z",
      expires_at_utc: "2026-02-08T15:15:00Z",
      stale_until_utc: "2026-02-08T18:00:00Z",
      degraded: false,
      degraded_reason: null,
    },
    errors: {
      forecast: null,
      marine: null,
      insights: null,
    },
    data,
  };
}

describe("weather bundle mapper", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps forecast and filters past hourly points in city timezone", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-08T15:30:00Z")); // 12:30 in America/Sao_Paulo

    const bundle = baseBundle({
      current: {
        temperature_2m: 26.4,
        apparent_temperature: 28.1,
        weather_code: 1,
        precipitation: 0,
        wind_speed_10m: 12,
        wind_gusts_10m: 20,
        wind_direction_10m: 90,
        cloud_cover: 20,
      },
      hourly: {
        time: ["2026-02-08T11:00", "2026-02-08T12:00", "2026-02-08T13:00"],
        temperature_2m: [24, 25, 26],
        precipitation_probability: [10, 20, 30],
        precipitation: [0, 0, 0.5],
        weather_code: [1, 2, 3],
        wind_speed_10m: [5, 10, 12],
        wind_gusts_10m: [8, 14, 18],
        wind_direction_10m: [10, 20, 30],
        uv_index: [1, 2, 3],
        cloud_cover: [10, 20, 30],
      },
      daily: {
        time: ["2026-02-08"],
        weather_code: [2],
        temperature_2m_min: [20],
        temperature_2m_max: [29],
        precipitation_sum: [0.5],
        precipitation_probability_max: [35],
        wind_speed_10m_max: [20],
        wind_gusts_10m_max: [30],
        wind_direction_10m_dominant: [80],
        sunrise: ["2026-02-08T06:10"],
        sunset: ["2026-02-08T18:50"],
        uv_index_max: [9],
      },
    });

    const forecast = mapBundleToForecast(bundle);

    expect(forecast?.location?.timezone).toBe("America/Sao_Paulo");
    expect(forecast?.current?.temp_c).toBe(26.4);
    expect(forecast?.hourly?.map((point) => point.t)).toEqual(["2026-02-08T13:00"]);
  });

  it("maps marine section only when present", () => {
    const withoutMarine = baseBundle({
      current: {
        temperature_2m: 25,
      },
    });
    expect(mapBundleToMarine(withoutMarine)).toBeUndefined();

    const withMarine = baseBundle({
      marine: {
        time: ["2026-02-08"],
      },
    });
    expect(mapBundleToMarine(withMarine)).toBeDefined();
  });

  it("returns insights from bundle data", () => {
    const bundle = baseBundle({
      insights: [
        {
          type: "rain",
          icon: "mdi:weather-pouring",
          severity: "warning",
          priority: 80,
          title: "Vai chover",
          message: "Chuva provavel no fim da tarde",
        },
      ],
    });

    const insights = mapBundleInsights(bundle);
    expect(insights).toHaveLength(1);
    expect(insights[0]?.type).toBe("rain");
  });
});
