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
export { ApiClient, createApiClient, ApiClientError } from './client';
export type { ClientConfig, LoginRequest, LoginResponse, RegisterRequest, CreateTopicRequest, CreateCommentRequest, EventFilters, TopicFilters, } from './client';
export type { User, Bairro, Event, EventCategory, EventTag, Topic, Comment, PaginationMeta, ApiResponse, PaginatedResponse, } from './generated-types';
//# sourceMappingURL=index.d.ts.map