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
