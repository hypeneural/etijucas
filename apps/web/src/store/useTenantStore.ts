/**
 * Tenant Store - Multi-Tenancy State Management
 * 
 * Manages tenant (city) context for the application.
 * Bootstrap fetches config from /api/v1/config on app start.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// Types
// ============================================

interface CityConfig {
    id: string;
    name: string;
    slug: string;
    uf: string;
    fullName: string;
    status: 'staging' | 'active';
    ibgeCode?: string;
}

interface CityBrand {
    appName: string;
    primaryColor: string;
    secondaryColor?: string;
    logoUrl?: string;
    faviconUrl?: string;
}

interface Module {
    key?: string;
    slug: string;
    name: string;
    namePtbr?: string;
    routeSlugPtbr?: string;
    icon: string;
    description?: string;
}

interface GeoConfig {
    defaultBairroId?: string;
    lat?: number;
    lon?: number;
}

interface TenantState {
    // State
    city: CityConfig | null;
    brand: CityBrand | null;
    modules: Module[];
    geo: GeoConfig | null;
    isLoading: boolean;
    isBootstrapped: boolean;
    error: string | null;

    // Actions
    bootstrap: (citySlug: string) => Promise<boolean>;
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

                    const { data } = await response.json();

                    set({
                        city: data.city,
                        brand: data.brand,
                        modules: data.modules || [],
                        geo: data.geo,
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
             * Clear all tenant state (for logout/city change)
             */
            clear: () => set({
                city: null,
                brand: null,
                modules: [],
                geo: null,
                isBootstrapped: false,
                error: null,
            }),

            /**
             * Check if a module is enabled for current tenant
             */
            isModuleEnabled: (identifier: string): boolean => {
                const normalized = identifier.toLowerCase();

                return get().modules.some((m) => {
                    const moduleKey = (m.key || m.slug || '').toLowerCase();
                    const moduleSlug = (m.slug || '').toLowerCase();

                    return moduleKey === normalized || moduleSlug === normalized;
                });
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
 * Check if current tenant has a specific module enabled
 */
export const isModuleEnabled = (slug: string): boolean => {
    const normalized = slug.toLowerCase();
    return useTenantStore
        .getState()
        .modules
        .some((m) => (m.key || m.slug || '').toLowerCase() === normalized || (m.slug || '').toLowerCase() === normalized);
};

// ============================================
// Helper: Resolve city from URL
// ============================================

export function resolveCityFromUrl(): string {
    const path = window.location.pathname;

    // Match /uf/cidade pattern (e.g., /sc/tijucas)
    const match = path.match(/^\/([a-z]{2})\/([a-z0-9-]+)/i);

    if (match) {
        const [, uf, cidade] = match;
        return `${cidade.toLowerCase()}-${uf.toLowerCase()}`; // "tijucas-sc"
    }

    // Default fallback
    return 'tijucas-sc';
}
