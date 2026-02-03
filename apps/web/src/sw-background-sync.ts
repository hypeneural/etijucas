import { registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// Queue name for background sync
const SYNC_QUEUE_NAME = 'etijucas-sync-queue';

// Create background sync plugin for POST/PUT/DELETE requests
const bgSyncPlugin = new BackgroundSyncPlugin(SYNC_QUEUE_NAME, {
    maxRetentionTime: 24 * 60, // Retry for up to 24 hours (in minutes)
    onSync: async ({ queue }) => {
        let entry;
        while ((entry = await queue.shiftRequest())) {
            try {
                await fetch(entry.request.clone());
                console.log('[SW] Background sync successful:', entry.request.url);
            } catch (error) {
                console.error('[SW] Background sync failed:', error);
                // Put the request back in the queue
                await queue.unshiftRequest(entry);
                throw error;
            }
        }
    },
});

// Register route for API POST/PUT/DELETE requests
registerRoute(
    ({ request, url }) => {
        // Match API requests that modify data
        const isApiRequest = url.pathname.startsWith('/api') || url.hostname.includes('api');
        const isMutationMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);
        return isApiRequest && isMutationMethod;
    },
    new NetworkOnly({
        plugins: [bgSyncPlugin],
    }),
    'POST'
);

registerRoute(
    ({ request, url }) => {
        const isApiRequest = url.pathname.startsWith('/api') || url.hostname.includes('api');
        const isMutationMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);
        return isApiRequest && isMutationMethod;
    },
    new NetworkOnly({
        plugins: [bgSyncPlugin],
    }),
    'PUT'
);

registerRoute(
    ({ request, url }) => {
        const isApiRequest = url.pathname.startsWith('/api') || url.hostname.includes('api');
        const isMutationMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);
        return isApiRequest && isMutationMethod;
    },
    new NetworkOnly({
        plugins: [bgSyncPlugin],
    }),
    'DELETE'
);

// Export for potential external use
export { SYNC_QUEUE_NAME, bgSyncPlugin };
