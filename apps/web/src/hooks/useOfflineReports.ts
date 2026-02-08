/**
 * useOfflineReports - Offline-first hook for citizen reports.
 *
 * Strategy:
 * 1. Read from IndexedDB first for instant UX.
 * 2. Revalidate from API when online.
 * 3. Persist fresh data back to IndexedDB.
 */

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportsDB } from '@/lib/localDatabase';
import { reportService } from '@/services';
import type { CitizenReport, ReportStatus, CreateReportPayload } from '@/types/report';
import { generateIdempotencyKey } from '@/types/report';
import { useNetworkStatus } from './useNetworkStatus';
import { toast } from 'sonner';

const REPORTS_KEY = ['offline', 'reports'] as const;
const MY_REPORTS_KEY = ['offline', 'reports', 'mine'] as const;
const REPORT_KEY = (id: string) => ['offline', 'reports', id] as const;

interface UseOfflineReportsOptions {
    categoryId?: string;
    status?: ReportStatus | 'all';
    onlyMine?: boolean;
}

export function useOfflineReports(options?: UseOfflineReportsOptions) {
    const { isOnline } = useNetworkStatus();
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: options?.onlyMine ? MY_REPORTS_KEY : [...REPORTS_KEY, options],
        queryFn: async (): Promise<CitizenReport[]> => {
            let reports = await reportsDB.getAll();

            if (isOnline) {
                try {
                    const response = options?.onlyMine
                        ? await reportService.getMyReports()
                        : await reportService.getPublicReports({
                            categoryId: options?.categoryId,
                            status: options?.status && options.status !== 'all'
                                ? options.status
                                : undefined,
                        });

                    const freshReports = response.data;
                    if (freshReports.length > 0) {
                        await reportsDB.saveMany(freshReports);
                        reports = freshReports;
                    }
                } catch (error) {
                    console.warn('[useOfflineReports] API failed, using cache:', error);
                }
            }

            if (options?.categoryId) {
                reports = reports.filter((report) => report.categoryId === options.categoryId);
            }

            if (options?.status && options.status !== 'all') {
                reports = reports.filter((report) => report.status === options.status);
            }

            return reports.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        },
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 60 * 24,
    });

    useEffect(() => {
        if (isOnline) {
            queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
        }
    }, [isOnline, queryClient]);

    return query;
}

export function useMyOfflineReports() {
    return useOfflineReports({ onlyMine: true });
}

export function useOfflineReport(id: string) {
    const { isOnline } = useNetworkStatus();

    return useQuery({
        queryKey: REPORT_KEY(id),
        queryFn: async (): Promise<CitizenReport | undefined> => {
            let report = await reportsDB.getById(id);

            if (isOnline) {
                try {
                    const fresh = await reportService.getReportById(id);
                    if (fresh) {
                        await reportsDB.save(fresh);
                        report = fresh;
                    }
                } catch (error) {
                    console.warn('[useOfflineReport] API failed, using cache:', error);
                }
            }

            return report;
        },
        enabled: !!id,
    });
}

/**
 * @deprecated Prefer wizard + outbox flow (`useReportDraft` + `reportOutbox.service`).
 */
export function useCreateOfflineReport() {
    const queryClient = useQueryClient();
    const { isOnline } = useNetworkStatus();

    return useMutation({
        mutationFn: async (data: { payload: CreateReportPayload; idempotencyKey?: string }) => {
            if (!isOnline) {
                const message = 'Fluxo legado de criação offline desativado. Use o wizard de denúncias.';
                toast.info(message);
                throw new Error(message);
            }

            const idempotencyKey = data.idempotencyKey ?? generateIdempotencyKey();
            const created = await reportService.createReport(data.payload, idempotencyKey);
            await reportsDB.save(created);
            toast.success('Denúncia enviada com sucesso!');
            return created;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
            queryClient.invalidateQueries({ queryKey: MY_REPORTS_KEY });
        },
    });
}

/**
 * @deprecated Reports API does not expose delete endpoint for citizens.
 */
export function useDeleteOfflineReport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await reportsDB.delete(id);
            toast.info('Registro removido apenas do cache local.');
            return { id, deleted: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
            queryClient.invalidateQueries({ queryKey: MY_REPORTS_KEY });
        },
    });
}

export default {
    useOfflineReports,
    useMyOfflineReports,
    useOfflineReport,
    useCreateOfflineReport,
    useDeleteOfflineReport,
};
