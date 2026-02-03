/**
 * Core API Module
 * 
 * HTTP client centralizado com:
 * - Auth token management
 * - Refresh token automático
 * - Retry com backoff
 * - Interceptors
 * - Offline detection
 * 
 * Usage:
 * ```ts
 * import { httpClient } from '@/core/api';
 * const data = await httpClient.get('/api/v1/events');
 * ```
 * 
 * Ou use o @repo/sdk que já usa este client internamente.
 */

// Re-export from existing api folder for backward compatibility
export { apiClient, getAuthToken, setTokens, clearAuthToken, ApiError } from '../../api/client';
export { API_CONFIG, ENDPOINTS } from '../../api/config';

// Alias for clarity
export { apiClient as httpClient } from '../../api/client';
