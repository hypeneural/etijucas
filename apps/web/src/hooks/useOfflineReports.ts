/**
 * useOfflineReports - Hybrid Offline-First Hook for Citizen Reports
 * 
 * Strategy:
 * 1. Read from IndexedDB first (instant, cached)
 * 2. Fetch from API in background (when online)
 * 3. Update IndexedDB with fresh data
 * 4. Mutations go to sync queue when offline
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { reportsDB, syncQueueDB } from '@/lib/localDatabase';
import { reportService } from '@/services';
import { Report, ReportCategory } from '@/types';
import { useNetworkStatus } from './useNetworkStatus';
import { toast } from 'sonner';

// Report status type (matches what's in types/index.ts)
type ReportStatus = 'recebido' | 'em_analise' | 'resolvido';

// Query keys
const REPORTS_KEY = ['offline', 'reports'] as const;
const MY_REPORTS_KEY = ['offline', 'reports', 'mine'] as const;
const REPORT_KEY = (id: string) => ['offline', 'reports', id] as const;

interface UseOfflineReportsOptions {
    categoria?: ReportCategory | 'all';
    status?: ReportStatus | 'all';
    onlyMine?: boolean;
}

/**
 * Get all reports with offline-first strategy
 */
export function useOfflineReports(options?: UseOfflineReportsOptions) {
    const { isOnline } = useNetworkStatus();
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: options?.onlyMine ? MY_REPORTS_KEY : [...REPORTS_KEY, options],
        queryFn: async () => {
            // 1. Always start with IndexedDB cache (instant)
            let reports = await reportsDB.getAll();

            // 2. If online, try to fetch fresh data
            if (isOnline) {
                try {
                    const response = options?.onlyMine
                        ? await reportService.getMyReports()
                        : await reportService.getAll({
                            categoria: options?.categoria !== 'all' ? options?.categoria : undefined,
                            status: options?.status !== 'all' ? options?.status : undefined,
                        });

                    // Update IndexedDB with fresh data
                    const freshReports = Array.isArray(response) ? response : response.data;
                    if (freshReports && freshReports.length > 0) {
                        await reportsDB.saveMany(freshReports);
                        reports = freshReports;
                    }
                } catch (error) {
                    console.warn('[useOfflineReports] API failed, using cache:', error);
                }
            }

            // 3. Apply local filters
            if (options?.categoria && options.categoria !== 'all') {
                reports = reports.filter(r => r.categoria === options.categoria);
            }

            if (options?.status && options.status !== 'all') {
                reports = reports.filter(r => r.status === options.status);
            }

            // 4. Sort by date (newest first)
            return reports.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });

    // Refetch when coming back online
    useEffect(() => {
        if (isOnline) {
            queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
        }
    }, [isOnline, queryClient]);

    return query;
}

/**
 * Get user's own reports with offline support
 */
export function useMyOfflineReports() {
    return useOfflineReports({ onlyMine: true });
}

/**
 * Get single report by ID with offline support
 */
export function useOfflineReport(id: string) {
    const { isOnline } = useNetworkStatus();

    return useQuery({
        queryKey: REPORT_KEY(id),
        queryFn: async () => {
            // Try IndexedDB first
            let report = await reportsDB.getById(id);

            // If online, try API
            if (isOnline) {
                try {
                    const fresh = await reportService.getById(id);
                    if (fresh) {
                        await reportsDB.save(fresh);
                        report = fresh;
                    }
                } catch (error) {
                    console.warn('[useOfflineReport] API failed, using cache');
                }
            }

            return report;
        },
        enabled: !!id,
    });
}

/**
 * Create a new report with offline support
 */
export function useCreateOfflineReport() {
    const queryClient = useQueryClient();
    const { isOnline } = useNetworkStatus();

    return useMutation({
        mutationFn: async (data: {
            categoria: ReportCategory;
            texto: string;
            bairroId: string;
            local?: string;
            fotoUrl?: string;
        }) => {
            // Generate protocol number
            const protocolo = `ETJ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

            // Generate optimistic report
            const optimisticReport: Report = {
                id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                protocolo,
                categoria: data.categoria,
                texto: data.texto,
                status: 'recebido',
                bairroId: data.bairroId,
                fotos: data.fotoUrl ? [data.fotoUrl] : [],
                fotoUrl: data.fotoUrl,
                likes: 0,
                createdAt: new Date(),
            };

            // Save to IndexedDB immediately
            await reportsDB.save(optimisticReport);

            // If offline, add to sync queue
            if (!isOnline) {
                await syncQueueDB.add({
                    type: 'report',
                    data: data,
                    idempotencyKey: `report-${optimisticReport.id}`,
                });
                toast.info('Denúncia salva offline. Será enviada quando voltar online.');
            } else {
                // Try to sync immediately
                try {
                    const created = await reportService.create(data);
                    // Replace temp report with real one
                    await reportsDB.delete(optimisticReport.id);
                    await reportsDB.save(created);
                    toast.success('Denúncia enviada com sucesso!');
                    return created;
                } catch (error) {
                    // Failed, add to queue
                    await syncQueueDB.add({
                        type: 'report',
                        data: data,
                        idempotencyKey: `report-${optimisticReport.id}`,
                    });
                    toast.warning('Falha ao enviar. Tentaremos novamente.');
                }
            }

            return optimisticReport;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
            queryClient.invalidateQueries({ queryKey: MY_REPORTS_KEY });
        },
    });
}

/**
 * Delete a report with offline support
 */
export function useDeleteOfflineReport() {
    const queryClient = useQueryClient();
    const { isOnline } = useNetworkStatus();

    return useMutation({
        mutationFn: async (id: string) => {
            // Optimistic delete from IndexedDB
            await reportsDB.delete(id);

            // If temp ID, just remove locally (never synced)
            if (id.startsWith('temp-')) {
                return { id, deleted: true };
            }

            // Try API if online
            if (isOnline) {
                try {
                    await reportService.delete(id);
                } catch (error) {
                    console.warn('[useDeleteOfflineReport] API failed');
                }
            }

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
