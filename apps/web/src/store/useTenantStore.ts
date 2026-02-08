/**
 * Tenant Store - Multi-Tenancy State Management
 * 
 * Manages tenant (city) context for the application.
 * Bootstrap fetches config from /api/v1/config on app start.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  TenantBrandConfig,
  TenantCityConfig,
  TenantConfigResponse,
  TenantGeoConfig,
  TenantModuleConfig,
} from '@repo/sdk';

const LEGACY_MODULE_KEY_ALIASES: Record<string, string> = {
    forum: 'forum',
    events: 'events',
    denuncias: 'reports',
    reports: 'reports',
    telefones: 'phones',
    phones: 'phones',
    alertas: 'alerts',
    alerts: 'alerts',
    turismo: 'tourism',
    tourism: 'tourism',
    'coleta-lixo': 'trash',
    trash: 'trash',
    missas: 'masses',
    masses: 'masses',
    veiculos: 'vehicles',
    vehicles: 'vehicles',
    tempo: 'weather',
    weather: 'weather',
    votacoes: 'voting',
    voting: 'voting',
    vereadores: 'council',
    council: 'council',
};

function normalizeModuleIdentifier(identifier: string): string {
    const normalized = identifier.toLowerCase().trim();
    return LEGACY_MODULE_KEY_ALIASES[normalized] ?? normalized;
}

function isLegacyModuleGateFallbackEnabled(): boolean {
    return String(import.meta.env.VITE_TENANT_LEGACY_GATE_FALLBACK ?? '0') === '1';
}

// ============================================
// Types
// ============================================

interface TenantState {
    // State
    city: TenantCityConfig | null;
    brand: TenantBrandConfig | null;
    modules: TenantModuleConfig[];
    geo: TenantGeoConfig | null;
    tenantKey: string | null;
    tenantTimezone: string | null;
    isLoading: boolean;
    isBootstrapped: boolean;
    error: string | null;

    // Actions
    bootstrap: (citySlug: string) => Promise<boolean>;
    syncTransportContext: (context: {
        citySlug?: string | null;
        tenantKey?: string | null;
        tenantTimezone?: string | null;
    }) => void;
    clear: () => void;

    // Computed
    isModuleEnabled: (slug: string) => boolean;
    getCitySlug: () => string | null;
}

// ============================================
// Store
// ============================================

export const useTenantStore = create<TenantState>()(
    persist(
        (set, get) => ({
            // Initial state
            city: null,
            brand: null,
            modules: [],
            geo: null,
            tenantKey: null,
            tenantTimezone: null,
            isLoading: false,
            isBootstrapped: false,
            error: null,

            /**
             * Bootstrap tenant config from API
             */
            bootstrap: async (citySlug: string): Promise<boolean> => {
                set({ isLoading: true, error: null });

                try {
                    // VITE_API_URL already includes /v1 (e.g., /api/v1)
                    const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
                    const response = await fetch(`${baseUrl}/config`, {
                        headers: {
                            'X-City': citySlug,
                            'Accept': 'application/json',
                        },
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || 'Cidade não encontrada');
                    }

                    const responseTenantKey = response.headers.get('X-Tenant-Key');
                    const responseTenantTimezone = response.headers.get('X-Tenant-Timezone');
                    const { data } = (await response.json()) as TenantConfigResponse;
                    const normalizedModules = (data.modules || []).map((module) => ({
                        ...module,
                        key: normalizeModuleIdentifier(module.key || module.slug || ''),
                        slug: (module.slug || '').toLowerCase(),
                    }));

                    set({
                        city: data.city,
                        brand: data.brand,
                        modules: normalizedModules,
                        geo: data.geo,
                        tenantKey: responseTenantKey ?? null,
                        tenantTimezone: responseTenantTimezone ?? data.city?.timezone ?? null,
                        isLoading: false,
                        isBootstrapped: true,
                        error: null,
                    });

                    // Apply brand theme if available
                    if (data.brand?.primaryColor) {
                        document.documentElement.style.setProperty(
                            '--color-primary',
                            data.brand.primaryColor
                        );
                    }

                    return true;
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Erro ao carregar configuração';
                    set({
                        error: message,
                        isLoading: false,
                        isBootstrapped: false,
                    });
                    return false;
                }
            },

            /**
             * Sync tenant transport context from API response headers.
             * URL remains canonical; this only keeps header context current.
             */
            syncTransportContext: ({ citySlug, tenantKey, tenantTimezone }) =>
                set((state) => {
                    const next: Partial<TenantState> = {};

                    if (tenantKey && tenantKey !== state.tenantKey) {
                        next.tenantKey = tenantKey;
                    }

                    if (tenantTimezone && tenantTimezone !== state.tenantTimezone) {
                        next.tenantTimezone = tenantTimezone;
                    } else if (!state.tenantTimezone && state.city?.timezone) {
                        next.tenantTimezone = state.city.timezone;
                    }

                    if (citySlug && state.city && citySlug !== state.city.slug) {
                        next.city = {
                            ...state.city,
                            slug: citySlug,
                        };
                    }

                    return next;
                }),

            /**
             * Clear all tenant state (for logout/city change)
             */
            clear: () => set({
                city: null,
                brand: null,
                modules: [],
                geo: null,
                tenantKey: null,
                tenantTimezone: null,
                isBootstrapped: false,
                error: null,
            }),

            /**
             * Check if a module is enabled for current tenant
             */
            isModuleEnabled: (identifier: string): boolean => {
                const normalized = normalizeModuleIdentifier(identifier);
                const isEnabled = get().modules.some((m) => {
                    const moduleKey = normalizeModuleIdentifier(m.key || m.slug || '');
                    const moduleSlug = (m.slug || '').toLowerCase();
                    const enabled = m.enabled !== false;

                    return enabled && (moduleKey === normalized || moduleSlug === normalized);
                });

                if (isEnabled) {
                    return true;
                }

                // Optional rollback path for older clients/servers.
                return isLegacyModuleGateFallbackEnabled() && !get().isBootstrapped;
            },

            /**
             * Get current city slug (for SDK)
             */
            getCitySlug: (): string | null => {
                return get().city?.slug ?? null;
            },
        }),
        {
            name: 'etijucas-tenant',
            partialize: (state) => ({
                city: state.city,
                brand: state.brand,
                modules: state.modules,
                geo: state.geo,
                tenantKey: state.tenantKey,
                tenantTimezone: state.tenantTimezone,
                isBootstrapped: state.isBootstrapped,
            }),
        }
    )
);

