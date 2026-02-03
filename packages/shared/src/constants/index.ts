/**
 * Shared constants for the application
 */

/** Default pagination settings */
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_PER_PAGE: 15,
    MAX_PER_PAGE: 100,
} as const;

/** Animation durations in milliseconds */
export const ANIMATION = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
} as const;

/** Storage keys for localStorage/sessionStorage */
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'etijucas_auth_token',
    USER_PREFERENCES: 'etijucas_user_prefs',
    THEME: 'etijucas_theme',
} as const;

/** API configuration - BASE_URL should be set at runtime in the app */
export const API_CONFIG = {
    DEFAULT_BASE_URL: '/api',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
} as const;
