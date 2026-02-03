/**
 * @repo/sdk - Typed API Client for ETijucas
 *
 * This is the SINGLE SOURCE OF TRUTH for API calls.
 * All endpoints are typed and match the OpenAPI contract.
 *
 * Usage:
 * ```ts
 * import { createApiClient, type User, type Event } from '@repo/sdk';
 *
 * const api = createApiClient({
 *   baseUrl: import.meta.env.VITE_API_URL || '/api',
 *   getToken: () => localStorage.getItem('token'),
 *   onTokenExpired: () => window.location.href = '/login',
 * });
 *
 * const events = await api.events.list({ featured: true });
 * const topics = await api.forum.topics.list();
 * ```
 */
const DEFAULT_CONFIG = {
    timeout: 10000,
    retryAttempts: 3,
};
// ============================================
// Error Handling
// ============================================
export class ApiClientError extends Error {
    status;
    code;
    errors;
    constructor(message, status, code, errors) {
        super(message);
        this.status = status;
        this.code = code;
        this.errors = errors;
        this.name = 'ApiClientError';
    }
}
// ============================================
// API Client
// ============================================
export class ApiClient {
    baseUrl;
    getToken;
    onTokenExpired;
    onError;
    timeout;
    retryAttempts;
    constructor(config) {
        this.baseUrl = config.baseUrl.replace(/\/$/, '');
        this.getToken = config.getToken || (() => null);
        this.onTokenExpired = config.onTokenExpired;
        this.onError = config.onError;
        this.timeout = config.timeout ?? DEFAULT_CONFIG.timeout;
        this.retryAttempts = config.retryAttempts ?? DEFAULT_CONFIG.retryAttempts;
    }
    // ============================================
    // Core Request Method
    // ============================================
    async request(endpoint, options = {}, attempt = 1) {
        const { params, idempotencyKey, ...fetchOptions } = options;
        // Build URL with query params
        let url = `${this.baseUrl}${endpoint}`;
        if (params) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value));
                }
            });
            const qs = searchParams.toString();
            if (qs)
                url += `?${qs}`;
        }
        // Build headers
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(idempotencyKey && { 'X-Idempotency-Key': idempotencyKey }),
            ...fetchOptions.headers,
        };
        // Timeout controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        try {
            const response = await fetch(url, {
                ...fetchOptions,
                headers,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            // Handle 401 - token expired
            if (response.status === 401) {
                this.onTokenExpired?.();
                throw new ApiClientError('Sessão expirada', 401, 'UNAUTHENTICATED');
            }
            // Handle errors
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new ApiClientError(error.message || `HTTP ${response.status}`, response.status, error.code, error.errors);
            }
            // Handle 204 No Content
            if (response.status === 204) {
                return {};
            }
            return response.json();
        }
        catch (error) {
            clearTimeout(timeoutId);
            // Don't retry client errors
            if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) {
                this.onError?.(error);
                throw error;
            }
            // Retry on network/server errors
            if (attempt < this.retryAttempts) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
                return this.request(endpoint, options, attempt + 1);
            }
            const apiError = error instanceof ApiClientError
                ? error
                : new ApiClientError(error instanceof Error ? error.message : 'Network error', 0, 'NETWORK_ERROR');
            this.onError?.(apiError);
            throw apiError;
        }
    }
    // ============================================
    // HTTP Methods
    // ============================================
    async get(endpoint, params) {
        return this.request(endpoint, { method: 'GET', params });
    }
    async post(endpoint, data, idempotencyKey) {
        return this.request(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
            idempotencyKey,
        });
    }
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }
    async patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
    // ============================================
    // Auth Endpoints
    // ============================================
    get auth() {
        return {
            login: (data) => this.post('/api/v1/auth/login', data),
            register: (data) => this.post('/api/v1/auth/register', data),
            logout: () => this.post('/api/v1/auth/logout'),
            me: () => this.get('/api/v1/auth/me'),
            refresh: (refreshToken) => this.post('/api/v1/auth/refresh', { refreshToken }),
            sendOtp: (phone) => this.post('/api/v1/auth/send-otp', { phone }),
            verifyOtp: (phone, code) => this.post('/api/v1/auth/verify-otp', { phone, code }),
            forgotPassword: (email) => this.post('/api/v1/auth/forgot-password', { email }),
            resetPassword: (token, password, password_confirmation) => this.post('/api/v1/auth/reset-password', { token, password, password_confirmation }),
        };
    }
    // ============================================
    // User Endpoints
    // ============================================
    get users() {
        return {
            me: () => this.get('/api/v1/users/me'),
            update: (data) => this.put('/api/v1/users/me', data),
            uploadAvatar: (base64) => this.post('/api/v1/users/me/avatar', { image: base64 }),
            deleteAvatar: () => this.delete('/api/v1/users/me/avatar'),
            updateNotifications: (settings) => this.put('/api/v1/users/me/notifications', settings),
        };
    }
    // ============================================
    // Bairros Endpoints
    // ============================================
    get bairros() {
        return {
            list: () => this.get('/api/v1/bairros'),
        };
    }
    // ============================================
    // Events Endpoints
    // ============================================
    get events() {
        return {
            list: (filters) => this.get('/api/v1/events', filters),
            get: (id) => this.get(`/api/v1/events/${id}`),
            featured: () => this.get('/api/v1/events/featured'),
            today: () => this.get('/api/v1/events/today'),
            weekend: () => this.get('/api/v1/events/weekend'),
            upcoming: (limit) => this.get('/api/v1/events/upcoming', { limit }),
            homeFeatured: () => this.get('/api/v1/events/home-featured'),
            calendarSummary: (year, month) => this.get('/api/v1/events/calendar-summary', { year, month }),
            byDate: (date) => this.get(`/api/v1/events/date/${date}`),
            byCategory: (slug, filters) => this.get(`/api/v1/events/category/${slug}`, filters),
            categories: () => this.get('/api/v1/events/categories'),
            // Auth required
            rsvp: (eventId, status) => this.post(`/api/v1/events/${eventId}/rsvp`, { status }),
            cancelRsvp: (eventId) => this.delete(`/api/v1/events/${eventId}/rsvp`),
            favorite: (eventId) => this.post(`/api/v1/events/${eventId}/favorite`),
        };
    }
    // ============================================
    // Forum Endpoints
    // ============================================
    get forum() {
        return {
            topics: {
                list: (filters) => this.get('/api/v1/forum/topics', filters),
                get: (id) => this.get(`/api/v1/forum/topics/${id}`),
                create: (data, idempotencyKey) => this.post('/api/v1/forum/topics', data, idempotencyKey),
                update: (id, data) => this.put(`/api/v1/forum/topics/${id}`, data),
                delete: (id) => this.delete(`/api/v1/forum/topics/${id}`),
                like: (id) => this.post(`/api/v1/forum/topics/${id}/like`),
                save: (id) => this.post(`/api/v1/forum/topics/${id}/save`),
                report: (id, reason) => this.post(`/api/v1/forum/topics/${id}/report`, { reason }),
            },
            comments: {
                list: (topicId) => this.get(`/api/v1/forum/topics/${topicId}/comments`),
                create: (topicId, data, idempotencyKey) => this.post(`/api/v1/forum/topics/${topicId}/comments`, data, idempotencyKey),
                delete: (topicId, commentId) => this.delete(`/api/v1/forum/topics/${topicId}/comments/${commentId}`),
                like: (commentId) => this.post(`/api/v1/forum/comments/${commentId}/like`),
                report: (commentId, reason) => this.post(`/api/v1/forum/comments/${commentId}/report`, { reason }),
            },
            saved: () => this.get('/api/v1/forum/saved'),
            upload: (base64, filename) => this.post('/api/v1/forum/upload', { image: base64, filename }),
        };
    }
}
// ============================================
// Factory Function
// ============================================
export function createApiClient(config) {
    return new ApiClient(config);
}