// ============================================
// Utility Hooks
// ============================================

/**
 * Get city slug for SDK initialization
 */
export const getCitySlugForSdk = (): string | null => {
    return useTenantStore.getState().city?.slug ?? null;
};

/**
 * Resolve city slug for transport headers.
 * Canonical URL (if present) wins over persisted tenant state.
 */
export const resolveCitySlugForRequest = (pathname?: string): string | null => {
    const resolvedPath =
        pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '');
    const fromPath = extractCitySlugFromPath(resolvedPath);

    if (fromPath) {
        return fromPath;
    }

    return useTenantStore.getState().city?.slug ?? null;
};

/**
 * Check if current tenant has a specific module enabled
 */
export const isModuleEnabled = (slug: string): boolean => {
    const normalized = normalizeModuleIdentifier(slug);
    const state = useTenantStore.getState();
    const isEnabled = state.modules.some(
        (m) =>
            m.enabled !== false &&
            (normalizeModuleIdentifier(m.key || m.slug || '') === normalized || (m.slug || '').toLowerCase() === normalized)
    );

    if (isEnabled) {
        return true;
    }

    if (isLegacyModuleGateFallbackEnabled() && !state.isBootstrapped) {
        return true;
    }

    return false;
};

// ============================================
// Helper: Resolve city from URL
// ============================================

export function extractCitySlugFromPath(path: string): string | null {
    const match = path.match(/^\/([a-z]{2})\/([a-z0-9-]+)/i);
    if (!match) {
        return null;
    }

    const [, uf, cidade] = match;
    return `${cidade.toLowerCase()}-${uf.toLowerCase()}`;
}

export function resolveCityFromUrl(): string {
    const fromPath = extractCitySlugFromPath(window.location.pathname);
    return fromPath ?? 'tijucas-sc';
}
