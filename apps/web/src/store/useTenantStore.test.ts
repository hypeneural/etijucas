import { afterEach, describe, expect, it, vi } from "vitest";
import {
  extractCitySlugFromPath,
  isModuleEnabled,
  resolveCitySlugForRequest,
  useTenantStore,
} from "./useTenantStore";

afterEach(() => {
  useTenantStore.getState().clear();
  localStorage.removeItem("etijucas-tenant");
  vi.unstubAllGlobals();
});

describe("tenant URL parsing", () => {
  it("extracts canonical city slug from /uf/cidade paths", () => {
    expect(extractCitySlugFromPath("/sc/tijucas/forum")).toBe("tijucas-sc");
    expect(extractCitySlugFromPath("/SP/sao-jose/agenda")).toBe("sao-jose-sp");
  });

  it("returns null for non-tenant paths", () => {
    expect(extractCitySlugFromPath("/forum")).toBeNull();
    expect(extractCitySlugFromPath("/")).toBeNull();
  });

  it("uses URL slug as canonical request city when present", () => {
    window.history.pushState({}, "", "/sc/canelinha/previsao");
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

    expect(resolveCitySlugForRequest()).toBe("canelinha-sc");
  });

  it("falls back to store city slug when URL is not prefixed", () => {
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

    expect(resolveCitySlugForRequest()).toBe("tijucas-sc");
  });
});

describe("module gate by backend contract", () => {
  it("uses module key and enabled flag from /config payload", () => {
    useTenantStore.setState({
      modules: [
        {
          key: "forum",
          slug: "forum",
          name: "Forum",
          enabled: true,
        },
        {
          key: "reports",
          slug: "reports",
          name: "Reports",
          enabled: false,
        },
      ],
    });

    expect(isModuleEnabled("forum")).toBe(true);
    expect(isModuleEnabled("reports")).toBe(false);
  });

  it("hydrates store from /config payload without local hardcode", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (key: string) => {
          if (key === "X-Tenant-Key") return "tijucas-sc|America/Sao_Paulo|active|brandhash";
          if (key === "X-Tenant-Timezone") return "America/Sao_Paulo";
          return null;
        },
      },
      json: async () => ({
        success: true,
        data: {
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
          brand: {
            appName: "eTijucas",
            primaryColor: "#10B981",
          },
          modules: [
            {
              key: "forum",
              slug: "forum",
              name: "Forum",
              enabled: true,
            },
          ],
          geo: {
            lat: -27.2,
            lon: -48.6,
          },
        },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await useTenantStore.getState().bootstrap("tijucas-sc");

    const state = useTenantStore.getState();
    expect(state.city?.slug).toBe("tijucas-sc");
    expect(state.modules).toHaveLength(1);
    expect(state.modules[0].key).toBe("forum");
    expect(state.modules[0].enabled).toBe(true);
    expect(state.geo?.lat).toBe(-27.2);
    expect(state.tenantKey).toContain("tijucas-sc|America/Sao_Paulo");
    expect(state.tenantTimezone).toBe("America/Sao_Paulo");
  });

  it("syncs tenant transport headers into store", () => {
    useTenantStore.getState().syncTransportContext({
      tenantKey: "itapema-sc|America/Sao_Paulo|active|hash123",
      tenantTimezone: "America/Sao_Paulo",
    });

    const state = useTenantStore.getState();
    expect(state.tenantKey).toBe("itapema-sc|America/Sao_Paulo|active|hash123");
    expect(state.tenantTimezone).toBe("America/Sao_Paulo");
  });
});
