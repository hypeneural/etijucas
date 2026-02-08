/**
 * Tenant Constants
 *
 * Centralized multi-tenancy defaults.
 * These should only be used as fallbacks during bootstrap.
 */

// ============================================
// Default City (placeholder - should be set from API)
// ============================================

export const DEFAULT_CITY = {
    slug: null, // Will be set from API
    name: 'Cidade', // Neutral placeholder
    uf: '',
    fullName: 'Sua cidade',
    ibgeCode: null,
} as const;

export const DEFAULT_CITY_SLUG = null;
export const DEFAULT_CITY_NAME = DEFAULT_CITY.name;
export const DEFAULT_CITY_UF = DEFAULT_CITY.uf;

