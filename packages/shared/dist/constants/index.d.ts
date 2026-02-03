/**
 * Shared constants for the application
 */
/** Default pagination settings */
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_PER_PAGE: 15;
    readonly MAX_PER_PAGE: 100;
};
/** Animation durations in milliseconds */
export declare const ANIMATION: {
    readonly FAST: 150;
    readonly NORMAL: 300;
    readonly SLOW: 500;
};
/** Storage keys for localStorage/sessionStorage */
export declare const STORAGE_KEYS: {
    readonly AUTH_TOKEN: "etijucas_auth_token";
    readonly USER_PREFERENCES: "etijucas_user_prefs";
    readonly THEME: "etijucas_theme";
};
/** API configuration - BASE_URL should be set at runtime in the app */
export declare const API_CONFIG: {
    readonly DEFAULT_BASE_URL: "/api";
    readonly TIMEOUT: 30000;
    readonly RETRY_ATTEMPTS: 3;
};
//# sourceMappingURL=index.d.ts.map