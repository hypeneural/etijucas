// Hooks Index
// Re-export all hooks for easy import

// ============================================
// PRIMARY DATA HOOKS (Offline-First) - USE THESE
// ============================================
// These hooks provide offline-first data management with IndexedDB caching
// and sync queue for mutations when offline.

export * from './useOfflineTopics';
export * from './useOfflineReports';
export * from './useOfflineEvents';
export * from './useOfflinePhones';
export * from './useOfflineTourism';

// ============================================
// STATIC DATA HOOKS
// ============================================
export * from './queries/useBairros';

// ============================================
// UI / UTILITY HOOKS
// ============================================
export * from './use-mobile';
export * from './use-toast';
export * from './useNetworkStatus';
export * from './useHaptics';
export * from './useInstallPrompt';
export * from './useOnlineSync';

// ============================================
// TENANT / MULTI-CITY HOOKS
// ============================================
export * from './useCityRoute';
export * from './useTenantNavigate';


// ============================================
// LEGACY QUERIES - DEPRECATED
// ============================================
// These hooks do NOT support offline. Use the offline-first versions above.
// TODO: Remove after migration to offline-first hooks is complete.

/** @deprecated Use useOfflineTopics instead */
export { useTopics, useTopic } from './queries/useTopics';

/** @deprecated Use useOfflineReports instead */
export { useReports, useReport, useMyReports, useCreateReport } from './queries/useReports';

/** @deprecated Will be replaced by offline-first version */
export { useEvents, useEvent, useUpcomingEvents, useEventsByDate } from './queries/useEvents';
