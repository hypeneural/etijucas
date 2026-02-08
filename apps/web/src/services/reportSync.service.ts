/**
 * Report Sync Service - Outbox Pattern with Exponential Backoff
 * 
 * Features:
 * - Queues reports for sync
 * - Exponential backoff on failures (5s, 15s, 45s, 2min, 5min max)
 * - Idempotency key for deduplication
 * - Online/offline detection
 * - Automatic retry scheduling
 */
import { getDraft, updateDraftStatus, getDraftsByStatus } from '@/lib/idb/reportDraftDB';
import { createReport } from '@/services/report.service';
import { ApiError } from '@/api/client';
import type { ReportDraft, CreateReportPayload } from '@/types/report';

// ============================================================
// BACKOFF CONFIGURATION
// ============================================================

const BACKOFF_CONFIG = {
    /** Initial delay in ms */
    initialDelay: 5000, // 5 seconds
    /** Multiplier for each retry */
    multiplier: 3,
    /** Maximum delay in ms */
    maxDelay: 300000, // 5 minutes
    /** Maximum retry attempts before giving up */
    maxRetries: 5,
};

/**
 * Calculate backoff delay based on attempt number
 */
function calculateBackoffDelay(attempt: number): number {
    const delay = BACKOFF_CONFIG.initialDelay * Math.pow(BACKOFF_CONFIG.multiplier, attempt);
    return Math.min(delay, BACKOFF_CONFIG.maxDelay);
}

// ============================================================
// SYNC STATE
// ============================================================

interface DraftRetryInfo {
    attempts: number;
    nextRetryAt: number | null;
    lastError: string | null;
}

interface SyncState {
    isOnline: boolean;
    isSyncing: boolean;
    lastSyncAttempt: number | null;
    retryInfo: Map<string, DraftRetryInfo>;
    scheduledRetryTimer: NodeJS.Timeout | null;
}

const state: SyncState = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    lastSyncAttempt: null,
    retryInfo: new Map(),
    scheduledRetryTimer: null,
};

// ============================================================
// INITIALIZATION
// ============================================================

let listenersInitialized = false;
let bootstrapInitialized = false;

function initListeners() {
    if (listenersInitialized || typeof window === 'undefined') return;

    window.addEventListener('online', () => {
        state.isOnline = true;
        console.log('[ReportSync] Online - triggering sync');
        syncPendingReports();
    });

    window.addEventListener('offline', () => {
        state.isOnline = false;
        console.log('[ReportSync] Offline');
        // Cancel scheduled retries when offline
        if (state.scheduledRetryTimer) {
            clearTimeout(state.scheduledRetryTimer);
            state.scheduledRetryTimer = null;
        }
    });

    listenersInitialized = true;
}

/**
 * Bootstrap reports outbox sync runtime.
 * Should be called once on app startup.
 */
export function startReportSync(): void {
    if (bootstrapInitialized) return;
    bootstrapInitialized = true;

    initListeners();

    if (state.isOnline) {
        void syncPendingReports();
    }
}

// ============================================================
// SYNC OPERATIONS
// ============================================================

/**
 * Queue a draft for sync
 */
export async function queueForSync(draftId: string): Promise<void> {
    const draft = await getDraft(draftId);
    if (!draft) {
        throw new Error(`[ReportSync] Draft not found for queueing: ${draftId}`);
    }

    await updateDraftStatus(draftId, 'queued');

    // Reset retry info for this draft
    state.retryInfo.set(draftId, {
        attempts: 0,
        nextRetryAt: null,
        lastError: null,
    });

    // Attempt sync immediately if online
    if (state.isOnline && !state.isSyncing) {
        syncPendingReports();
    }
}

/**
 * Main sync loop - process all queued and failed reports
 */
