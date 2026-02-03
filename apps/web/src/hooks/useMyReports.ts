/**
 * useMyReports - Fetch current user's reports with filters
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService, type MyReportsFilters, type PublicReportsFilters, type ReportsStats } from '@/services/report.service';
import { useAuthStore } from '@/store/useAuthStore';
import type { CitizenReport, ReportStatus, CreateReportPayload } from '@/types/report';

const QUERY_KEYS = {
    myReports: ['reports', 'mine'] as const,
    publicReports: ['reports', 'public'] as const,
    reportsStats: ['reports', 'stats'] as const,
    reportDetail: (id: string) => ['reports', 'detail', id] as const,
};

export function useMyReports(filters?: MyReportsFilters) {
    const { isAuthenticated } = useAuthStore();

    const query = useQuery({
        queryKey: [...QUERY_KEYS.myReports, filters],
        queryFn: () => reportService.getMyReports(filters),
        staleTime: 2 * 60 * 1000, // 2 minutes
        enabled: isAuthenticated, // Only fetch when authenticated
    });

    return {
        reports: query.data?.data ?? [],
        meta: query.data?.meta,
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

export function useReportDetail(id: string | undefined) {
    const query = useQuery({
        queryKey: QUERY_KEYS.reportDetail(id ?? ''),
        queryFn: () => reportService.getReportById(id!),
        enabled: !!id,
        staleTime: 1 * 60 * 1000, // 1 minute
    });

    return {
        report: query.data,
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

export function useCreateReport() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: ({ payload, idempotencyKey }: { payload: CreateReportPayload; idempotencyKey: string }) =>
            reportService.createReport(payload, idempotencyKey),
        onSuccess: () => {
            // Invalidate my reports cache
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myReports });
        },
    });

    return {
        createReport: mutation.mutateAsync,
        isCreating: mutation.isPending,
        error: mutation.error,
        reset: mutation.reset,
    };
}

export function useAddReportMedia() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: ({ reportId, images }: { reportId: string; images: File[] }) =>
            reportService.addReportMedia(reportId, images),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reportDetail(variables.reportId) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myReports });
        },
    });

    return {
        addMedia: mutation.mutateAsync,
        isAdding: mutation.isPending,
        error: mutation.error,
    };
}

export function useRemoveReportMedia() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: ({ reportId, mediaId }: { reportId: string; mediaId: string }) =>
            reportService.removeReportMedia(reportId, mediaId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reportDetail(variables.reportId) });
        },
    });

    return {
        removeMedia: mutation.mutateAsync,
        isRemoving: mutation.isPending,
        error: mutation.error,
    };
}

// ======================================================
// Public Reports (visible to all users)
// ======================================================

export function usePublicReports(filters?: PublicReportsFilters) {
    const query = useQuery({
        queryKey: [...QUERY_KEYS.publicReports, filters],
        queryFn: () => reportService.getPublicReports(filters),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    return {
        reports: query.data?.data ?? [],
        meta: query.data?.meta,
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

// ======================================================
// Reports Stats (KPIs)
// ======================================================

export function useReportsStats() {
    const query = useQuery({
        queryKey: QUERY_KEYS.reportsStats,
        queryFn: () => reportService.getReportsStats(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        stats: query.data ?? {
            total: 0,
            byStatus: { recebido: 0, em_analise: 0, em_andamento: 0, resolvido: 0, nao_procede: 0 },
            thisMonth: 0,
            resolvedThisMonth: 0,
        },
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

// Filter helper
export function filterReportsByStatus(
    reports: CitizenReport[],
    status: ReportStatus | 'all'
): CitizenReport[] {
    if (status === 'all') return reports;
    return reports.filter((r) => r.status === status);
}

export default useMyReports;
