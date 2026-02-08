/**
 * Legacy reports hooks bridge.
 *
 * @deprecated Prefer hooks from `@/hooks/useMyReports`.
 */

import { usePublicReports, useMyReports, useReportDetail, useCreateReport } from '@/hooks/useMyReports';
import type { PublicReportsFilters } from '@/services/report.service';

export type ReportFilters = PublicReportsFilters;

/**
 * @deprecated Use `usePublicReports` from `@/hooks/useMyReports`.
 */
export function useReports(filters?: ReportFilters) {
    return usePublicReports(filters);
}

/**
 * @deprecated Use `useReportDetail` from `@/hooks/useMyReports`.
 */
export function useReport(id: string) {
    return useReportDetail(id);
}

/**
 * @deprecated Use `useMyReports` from `@/hooks/useMyReports`.
 */
export { useMyReports };

/**
 * @deprecated Use `useCreateReport` from `@/hooks/useMyReports`.
 */
export { useCreateReport };
