/**
 * useMyReports - Fetch current user's reports with filters
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService, type MyReportsFilters, type PublicReportsFilters } from '@/services/report.service';
import { useAuthStore } from '@/store/useAuthStore';
import type { CitizenReport, ReportStatus, CreateReportPayload } from '@/types/report';
import { useTenantStore } from '@/store/useTenantStore';

export function useMyReports(filters?: MyReportsFilters) {
    const { isAuthenticated } = useAuthStore();
    const tenantCacheScope = useTenantStore((state) => state.tenantKey ?? state.city?.slug ?? 'global');
    const reportsTenantKey = ['reports', tenantCacheScope] as const;

    const query = useQuery({
        queryKey: [...reportsTenantKey, 'mine', filters],
        queryFn: () => reportService.getMyReports(filters),
        staleTime: 30 * 1000, // 30 seconds - more dynamic
        gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache for offline
        refetchOnWindowFocus: true, // Refetch when user comes back
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
    const tenantCacheScope = useTenantStore((state) => state.tenantKey ?? state.city?.slug ?? 'global');

    const query = useQuery({
        queryKey: ['reports', tenantCacheScope, 'detail', id ?? ''],
        queryFn: () => reportService.getReportById(id!),
        enabled: !!id,
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: true,
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
    const tenantCacheScope = useTenantStore((state) => state.tenantKey ?? state.city?.slug ?? 'global');
    const reportsTenantKey = ['reports', tenantCacheScope] as const;

    const mutation = useMutation({
        mutationFn: ({ payload, idempotencyKey }: { payload: CreateReportPayload; idempotencyKey: string }) =>
            reportService.createReport(payload, idempotencyKey),
        onSuccess: () => {
            // Invalidate report caches only for current tenant scope.
            queryClient.invalidateQueries({ queryKey: reportsTenantKey });
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
    const tenantCacheScope = useTenantStore((state) => state.tenantKey ?? state.city?.slug ?? 'global');
    const reportsTenantKey = ['reports', tenantCacheScope] as const;

    const mutation = useMutation({
        mutationFn: ({ reportId, images }: { reportId: string; images: File[] }) =>
            reportService.addReportMedia(reportId, images),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [...reportsTenantKey, 'detail', variables.reportId] });
            queryClient.invalidateQueries({ queryKey: reportsTenantKey });
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
    const tenantCacheScope = useTenantStore((state) => state.tenantKey ?? state.city?.slug ?? 'global');
    const reportsTenantKey = ['reports', tenantCacheScope] as const;

    const mutation = useMutation({
        mutationFn: ({ reportId, mediaId }: { reportId: string; mediaId: string }) =>
            reportService.removeReportMedia(reportId, mediaId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [...reportsTenantKey, 'detail', variables.reportId] });
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
    const tenantCacheScope = useTenantStore((state) => state.tenantKey ?? state.city?.slug ?? 'global');

    const query = useQuery({
        queryKey: ['reports', tenantCacheScope, 'public', filters],
        queryFn: () => reportService.getPublicReports(filters),
        staleTime: 30 * 1000, // 30 seconds - more dynamic
        gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache for offline
        refetchOnWindowFocus: true, // Refetch when user comes back
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
    const tenantCacheScope = useTenantStore((state) => state.tenantKey ?? state.city?.slug ?? 'global');

    const query = useQuery({
        queryKey: ['reports', tenantCacheScope, 'stats'],
        queryFn: () => reportService.getReportsStats(),
        staleTime: 60 * 1000, // 1 minute - more dynamic
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: true,
    });

    return {
        stats: query.data ?? {
            total: 0,
            byStatus: { recebido: 0, em_analise: 0, resolvido: 0, rejeitado: 0 },
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
