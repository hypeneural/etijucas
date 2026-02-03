// Report Service - Offline-First
// User reports to the city with IndexedDB persistence

import { apiClient } from '@/api/client';
import { ENDPOINTS } from '@/api/config';
import { Report } from '@/types';
import { ReportFilters, PaginatedResponse, CreateReportDTO } from '@/types/api.types';
import { reportsDB, syncQueueDB } from '@/lib/localDatabase';

// Seed data for first load (dev only)
import { myReports as seedReports } from '@/data/mockData';

// Initialize on first import
let initialized = false;
async function ensureInitialized() {
    if (!initialized) {
        initialized = true;
        const cached = await reportsDB.getAll();
        if (cached.length === 0 && import.meta.env.DEV) {
            await reportsDB.saveMany(seedReports);
            console.log('[ReportService] Initialized with seed data');
        }
    }
}

export const reportService = {
    /**
     * Get all reports with optional filters
     */
    async getAll(filters?: ReportFilters): Promise<PaginatedResponse<Report>> {
        await ensureInitialized();

        try {
            const response = await apiClient.get<PaginatedResponse<Report>>(
                ENDPOINTS.reports.list,
                filters as Record<string, string | number | boolean | undefined>
            );

            // Cache response data to IndexedDB
            if (response.data.length > 0) {
                await reportsDB.saveMany(response.data);
            }

            return response;
        } catch {
            // Fallback to IndexedDB
            let reports = await reportsDB.getAll();

            if (filters?.bairroId) {
                reports = reports.filter(r => r.bairroId === filters.bairroId);
            }
            if (filters?.categoria) {
                reports = reports.filter(r => r.categoria === filters.categoria);
            }
            if (filters?.status) {
                reports = reports.filter(r => r.status === filters.status);
            }

            // Paginate
            const page = filters?.page || 1;
            const perPage = filters?.perPage || 10;
            const start = (page - 1) * perPage;
            const end = start + perPage;

            return {
                data: reports.slice(start, end),
                meta: {
                    total: reports.length,
                    page,
                    perPage,
                    lastPage: Math.ceil(reports.length / perPage),
                    from: start + 1,
                    to: Math.min(end, reports.length),
                },
            };
        }
    },

    /**
     * Get current user's reports
     */
    async getMyReports(): Promise<Report[]> {
        await ensureInitialized();

        try {
            const response = await apiClient.get<{ data: Report[] }>(ENDPOINTS.reports.myReports);
            // Cache to IndexedDB
            if (response.data.length > 0) {
                await reportsDB.saveMany(response.data);
            }
            return response.data;
        } catch {
            return reportsDB.getAll();
        }
    },

    /**
     * Get a single report by ID
     */
    async getById(id: string): Promise<Report | undefined> {
        await ensureInitialized();

        try {
            const response = await apiClient.get<{ data: Report }>(ENDPOINTS.reports.get(id));
            // Cache to IndexedDB
            await reportsDB.save(response.data);
            return response.data;
        } catch {
            return reportsDB.getById(id);
        }
    },

    /**
     * Create a new report
     */
    async create(data: CreateReportDTO): Promise<Report> {
        await ensureInitialized();

        const idempotencyKey = `report-${JSON.stringify(data)}-${Date.now()}`;

        try {
            const response = await apiClient.post<{ data: Report }>(ENDPOINTS.reports.create, data);
            // Save to IndexedDB
            await reportsDB.save(response.data);
            return response.data;
        } catch {
            // Create locally and queue for sync
            const newReport: Report = {
                texto: data.texto,
                categoria: data.categoria,
                bairroId: data.bairroId,
                fotos: data.fotos || [],
                id: `report-local-${Date.now()}`,
                createdAt: new Date(),
                likes: 0,
                protocolo: `ETJ-${String(Date.now()).slice(-6)}`,
                status: 'recebido',
            };

            // Save to IndexedDB
            await reportsDB.save(newReport);

            // Add to sync queue (with deduplication check)
            const exists = await syncQueueDB.exists(idempotencyKey);
            if (!exists) {
                await syncQueueDB.add({
                    type: 'report',
                    data: { ...data, localId: newReport.id },
                    idempotencyKey,
                });
            }

            return newReport;
        }
    },

    /**
     * Delete a report
     */
    async delete(id: string): Promise<void> {
        await reportsDB.delete(id);
    },
};

export default reportService;
