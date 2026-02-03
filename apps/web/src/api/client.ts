import { API_CONFIG, ENDPOINTS } from './config';

// Token storage keys
const TOKEN_KEY = 'etijucas_token';
const REFRESH_TOKEN_KEY = 'etijucas_refresh_token';

// Track refresh in progress to prevent loops
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Get auth token from localStorage
 */
export function getAuthToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get refresh token from localStorage
 */
function getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Set both tokens
 */
export function setTokens(token: string, refreshToken: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

/**
 * Clear all tokens on logout or session expiry
 */
export function clearAuthToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Custom error class for API errors
export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public code?: string,
        public errors?: Record<string, string[]>
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// Request options type
interface RequestOptions extends RequestInit {
    params?: Record<string, string | number | boolean | undefined>;
    timeout?: number;
}

// Sleep utility for retry delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Build URL with query params
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    // Construct the full URL by concatenating base and endpoint
    // Note: We use string concatenation because URL constructor ignores base path when endpoint starts with /
    const baseURL = API_CONFIG.baseURL.endsWith('/')
        ? API_CONFIG.baseURL.slice(0, -1)
        : API_CONFIG.baseURL;

    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let fullUrl = `${baseURL}${normalizedEndpoint}`;

    // Add query params
    if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        });
        const queryString = searchParams.toString();
        if (queryString) {
            fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
        }
    }

    return fullUrl;
}

// Get adaptive timeout based on network type
function getAdaptiveTimeout(defaultTimeout: number): number {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
        const connection = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
        if (connection?.saveData) return 3000; // Data saver mode
        if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') return 3000;
        if (connection?.effectiveType === '3g') return 5000;
    }
    return defaultTimeout;
}

/**
 * Attempt to refresh the access token using the refresh token.
 * Uses direct fetch to avoid interceptor loops.
 */
async function performTokenRefresh(): Promise<string | null> {
    // If already refreshing, wait for it
    if (isRefreshing && refreshPromise) {
        return refreshPromise;
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        return null;
    }

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            const response = await fetch(
                buildUrl(ENDPOINTS.auth.refresh, undefined),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken }),
                }
            );

            if (!response.ok) {
                // Refresh failed - clear tokens
                clearAuthToken();
                return null;
            }

            const data = await response.json();

            // Store new tokens
            setTokens(data.token, data.refreshToken);

            return data.token;
        } catch {
            clearAuthToken();
            return null;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

// Main fetch function with error handling and retry
async function fetchWithRetry<T>(
    endpoint: string,
    options: RequestOptions = {},
    attempt = 1
): Promise<T> {
    // Skip fetch immediately if offline - use cached data or throw
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new ApiError('Você está offline. Os dados serão sincronizados quando a conexão voltar.', 0, 'OFFLINE');
    }

    const { params, timeout, ...fetchOptions } = options;

    // Use adaptive timeout
    const effectiveTimeout = timeout ?? getAdaptiveTimeout(API_CONFIG.timeout);

    const url = buildUrl(endpoint, params);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);

    try {
        // Build headers with auth token if available
        const authToken = getAuthToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-App-Version': '1.0.0',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
            ...fetchOptions.headers as Record<string, string>,
        };

        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
            headers,
        });

        clearTimeout(timeoutId);

        // Handle 401 Unauthorized - try token refresh first
        if (response.status === 401) {
            // Check if this is already a retry after refresh
            const skipRefresh = (options as RequestOptions & { _skipRefresh?: boolean })._skipRefresh;

            if (!skipRefresh && !isRefreshing) {
                // Try to refresh the token
                const newToken = await performTokenRefresh();

                if (newToken) {
                    // Retry the original request with new token
                    return fetchWithRetry<T>(
                        endpoint,
                        { ...options, _skipRefresh: true } as RequestOptions & { _skipRefresh: boolean },
                        attempt
                    );
                }
            }

            // Refresh failed or already tried - clear tokens
            // Don't auto-redirect: let each page handle auth requirements
            // This allows public pages (like forum viewing) to work without login
            clearAuthToken();
            throw new ApiError('Sessão expirada. Faça login novamente.', 401, 'UNAUTHENTICATED');
        }

        // Handle non-OK responses
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            throw new ApiError(
                errorData.message || `HTTP ${response.status}: ${response.statusText}`,
                response.status,
                errorData.code,
                errorData.errors
            );
        }

        // Return empty object for 204 No Content
        if (response.status === 204) {
            return {} as T;
        }

        return response.json();
    } catch (error) {
        clearTimeout(timeoutId);

        // Don't retry on client errors (4xx)
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
            throw error;
        }

        // Retry on network errors or server errors
        if (attempt < API_CONFIG.retryAttempts) {
            await sleep(API_CONFIG.retryDelay * attempt);
            return fetchWithRetry<T>(endpoint, options, attempt + 1);
        }

        // Convert to ApiError if needed
        if (error instanceof Error && error.name === 'AbortError') {
            throw new ApiError('Request timeout', 408);
        }

        if (!(error instanceof ApiError)) {
            throw new ApiError(
                error instanceof Error ? error.message : 'Network error',
                0
            );
        }

        throw error;
    }
}

// API Client
export const apiClient = {
    /**
     * GET request
     */
    get: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) =>
        fetchWithRetry<T>(endpoint, { method: 'GET', params }),

    /**
     * POST request
     */
    post: <T>(endpoint: string, data?: unknown) =>
        fetchWithRetry<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        }),

    /**
     * PUT request
     */
    put: <T>(endpoint: string, data?: unknown) =>
        fetchWithRetry<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        }),

    /**
     * PATCH request
     */
    patch: <T>(endpoint: string, data?: unknown) =>
        fetchWithRetry<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        }),

    /**
     * POST request with FormData (for file uploads)
     * Does NOT set Content-Type header - browser sets it automatically with boundary
     */
    postFormData: async <T>(
        endpoint: string,
        formData: FormData,
        options?: { headers?: Record<string, string> }
    ): Promise<T> => {
        const url = buildUrl(endpoint);
        const authToken = getAuthToken();

        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'X-App-Version': '1.0.0',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
            ...(options?.headers || {}),
        };
        // Note: Do NOT set Content-Type for FormData - browser sets it with boundary

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(
                errorData.message || 'Upload failed',
                response.status,
                errorData.code,
                errorData.errors
            );
        }

        return response.json();
    },

    /**
     * DELETE request
     */
    delete: <T>(endpoint: string) =>
        fetchWithRetry<T>(endpoint, { method: 'DELETE' }),
};

export default apiClient;
