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
import type { User, Event, EventCategory, Bairro, PaginatedResponse } from './generated-types';
import type { TenantCitiesResponse, TenantCityDetectResponse, TenantConfigResponse } from './tenant-config';
export interface ClientConfig {
    baseUrl: string;
    getToken?: () => string | null;
    getCitySlug?: () => string | null;
    onTokenExpired?: () => void;
    onError?: (error: ApiClientError) => void;
    timeout?: number;
    retryAttempts?: number;
}
export declare class ApiClientError extends Error {
    status: number;
    code?: string | undefined;
    errors?: Record<string, string[]> | undefined;
    constructor(message: string, status: number, code?: string | undefined, errors?: Record<string, string[]> | undefined);
}
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
    images?: {
        base64: string;
        filename: string;
    }[];
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
export declare class ApiClient {
    private baseUrl;
    private getToken;
    private getCitySlug;
    private onTokenExpired?;
    private onError?;
    private timeout;
    private retryAttempts;
    constructor(config: ClientConfig);
    private request;
    get<T>(endpoint: string, params?: Record<string, any>): Promise<T>;
    post<T>(endpoint: string, data?: unknown, idempotencyKey?: string): Promise<T>;
    put<T>(endpoint: string, data?: unknown): Promise<T>;
    patch<T>(endpoint: string, data?: unknown): Promise<T>;
    delete<T>(endpoint: string): Promise<T>;
    get tenant(): {
        config: (citySlug?: string) => Promise<TenantConfigResponse>;
        cities: () => Promise<TenantCitiesResponse>;
        detect: (lat: number, lon: number) => Promise<TenantCityDetectResponse>;
    };
    get auth(): {
        login: (data: LoginRequest) => Promise<LoginResponse>;
        register: (data: RegisterRequest) => Promise<LoginResponse>;
        logout: () => Promise<void>;
        me: () => Promise<ApiResponse<User>>;
        refresh: (refreshToken: string) => Promise<{
            token: string;
            refreshToken: string;
        }>;
        sendOtp: (phone: string) => Promise<{
            message: string;
        }>;
        verifyOtp: (phone: string, code: string) => Promise<{
            verified: boolean;
        }>;
        forgotPassword: (email: string) => Promise<{
            message: string;
        }>;
        resetPassword: (token: string, password: string, password_confirmation: string) => Promise<{
            message: string;
        }>;
    };
    get users(): {
        me: () => Promise<ApiResponse<User>>;
        update: (data: Partial<User>) => Promise<ApiResponse<User>>;
        uploadAvatar: (base64: string) => Promise<ApiResponse<User>>;
        deleteAvatar: () => Promise<void>;
        updateNotifications: (settings: Record<string, boolean>) => Promise<ApiResponse<User>>;
    };
    get bairros(): {
        list: () => Promise<ApiResponse<Bairro[]>>;
    };
    get events(): {
        list: (filters?: EventFilters) => Promise<PaginatedResponse<Event>>;
        get: (id: string) => Promise<ApiResponse<Event>>;
        featured: () => Promise<ApiResponse<Event[]>>;
        today: () => Promise<ApiResponse<Event[]>>;
        weekend: () => Promise<ApiResponse<Event[]>>;
        upcoming: (limit?: number) => Promise<ApiResponse<Event[]>>;
        homeFeatured: () => Promise<ApiResponse<Event[]>>;
        calendarSummary: (year: number, month: number) => Promise<ApiResponse<Record<string, number>>>;
        byDate: (date: string) => Promise<ApiResponse<Event[]>>;
        byCategory: (slug: string, filters?: EventFilters) => Promise<PaginatedResponse<Event>>;
        categories: () => Promise<ApiResponse<EventCategory[]>>;
        rsvp: (eventId: string, status: "going" | "interested" | "not_going") => Promise<void>;
        cancelRsvp: (eventId: string) => Promise<void>;
        favorite: (eventId: string) => Promise<{
            isFavorited: boolean;
        }>;
    };
    get forum(): {
        topics: {
            list: (filters?: TopicFilters) => Promise<PaginatedResponse<Topic>>;
            get: (id: string) => Promise<ApiResponse<Topic>>;
            create: (data: CreateTopicRequest, idempotencyKey?: string) => Promise<ApiResponse<Topic>>;
            update: (id: string, data: Partial<CreateTopicRequest>) => Promise<ApiResponse<Topic>>;
            delete: (id: string) => Promise<void>;
            like: (id: string) => Promise<{
                isLiked: boolean;
                likesCount: number;
            }>;
            save: (id: string) => Promise<{
                isSaved: boolean;
            }>;
            report: (id: string, reason: string) => Promise<void>;
        };
        comments: {
            list: (topicId: string) => Promise<ApiResponse<Comment[]>>;
            create: (topicId: string, data: CreateCommentRequest, idempotencyKey?: string) => Promise<ApiResponse<Comment>>;
            delete: (topicId: string, commentId: string) => Promise<void>;
            like: (commentId: string) => Promise<{
                isLiked: boolean;
                likesCount: number;
            }>;
            report: (commentId: string, reason: string) => Promise<void>;
        };
        saved: () => Promise<PaginatedResponse<Topic>>;
        upload: (base64: string, filename: string) => Promise<{
            url: string;
        }>;
    };
}
export declare function createApiClient(config: ClientConfig): ApiClient;
export type { User, Event, EventCategory, Bairro, Topic, Comment, PaginatedResponse, ApiResponse, } from './generated-types';
//# sourceMappingURL=client.d.ts.map