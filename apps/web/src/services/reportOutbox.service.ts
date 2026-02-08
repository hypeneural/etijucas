import {
    reportSyncService,
    startReportSync,
    queueForSync,
    syncPendingReports,
    getSyncStatus,
    getReportSyncMetrics,
    subscribeReportSyncMetrics,
    getPendingCount,
    retryFailed,
    cancelDraft,
    type SyncStatusInfo,
    type ReportSyncMetricEvent,
    type ReportSyncMetricsSnapshot,
} from '@/services/reportSync.service';

export type { SyncStatusInfo };
export type { ReportSyncMetricEvent, ReportSyncMetricsSnapshot };

export {
    startReportSync,
    queueForSync as enqueueReportDraft,
    syncPendingReports as syncReportOutbox,
    getSyncStatus as getReportOutboxStatus,
    getReportSyncMetrics as getReportOutboxMetrics,
    subscribeReportSyncMetrics as subscribeReportOutboxMetrics,
    getPendingCount as getReportOutboxPendingCount,
    retryFailed as retryFailedReportOutbox,
    cancelDraft as cancelReportOutboxDraft,
};

export const reportOutboxService = {
    start: startReportSync,
    enqueueDraft: queueForSync,
    syncNow: syncPendingReports,
    status: getSyncStatus,
    metrics: getReportSyncMetrics,
    subscribeMetrics: subscribeReportSyncMetrics,
    pendingCount: getPendingCount,
    retryFailed,
    cancelDraft,
    legacy: reportSyncService,
};
