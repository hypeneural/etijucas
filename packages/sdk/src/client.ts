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

import type {
    User,
    Event,
    EventCategory,
    Bairro,
    Topic,
    Comment,
    PaginatedResponse,
    ApiResponse,
} from './generated-types';

// ============================================
// Configuration
// ============================================

export interface ClientConfig {
    baseUrl: string;
    getToken?: () => string | null;
    getCitySlug?: () => string | null;
    onTokenExpired?: () => void;
    onError?: (error: ApiClientError) => void;
    timeout?: number;
    retryAttempts?: number;
}

const DEFAULT_CONFIG = {
    timeout: 10000,
    retryAttempts: 3,
};

// ============================================
// Error Handling
// ============================================

export class ApiClientError extends Error {
    constructor(
        message: string,
        public status: number,
        public code?: string,
        public errors?: Record<string, string[]>
    ) {
        super(message);
        this.name = 'ApiClientError';
    }
}

// ============================================
// Request/Response Types
// ============================================

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    refreshToken: string;
    user: User;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone: string;
    bairroId?: string;
}

export interface CreateTopicRequest {
    title: string;
    content: string;
    category: 'reclamacao' | 'sugestao' | 'alerta' | 'duvida' | 'elogio';
    bairroId?: string;
    images?: { base64: string; filename: string }[];
}

export interface CreateCommentRequest {
    content: string;
    parentId?: string;
}

export interface EventFilters {
    page?: number;
    per_page?: number;
    featured?: boolean;
    category_id?: string;
    date_from?: string;
    date_to?: string;
    bairro_id?: string;
}

export interface TopicFilters {
    page?: number;
    per_page?: number;
    category?: string;
    bairro_id?: string;
    sort?: 'latest' | 'popular' | 'most_commented';
}

// ============================================
// API Client
// ============================================

export class ApiClient {
    private baseUrl: string;
    private getToken: () => string | null;
    private getCitySlug: () => string | null;
    private onTokenExpired?: () => void;
    private onError?: (error: ApiClientError) => void;
    private timeout: number;
    private retryAttempts: number;

    constructor(config: ClientConfig) {
        this.baseUrl = config.baseUrl.replace(/\/$/, '');
        this.getToken = config.getToken || (() => null);
        this.getCitySlug = config.getCitySlug || (() => null);
        this.onTokenExpired = config.onTokenExpired;
        this.onError = config.onError;
        this.timeout = config.timeout ?? DEFAULT_CONFIG.timeout;
        this.retryAttempts = config.retryAttempts ?? DEFAULT_CONFIG.retryAttempts;
    }

    // ============================================
    // Core Request Method
    // ============================================

    private async request<T>(
        endpoint: string,
        options: RequestInit & {
            params?: Record<string, any>;
            idempotencyKey?: string;
        } = {},
        attempt = 1
    ): Promise<T> {
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
            if (qs) url += `?${qs}`;
        }

