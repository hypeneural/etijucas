import { describe, expect, it } from "vitest";
import { buildWeatherCacheKey } from "./weather-cache.service";

describe("weather cache key builder", () => {
  it("builds tenant-aware bundle key with sections", () => {
    const key = buildWeatherCacheKey({
      scope: "bundle",
      tenantKey: "tijucas-sc|America/Sao_Paulo|active|hash",
      days: 10,
      units: "metric",
      sections: ["daily", "current", "insights"],
    });

    expect(key).toContain("weather:bundle:tijucas-sc|america/sao_paulo|active|hash");
    expect(key).toContain(":days:10");
    expect(key).toContain(":units:metric");
    expect(key).toContain(":sections:current,daily,insights");
    expect(key.endsWith(":v1")).toBe(true);
  });

  it("serializes params in stable order", () => {
    const key = buildWeatherCacheKey({
      scope: "forecast",
      tenantKey: "canelinha-sc",
      params: {
        include: "daily,current",
        hours: 48,
      },
    });

    expect(key).toContain(":params:hours=48&include=daily,current");
  });
});
