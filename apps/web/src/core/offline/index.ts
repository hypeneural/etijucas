/**
 * Core Offline Module
 * 
 * Gerenciamento de:
 * - Fila de mutações offline
 * - Idempotency keys
 * - Sync engine
 * - Retry policies
 * 
 * @see OFFLINE_SYNC.md para documentação completa
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================
// Types
// ============================================

export interface OfflineMutation<T = unknown> {
    id: string;
    idempotencyKey: string;
    entityType: string;
    entityId?: string;
    endpoint: string;
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    payload: T;
    schemaVersion: number;
    retryPolicy: RetryPolicy;
    status: 'pending' | 'syncing' | 'error' | 'success';
    retryCount: number;
    createdAt: string;
    lastError?: string;
}

export interface RetryPolicy {
    maxRetries: number;
    backoffMs: number[];
}

// ============================================
// Default Policies
// ============================================

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
    maxRetries: 5,
    backoffMs: [1000, 5000, 15000, 60000, 300000],
};

export const AGGRESSIVE_RETRY_POLICY: RetryPolicy = {
    maxRetries: 10,
    backoffMs: [500, 1000, 2000, 5000, 10000, 30000, 60000, 120000, 300000, 600000],
};

export const TOGGLE_RETRY_POLICY: RetryPolicy = {
    maxRetries: Infinity, // Toggles always retry
    backoffMs: [1000, 2000, 5000],
};

// ============================================
// Mutation Factory
// ============================================

export function createOfflineMutation<T>(
    params: {
        entityType: string;
        entityId?: string;
        endpoint: string;
        method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        payload: T;
        retryPolicy?: RetryPolicy;
    }
): OfflineMutation<T> {
    return {
        id: uuidv4(),
        idempotencyKey: uuidv4(),
        entityType: params.entityType,
        entityId: params.entityId,
        endpoint: params.endpoint,
        method: params.method,
        payload: params.payload,
        schemaVersion: 1,
        retryPolicy: params.retryPolicy || DEFAULT_RETRY_POLICY,
        status: 'pending',
        retryCount: 0,
        createdAt: new Date().toISOString(),
    };
}

// ============================================
// Queue Helpers
// ============================================

export function getRetryDelay(mutation: OfflineMutation): number {
    const { backoffMs } = mutation.retryPolicy;
    const index = Math.min(mutation.retryCount, backoffMs.length - 1);
    return backoffMs[index];
}

export function shouldRetry(mutation: OfflineMutation, statusCode: number): boolean {
    // Don't retry client errors (except 401 which might be token issue)
    if (statusCode >= 400 && statusCode < 500 && statusCode !== 401) {
        return false;
    }

    // Check max retries
    if (mutation.retryCount >= mutation.retryPolicy.maxRetries) {
        return false;
    }

    return true;
}

// ============================================
// Exports
// ============================================

export * from './queue';
