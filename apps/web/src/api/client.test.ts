import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "./client";
import { useTenantStore } from "@/store/useTenantStore";

function makeJsonResponse(body: unknown, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
  });
}

beforeEach(() => {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: true,
  });
});

afterEach(() => {
  useTenantStore.getState().clear();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("api client tenant transport", () => {
  it("injects X-City from canonical URL slug", async () => {
    window.history.pushState({}, "", "/sc/canelinha/previsao");
    const fetchMock = vi.fn().mockResolvedValue(
      makeJsonResponse({ ok: true }, {
        "X-Tenant-City": "canelinha-sc",
        "X-Tenant-Timezone": "America/Sao_Paulo",
        "X-Tenant-Key": "canelinha-sc|America/Sao_Paulo|active|hash",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await apiClient.get("/weather/bundle");

    const options = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const headers = (options?.headers ?? {}) as Record<string, string>;

    expect(headers["X-City"]).toBe("canelinha-sc");
  });

  it("falls back to tenant store city slug when URL is not prefixed", async () => {
    window.history.pushState({}, "", "/previsao");
    useTenantStore.setState({
      city: {
        id: "c1",
        name: "Tijucas",
        slug: "tijucas-sc",
        uf: "SC",
        fullName: "Tijucas/SC",
        status: "active",
        ibgeCode: 4218004,
        timezone: "America/Sao_Paulo",
        isCoastal: true,
      },
    });

    const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await apiClient.get("/weather/bundle");

    const options = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const headers = (options?.headers ?? {}) as Record<string, string>;

    expect(headers["X-City"]).toBe("tijucas-sc");
  });

  it("syncs tenant key and timezone from response headers", async () => {
    window.history.pushState({}, "", "/sc/itapema/previsao");
    const fetchMock = vi.fn().mockResolvedValue(
      makeJsonResponse(
        { ok: true },
        {
          "X-Tenant-City": "itapema-sc",
          "X-Tenant-Timezone": "America/Sao_Paulo",
          "X-Tenant-Key": "itapema-sc|America/Sao_Paulo|active|hash123",
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await apiClient.get("/weather/bundle");

    const state = useTenantStore.getState();
    expect(state.tenantTimezone).toBe("America/Sao_Paulo");
    expect(state.tenantKey).toBe("itapema-sc|America/Sao_Paulo|active|hash123");
  });
});