export async function syncPendingReports(): Promise<{
    synced: number;
    failed: number;
}> {
    if (!state.isOnline) {
        console.log('[ReportSync] Offline, skipping sync');
        return { synced: 0, failed: 0 };
    }

    if (state.isSyncing) {
        console.log('[ReportSync] Already syncing, skipping');
        return { synced: 0, failed: 0 };
    }

    state.isSyncing = true;
    state.lastSyncAttempt = Date.now();

    let synced = 0;
    let failed = 0;

    try {
        // Get all queued reports
        const queuedIds = await getDraftsByStatus('queued');

        // Get failed reports that are ready to retry
        const failedIds = await getFailedReadyForRetry();

        const allIds = [...queuedIds, ...failedIds];

        for (const draftId of allIds) {
            const result = await syncSingleReport(draftId);
            if (result) {
                synced++;
                // Clear retry info on success
                state.retryInfo.delete(draftId);
            } else {
                failed++;
            }
        }

        // Schedule next retry if there are failed reports
        scheduleNextRetry();
    } catch (error) {
        console.error('[ReportSync] Sync loop error:', error);
    } finally {
        state.isSyncing = false;
    }

    console.log(`[ReportSync] Sync complete: ${synced} synced, ${failed} failed`);
    return { synced, failed };
}

/**
 * Get failed drafts that are ready for retry based on backoff timing
 */
async function getFailedReadyForRetry(): Promise<string[]> {
    const failedIds = await getDraftsByStatus('failed');
    const now = Date.now();

    return failedIds.filter((id) => {
        const info = state.retryInfo.get(id);
        if (!info) return true; // No retry info = first failure, retry immediately
        if (info.attempts >= BACKOFF_CONFIG.maxRetries) return false; // Max retries reached
        if (!info.nextRetryAt) return true; // No scheduled retry
        return now >= info.nextRetryAt; // Check if ready
    });
}

/**
 * Schedule the next retry based on earliest nextRetryAt
 */
function scheduleNextRetry(): void {
    // Clear existing timer
    if (state.scheduledRetryTimer) {
        clearTimeout(state.scheduledRetryTimer);
        state.scheduledRetryTimer = null;
    }

    if (!state.isOnline) return;

    // Find the earliest next retry time
    let earliestRetry: number | null = null;

    for (const [, info] of state.retryInfo) {
        if (info.nextRetryAt && info.attempts < BACKOFF_CONFIG.maxRetries) {
            if (!earliestRetry || info.nextRetryAt < earliestRetry) {
                earliestRetry = info.nextRetryAt;
            }
        }
    }

    if (earliestRetry) {
        const delay = Math.max(0, earliestRetry - Date.now());
        console.log(`[ReportSync] Scheduling retry in ${Math.round(delay / 1000)}s`);

        state.scheduledRetryTimer = setTimeout(() => {
            state.scheduledRetryTimer = null;
            if (state.isOnline && !state.isSyncing) {
                syncPendingReports();
            }
        }, delay);
    }
}

function isRetryableSyncError(error: unknown): boolean {
    if (error instanceof ApiError) {
        // Fatal client errors should not loop indefinitely in the outbox.
        if (error.status >= 400 && error.status < 500) {
            return error.status === 408 || error.status === 429;
        }
    }

    return true;
}

/**
 * Sync a single report
 */
