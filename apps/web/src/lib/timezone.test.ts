import { afterEach, describe, expect, it, vi } from "vitest";
import {
  extractDateFromLocalIso,
  extractHourFromLocalIso,
  extractTimeFromLocalIso,
  getNowInTimeZone,
  toLocalDateDisplay,
} from "./timezone";

describe("timezone helpers", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds city-local now parts using IANA timezone", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-08T03:45:00Z"));

    const now = getNowInTimeZone("America/Sao_Paulo");

    expect(now.date).toBe("2026-02-08");
    expect(now.time).toBe("00:45");
    expect(now.dateTime).toBe("2026-02-08T00:45");
    expect(now.hour).toBe(0);
    expect(now.minute).toBe(45);
  });

  it("extracts date/hour from local weather ISO values", () => {
    expect(extractDateFromLocalIso("2026-02-08T13:00")).toBe("2026-02-08");
    expect(extractHourFromLocalIso("2026-02-08T13:00")).toBe(13);
    expect(extractTimeFromLocalIso("2026-02-08T13:00")).toBe("13:00");
  });

  it("formats local day labels with city timezone", () => {
    const label = toLocalDateDisplay("2026-02-08", "America/Sao_Paulo", {
      weekday: "short",
    });

    expect(label.length).toBeGreaterThan(0);
  });
});
