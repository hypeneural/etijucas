import { useEffect, useCallback, useRef } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { syncQueueDB, SyncQueueItem } from '@/lib/localDatabase';
import { API_CONFIG, ENDPOINTS } from '@/api/config';
import { toast } from 'sonner';

const MAX_RETRIES = 5;
const BASE_DELAY = 1000; // 1 second

/**
 * Get auth token from localStorage (auth store)
 */
function getAuthToken(): string | null {
    try {
        const authStorage = localStorage.getItem('etijucas-auth');
        if (authStorage) {
            const parsed = JSON.parse(authStorage);
            return parsed?.state?.token || null;
        }
    } catch {
        console.warn('[Sync] Failed to read auth token');
    }
    return null;
}

/**
 * Calculate backoff delay with exponential increase
 * Delays: 1s, 2s, 4s, 8s, 16s
 */
function getBackoffDelay(retryCount: number): number {
    return Math.min(BASE_DELAY * Math.pow(2, retryCount), 30000); // Max 30s
}

/**
 * Hook that monitors online status and processes the IndexedDB sync queue
 * when the device comes back online, with exponential backoff.
 */
export function useOnlineSync() {
    const { isOnline, wasOffline } = useNetworkStatus();
    const processingRef = useRef(false);
    const pendingCountRef = useRef(0);

    const processMutation = useCallback(async (item: SyncQueueItem): Promise<boolean> => {
        try {
            let endpoint = '';
            let method = 'POST';
            let body: unknown = item.data;

            switch (item.type) {
                case 'report':
                    endpoint = ENDPOINTS.reports.create;
                    break;
                case 'topic':
                    endpoint = ENDPOINTS.topics.create;
                    break;
                case 'comment': {
                    const data = item.data as { topicId: string };
                    endpoint = ENDPOINTS.topics.comments(data.topicId);
                    break;
                }
                case 'like': {
                    const likeData = item.data as { topicId: string };
                    endpoint = ENDPOINTS.topics.like(likeData.topicId);
                    body = undefined;
                    break;
                }
                case 'unlike': {
                    const unlikeData = item.data as { topicId: string };
                    endpoint = ENDPOINTS.topics.unlike(unlikeData.topicId);
                    body = undefined;
                    break;
                }
                default:
                    console.warn(`Unknown sync type: ${item.type}`);
                    return false;
            }

            // Build full URL with API base
            const fullUrl = `${API_CONFIG.baseURL}${endpoint}`;

            // Build headers with optional auth
            const headers: Record<string, string> = {
                'X-Idempotency-Key': item.idempotencyKey,
            };

            // Only add Content-Type if there's a body
            if (body) {
                headers['Content-Type'] = 'application/json';
            }

            // Add auth token if available
            const token = getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(fullUrl, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error(`[Sync] Failed to process item ${item.id}:`, error);
            return false;
        }
    }, []);

    const processQueue = useCallback(async () => {
        if (processingRef.current || !navigator.onLine) {
            return;
        }

        const queue = await syncQueueDB.getAll();
        if (queue.length === 0) return;

        processingRef.current = true;
        pendingCountRef.current = queue.length;

        const toastId = toast.loading(
            `Sincronizando ${queue.length} ${queue.length === 1 ? 'alteração' : 'alterações'}...`
        );

        let successCount = 0;
        let failCount = 0;

        for (const item of queue) {
            // Check if we should skip based on backoff timing
            if (item.lastAttempt) {
                const timeSince = Date.now() - new Date(item.lastAttempt).getTime();
                const requiredDelay = getBackoffDelay(item.retryCount);
                if (timeSince < requiredDelay) {
                    console.log(`[Sync] Skipping ${item.id} - waiting for backoff (${requiredDelay - timeSince}ms left)`);
                    continue;
                }
            }

            if (item.retryCount >= MAX_RETRIES) {
                // Remove mutations that exceeded max retries
                console.warn(`[Sync] Removing ${item.id} - exceeded max retries`);
                await syncQueueDB.remove(item.id);
                failCount++;
                continue;
            }

            const success = await processMutation(item);

            if (success) {
                await syncQueueDB.remove(item.id);
                successCount++;
            } else {
                // Update retry count and last attempt
                await syncQueueDB.update(item.id, {
                    retryCount: item.retryCount + 1,
                    lastAttempt: new Date(),
                });
                failCount++;
            }
        }

        processingRef.current = false;

        // Update pending count
        const remaining = await syncQueueDB.getAll();
        pendingCountRef.current = remaining.length;

        // Update toast with result
        if (failCount === 0 && successCount > 0) {
            toast.success(
                `${successCount} ${successCount === 1 ? 'alteração sincronizada' : 'alterações sincronizadas'}!`,
                { id: toastId }
            );
        } else if (failCount > 0 && successCount > 0) {
            toast.warning(`${successCount} sincronizadas, ${failCount} pendentes`, { id: toastId });
        } else if (failCount > 0) {
            toast.error(
                `Falha ao sincronizar ${failCount} ${failCount === 1 ? 'alteração' : 'alterações'}. Tentaremos novamente.`,
                { id: toastId }
            );
        } else {
            toast.dismiss(toastId);
        }

        // Schedule retry for failed items with backoff
        if (remaining.length > 0) {
            const nextDelay = getBackoffDelay(Math.min(...remaining.map(i => i.retryCount)));
            console.log(`[Sync] Scheduling retry in ${nextDelay}ms for ${remaining.length} items`);
            setTimeout(() => {
                if (navigator.onLine) {
                    processQueue();
                }
            }, nextDelay);
        }
    }, [processMutation]);

    // Process queue when coming back online
    useEffect(() => {
        if (isOnline && wasOffline) {
            // Small delay to ensure connection is stable
            const timer = setTimeout(() => {
                processQueue();
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [isOnline, wasOffline, processQueue]);

    // Also process on mount if online
    useEffect(() => {
        if (isOnline) {
            const timer = setTimeout(() => {
                processQueue();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [isOnline, processQueue]);

    return {
        pendingCount: pendingCountRef.current,
        processQueue,
    };
}

export default useOnlineSync;
