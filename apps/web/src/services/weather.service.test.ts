import { describe, expect, it } from "vitest";
import { weatherKeys } from "./weather.service";

describe("weather query keys", () => {
  it("includes tenant token and params for forecast", () => {
    const key = weatherKeys.forecast("tijucas-sc|America/Sao_Paulo|active|hash", {
      days: 10,
      hours: 48,
      include: ["current", "daily"],
    });

    expect(key).toContain("tijucas-sc|America/Sao_Paulo|active|hash");
    expect(key).toContain("days:10");
    expect(key).toContain("hours:48");
    expect(key).toContain("include:current,daily");
  });

  it("normalizes sections for bundle key", () => {
    const key = weatherKeys.bundle("itapema-sc", {
      sections: ["insights", "current", "daily"],
      days: 7,
      units: "metric",
    });

    expect(key).toContain("sections:current,daily,insights");
    expect(key).toContain("days:7");
    expect(key).toContain("units:metric");
  });
});
