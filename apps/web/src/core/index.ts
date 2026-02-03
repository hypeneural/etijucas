/**
 * Core Module
 * 
 * Código compartilhado entre todas as features.
 * 
 * Estrutura:
 * - api/     → HTTP client, auth, interceptors
 * - offline/ → Sync queue, idempotency, retry
 * - router/  → Route guards, navigation
 * - ui/      → Design system components
 * - utils/   → Helpers, formatters
 */

export * from './api';
export * from './offline';
export * from './router';
export * from './ui';
export * from './utils';

