/**
 * @repo/sdk - ETijucas API Client
 * 
 * This SDK is the SINGLE SOURCE OF TRUTH for API calls.
 * 
 * Usage:
 * ```ts
 * import { createApiClient, type User, type Event } from '@repo/sdk';
 * 
 * const api = createApiClient({
 *   baseUrl: '/api',
 *   getToken: () => localStorage.getItem('token'),
 * });
 * 
 * const events = await api.events.list({ featured: true });
 * ```
 */

// Client
export { ApiClient, createApiClient, ApiClientError } from './client';

// Request/Response types from client
export type {
    ClientConfig,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    CreateTopicRequest,
    CreateCommentRequest,
    EventFilters,
    TopicFilters,
} from './client';

// Entity types
export type {
    User,
    Bairro,
    Event,
    EventCategory,
    EventTag,
    Topic,
    Comment,
    PaginationMeta,
    ApiResponse,
    PaginatedResponse,
} from './generated-types';

export type {
    TenantCityConfig,
    TenantBrandConfig,
    TenantModuleConfig,
    TenantGeoConfig,
    TenantFeaturesConfig,
    TenantConfigPayload,
    TenantConfigResponse,
    TenantCityListItem,
    TenantCitiesResponse,
    TenantCityDetectData,
    TenantCityDetectResponse,
} from './tenant-config';