async function syncSingleReport(draftId: string): Promise<boolean> {
    try {
        await updateDraftStatus(draftId, 'sending');

        const draft = await getDraft(draftId);
        if (!draft) {
            console.warn('[ReportSync] Draft not found:', draftId);
            return false;
        }

        // Convert draft to API payload
        const payload = draftToPayload(draft);

        // Send to API with idempotency key
        const result = await createReport(payload, draft.idempotencyKey);

        if (result) {
            await updateDraftStatus(draftId, 'sent');
            console.log('[ReportSync] Report synced:', draftId);
            return true;
        } else {
            throw new Error('API returned no result');
        }
    } catch (error) {
        console.error('[ReportSync] Failed to sync report:', draftId, error);

        const retryable = isRetryableSyncError(error);

        // Update retry info with exponential backoff
        const currentInfo = state.retryInfo.get(draftId) || { attempts: 0, nextRetryAt: null, lastError: null };
        const newAttempts = retryable ? currentInfo.attempts + 1 : BACKOFF_CONFIG.maxRetries;
        const delay = calculateBackoffDelay(newAttempts);

        state.retryInfo.set(draftId, {
            attempts: newAttempts,
            nextRetryAt: retryable ? Date.now() + delay : null,
            lastError: error instanceof Error ? error.message : 'Unknown error',
        });

        await updateDraftStatus(draftId, 'failed');

        if (retryable) {
            console.log(`[ReportSync] Will retry in ${Math.round(delay / 1000)}s (attempt ${newAttempts}/${BACKOFF_CONFIG.maxRetries})`);
        } else {
            console.warn(`[ReportSync] Marked as failed without retry (non-retryable): ${draftId}`);
        }

        return false;
    }
}

/**
 * Convert ReportDraft to API payload
 */
function draftToPayload(draft: ReportDraft): CreateReportPayload {
    return {
        categoryId: draft.categoryId || '',
        title: draft.title || '',
        description: draft.description || '',
        addressText: draft.location?.address,
        addressSource: draft.location?.source,
        latitude: draft.location?.latitude,
        longitude: draft.location?.longitude,
        locationQuality: draft.location?.quality,
        locationAccuracyM: draft.location?.accuracy,
        images: draft.images.map((img) => img.file),
    };
}

// ============================================================
// STATUS & STATS
// ============================================================

export interface SyncStatusInfo {
    isOnline: boolean;
    isSyncing: boolean;
    lastSyncAttempt: number | null;
    pendingCount: number;
    failedWithRetryInfo: Array<{
        draftId: string;
        attempts: number;
        nextRetryIn: number | null; // seconds until next retry
        lastError: string | null;
    }>;
}

/**
 * Get sync status with detailed retry info
 */
export async function getSyncStatus(): Promise<SyncStatusInfo> {
    const queued = await getDraftsByStatus('queued');
    const sending = await getDraftsByStatus('sending');
    const failed = await getDraftsByStatus('failed');

    const now = Date.now();
    const failedWithRetryInfo = failed.map((draftId) => {
        const info = state.retryInfo.get(draftId);
        return {
            draftId,
            attempts: info?.attempts || 0,
            nextRetryIn: info?.nextRetryAt ? Math.max(0, Math.round((info.nextRetryAt - now) / 1000)) : null,
            lastError: info?.lastError || null,
        };
    });

    return {
        isOnline: state.isOnline,
        isSyncing: state.isSyncing,
        lastSyncAttempt: state.lastSyncAttempt,
        pendingCount: queued.length + sending.length + failed.length,
        failedWithRetryInfo,
    };
}

/**
 * Get pending count
 */
export async function getPendingCount(): Promise<number> {
    const queued = await getDraftsByStatus('queued');
    const sending = await getDraftsByStatus('sending');
    const failed = await getDraftsByStatus('failed');
    return queued.length + sending.length + failed.length;
}

/**
 * Retry all failed reports immediately (manual trigger)
 */
export async function retryFailed(): Promise<void> {
    const failedIds = await getDraftsByStatus('failed');

    // Reset retry info for all failed drafts
    for (const id of failedIds) {
        state.retryInfo.set(id, {
            attempts: 0,
            nextRetryAt: null,
            lastError: null,
        });
        await updateDraftStatus(id, 'queued');
    }

    if (state.isOnline && !state.isSyncing) {
        syncPendingReports();
    }
}

/**
 * Cancel a specific failed draft (give up retrying)
 */
export async function cancelDraft(draftId: string): Promise<void> {
    state.retryInfo.delete(draftId);
    // We keep the draft as 'failed' but stop retrying
}

// Export service
export const reportSyncService = {
    startReportSync,
    queueForSync,
    syncPendingReports,
    getSyncStatus,
    getPendingCount,
    retryFailed,
    cancelDraft,
};
