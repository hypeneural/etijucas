import {
    reportSyncService,
    startReportSync,
    queueForSync,
    syncPendingReports,
    getSyncStatus,
    getPendingCount,
    retryFailed,
    cancelDraft,
    type SyncStatusInfo,
} from '@/services/reportSync.service';

export type { SyncStatusInfo };

export {
    startReportSync,
    queueForSync as enqueueReportDraft,
    syncPendingReports as syncReportOutbox,
    getSyncStatus as getReportOutboxStatus,
    getPendingCount as getReportOutboxPendingCount,
    retryFailed as retryFailedReportOutbox,
    cancelDraft as cancelReportOutboxDraft,
};

export const reportOutboxService = {
    start: startReportSync,
    enqueueDraft: queueForSync,
    syncNow: syncPendingReports,
    status: getSyncStatus,
    pendingCount: getPendingCount,
    retryFailed,
    cancelDraft,
    legacy: reportSyncService,
};

