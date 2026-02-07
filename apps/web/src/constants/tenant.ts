/**
 * Tenant Constants
 *
 * Centralized multi-tenancy defaults.
 */

// ============================================
// Default City
// ============================================

export const DEFAULT_CITY = {
    slug: 'tijucas-sc',
    name: 'Tijucas',
    uf: 'SC',
    fullName: 'Tijucas/SC',
    ibgeCode: '4218004',
} as const;

export const DEFAULT_CITY_SLUG = DEFAULT_CITY.slug;
export const DEFAULT_CITY_NAME = DEFAULT_CITY.name;
export const DEFAULT_CITY_UF = DEFAULT_CITY.uf;