        // Build headers with tenant context
        const token = this.getToken();
        const citySlug = this.getCitySlug();
        const requestId = crypto.randomUUID();

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(citySlug && { 'X-City': citySlug }),
            'X-Request-Id': requestId,
            ...(idempotencyKey && { 'X-Idempotency-Key': idempotencyKey }),
            ...(fetchOptions.headers as Record<string, string>),
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
                throw new ApiClientError(
                    error.message || `HTTP ${response.status}`,
                    response.status,
                    error.code,
                    error.errors
                );
            }

            // Handle 204 No Content
            if (response.status === 204) {
                return {} as T;
            }

            return response.json();
        } catch (error) {
            clearTimeout(timeoutId);

            // Don't retry client errors
            if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) {
                this.onError?.(error);
                throw error;
            }

            // Retry on network/server errors
            if (attempt < this.retryAttempts) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
                return this.request<T>(endpoint, options, attempt + 1);
            }

            const apiError = error instanceof ApiClientError
                ? error
                : new ApiClientError(
                    error instanceof Error ? error.message : 'Network error',
                    0,
                    'NETWORK_ERROR'
                );
            this.onError?.(apiError);
            throw apiError;
        }
    }

    // ============================================
    // HTTP Methods
    // ============================================

    async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET', params });
    }

    async post<T>(endpoint: string, data?: unknown, idempotencyKey?: string): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
            idempotencyKey,
        });
    }

    async put<T>(endpoint: string, data?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async patch<T>(endpoint: string, data?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    // ============================================
    // Auth Endpoints
    // ============================================

    get auth() {
        return {
            login: (data: LoginRequest) =>
                this.post<LoginResponse>('/api/v1/auth/login', data),

            register: (data: RegisterRequest) =>
                this.post<LoginResponse>('/api/v1/auth/register', data),

            logout: () =>
                this.post<void>('/api/v1/auth/logout'),

            me: () =>
                this.get<ApiResponse<User>>('/api/v1/auth/me'),

            refresh: (refreshToken: string) =>
                this.post<{ token: string; refreshToken: string }>('/api/v1/auth/refresh', { refreshToken }),

            sendOtp: (phone: string) =>
                this.post<{ message: string }>('/api/v1/auth/send-otp', { phone }),

            verifyOtp: (phone: string, code: string) =>
                this.post<{ verified: boolean }>('/api/v1/auth/verify-otp', { phone, code }),

            forgotPassword: (email: string) =>
                this.post<{ message: string }>('/api/v1/auth/forgot-password', { email }),

            resetPassword: (token: string, password: string, password_confirmation: string) =>
                this.post<{ message: string }>('/api/v1/auth/reset-password', { token, password, password_confirmation }),
        };
    }

    // ============================================
    // User Endpoints
    // ============================================

    get users() {
        return {
            me: () =>
                this.get<ApiResponse<User>>('/api/v1/users/me'),

            update: (data: Partial<User>) =>
                this.put<ApiResponse<User>>('/api/v1/users/me', data),

            uploadAvatar: (base64: string) =>
                this.post<ApiResponse<User>>('/api/v1/users/me/avatar', { image: base64 }),

            deleteAvatar: () =>
                this.delete<void>('/api/v1/users/me/avatar'),

            updateNotifications: (settings: Record<string, boolean>) =>
                this.put<ApiResponse<User>>('/api/v1/users/me/notifications', settings),
        };
    }

    // ============================================
    // Bairros Endpoints
    // ============================================

    get bairros() {
        return {
            list: () =>
                this.get<ApiResponse<Bairro[]>>('/api/v1/bairros'),
        };
    }

    // ============================================
    // Events Endpoints
    // ============================================

    get events() {
        return {
            list: (filters?: EventFilters) =>
                this.get<PaginatedResponse<Event>>('/api/v1/events', filters),

            get: (id: string) =>
                this.get<ApiResponse<Event>>(`/api/v1/events/${id}`),

            featured: () =>
                this.get<ApiResponse<Event[]>>('/api/v1/events/featured'),

            today: () =>
                this.get<ApiResponse<Event[]>>('/api/v1/events/today'),

            weekend: () =>
                this.get<ApiResponse<Event[]>>('/api/v1/events/weekend'),

            upcoming: (limit?: number) =>
                this.get<ApiResponse<Event[]>>('/api/v1/events/upcoming', { limit }),

            homeFeatured: () =>
                this.get<ApiResponse<Event[]>>('/api/v1/events/home-featured'),

            calendarSummary: (year: number, month: number) =>
                this.get<ApiResponse<Record<string, number>>>('/api/v1/events/calendar-summary', { year, month }),

            byDate: (date: string) =>
                this.get<ApiResponse<Event[]>>(`/api/v1/events/date/${date}`),

            byCategory: (slug: string, filters?: EventFilters) =>
                this.get<PaginatedResponse<Event>>(`/api/v1/events/category/${slug}`, filters),

            categories: () =>
                this.get<ApiResponse<EventCategory[]>>('/api/v1/events/categories'),

            // Auth required
            rsvp: (eventId: string, status: 'going' | 'interested' | 'not_going') =>
                this.post<void>(`/api/v1/events/${eventId}/rsvp`, { status }),

            cancelRsvp: (eventId: string) =>
                this.delete<void>(`/api/v1/events/${eventId}/rsvp`),

            favorite: (eventId: string) =>
                this.post<{ isFavorited: boolean }>(`/api/v1/events/${eventId}/favorite`),
        };
    }

    // ============================================
    // Forum Endpoints
    // ============================================

    get forum() {
        return {
            topics: {
                list: (filters?: TopicFilters) =>
                    this.get<PaginatedResponse<Topic>>('/api/v1/forum/topics', filters),

                get: (id: string) =>
                    this.get<ApiResponse<Topic>>(`/api/v1/forum/topics/${id}`),

                create: (data: CreateTopicRequest, idempotencyKey?: string) =>
                    this.post<ApiResponse<Topic>>('/api/v1/forum/topics', data, idempotencyKey),

                update: (id: string, data: Partial<CreateTopicRequest>) =>
                    this.put<ApiResponse<Topic>>(`/api/v1/forum/topics/${id}`, data),

                delete: (id: string) =>
                    this.delete<void>(`/api/v1/forum/topics/${id}`),

                like: (id: string) =>
                    this.post<{ isLiked: boolean; likesCount: number }>(`/api/v1/forum/topics/${id}/like`),

                save: (id: string) =>
                    this.post<{ isSaved: boolean }>(`/api/v1/forum/topics/${id}/save`),

                report: (id: string, reason: string) =>
                    this.post<void>(`/api/v1/forum/topics/${id}/report`, { reason }),
            },

            comments: {
                list: (topicId: string) =>
                    this.get<ApiResponse<Comment[]>>(`/api/v1/forum/topics/${topicId}/comments`),

                create: (topicId: string, data: CreateCommentRequest, idempotencyKey?: string) =>
                    this.post<ApiResponse<Comment>>(`/api/v1/forum/topics/${topicId}/comments`, data, idempotencyKey),

                delete: (topicId: string, commentId: string) =>
                    this.delete<void>(`/api/v1/forum/topics/${topicId}/comments/${commentId}`),

                like: (commentId: string) =>
                    this.post<{ isLiked: boolean; likesCount: number }>(`/api/v1/forum/comments/${commentId}/like`),

                report: (commentId: string, reason: string) =>
                    this.post<void>(`/api/v1/forum/comments/${commentId}/report`, { reason }),
            },

            saved: () =>
                this.get<PaginatedResponse<Topic>>('/api/v1/forum/saved'),

            upload: (base64: string, filename: string) =>
                this.post<{ url: string }>('/api/v1/forum/upload', { image: base64, filename }),
        };
    }
}

// ============================================
// Factory Function
// ============================================

export function createApiClient(config: ClientConfig): ApiClient {
    return new ApiClient(config);
}

// Re-export types
export type {
    User,
    Event,
    EventCategory,
    Bairro,
    Topic,
    Comment,
    PaginatedResponse,
    ApiResponse,
} from './generated-types';
