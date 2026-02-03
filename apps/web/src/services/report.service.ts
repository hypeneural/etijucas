/**
 * Report Service - Citizen Reports (Denúncias Cidadãs)
 * Uses multipart/form-data for image uploads
 */

import { apiClient } from '@/api/client';
import { ENDPOINTS } from '@/api/config';
import { reportsDB, syncQueueDB } from '@/lib/localDatabase';
import type {
    CitizenReport,
    ReportCategory,
    CreateReportPayload,
    GeocodeSuggestion,
    generateIdempotencyKey,
} from '@/types/report';

// ======================================================
// Categories
// ======================================================

export async function getCategories(): Promise<ReportCategory[]> {
    try {
        const response = await apiClient.get<{ data: ReportCategory[] }>(
            ENDPOINTS.reports.categories
        );
        return response.data;
    } catch (error) {
        console.error('[ReportService] Failed to fetch categories:', error);
        throw error;
    }
}

// ======================================================
// Create Report (Multipart)
// ======================================================

export async function createReport(
    payload: CreateReportPayload,
    idempotencyKey: string
): Promise<CitizenReport> {
    const formData = new FormData();

    // Required fields
    formData.append('categoryId', payload.categoryId);
    formData.append('title', payload.title);
    formData.append('description', payload.description);

    // Optional location fields
    if (payload.addressText) {
        formData.append('addressText', payload.addressText);
    }
    if (payload.addressSource) {
        formData.append('addressSource', payload.addressSource);
    }
    if (payload.locationQuality) {
        formData.append('locationQuality', payload.locationQuality);
    }
    if (payload.latitude !== undefined) {
        formData.append('latitude', String(payload.latitude));
    }
    if (payload.longitude !== undefined) {
        formData.append('longitude', String(payload.longitude));
    }
    if (payload.locationAccuracyM !== undefined) {
        formData.append('locationAccuracyM', String(payload.locationAccuracyM));
    }
    if (payload.bairroId) {
        formData.append('bairroId', payload.bairroId);
    }

    // Images (multipart)
    if (payload.images && payload.images.length > 0) {
        payload.images.forEach((file) => {
            formData.append('images[]', file);
        });
    }

    try {
        const response = await apiClient.postFormData<{
            success: boolean;
            message: string;
            data: CitizenReport;
        }>(ENDPOINTS.reports.create, formData, {
            headers: {
                'X-Idempotency-Key': idempotencyKey,
            },
        });

        // Cache to IndexedDB
        if (response.data) {
            await reportsDB.save(response.data as unknown as import('@/types').Report);
        }

        return response.data;
    } catch (error) {
        console.error('[ReportService] Failed to create report:', error);

        // Queue for offline sync
        const exists = await syncQueueDB.exists(idempotencyKey);
        if (!exists) {
            await syncQueueDB.add({
                type: 'report',
                data: {
                    ...payload,
                    // Store images as base64 for offline (temporary)
                    images: [], // Note: images can't be easily stored offline
                },
                idempotencyKey,
            });
        }

        throw error;
    }
}

// ======================================================
// My Reports
// ======================================================

export interface MyReportsFilters {
    status?: string;
    categoryId?: string;
    page?: number;
    perPage?: number;
}

export interface MyReportsResponse {
    data: CitizenReport[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export async function getMyReports(
    filters?: MyReportsFilters
): Promise<MyReportsResponse> {
    try {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.categoryId) params.append('categoryId', filters.categoryId);
        if (filters?.page) params.append('page', String(filters.page));
        if (filters?.perPage) params.append('perPage', String(filters.perPage));

        const queryString = params.toString();
        const url = queryString
            ? `${ENDPOINTS.reports.myReports}?${queryString}`
            : ENDPOINTS.reports.myReports;

        const response = await apiClient.get<MyReportsResponse>(url);

        // Cache to IndexedDB
        if (response.data.length > 0) {
            await reportsDB.saveMany(
                response.data as unknown as import('@/types').Report[]
            );
        }

        return response;
    } catch (error) {
        console.error('[ReportService] Failed to fetch my reports:', error);

        // Fallback to IndexedDB
        const cached = await reportsDB.getAll();
        return {
            data: cached as unknown as CitizenReport[],
            meta: {
                current_page: 1,
                last_page: 1,
                per_page: 10,
                total: cached.length,
            },
        };
    }
}

// ======================================================
// Public Reports (approved/visible to all)
// ======================================================

export interface PublicReportsFilters {
    status?: string;
    categoryId?: string;
    search?: string;
    page?: number;
    perPage?: number;
}

export async function getPublicReports(
    filters?: PublicReportsFilters
): Promise<MyReportsResponse> {
    try {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.categoryId) params.append('categoryId', filters.categoryId);
        if (filters?.search) params.append('search', filters.search);
        if (filters?.page) params.append('page', String(filters.page));
        if (filters?.perPage) params.append('perPage', String(filters.perPage));

        const queryString = params.toString();
        const url = queryString
            ? `${ENDPOINTS.reports.list}?${queryString}`
            : ENDPOINTS.reports.list;

        const response = await apiClient.get<MyReportsResponse>(url);
        return response;
    } catch (error) {
        console.error('[ReportService] Failed to fetch public reports:', error);
        throw error;
    }
}

// ======================================================
// Reports Stats (KPIs)
// ======================================================

export interface ReportsStats {
    total: number;
    byStatus: {
        recebido: number;
        em_analise: number;
        resolvido: number;
        rejeitado: number;
    };
    thisMonth: number;
    resolvedThisMonth: number;
}

export async function getReportsStats(): Promise<ReportsStats> {
    try {
        const response = await apiClient.get<{ data: ReportsStats }>(
            ENDPOINTS.reports.stats
        );
        return response.data;
    } catch (error) {
        console.error('[ReportService] Failed to fetch reports stats:', error);
        // Return mock stats on error
        return {
            total: 0,
            byStatus: { recebido: 0, em_analise: 0, resolvido: 0, rejeitado: 0 },
            thisMonth: 0,
            resolvedThisMonth: 0,
        };
    }
}

// ======================================================
// Get Report Detail
// ======================================================

export async function getReportById(id: string): Promise<CitizenReport | null> {
    try {
        const response = await apiClient.get<{
            success: boolean;
            data: CitizenReport;
        }>(ENDPOINTS.reports.get(id));

        // Cache to IndexedDB
        await reportsDB.save(response.data as unknown as import('@/types').Report);

        return response.data;
    } catch (error) {
        console.error('[ReportService] Failed to fetch report:', error);

        // Fallback to IndexedDB
        const cached = await reportsDB.getById(id);
        return cached as unknown as CitizenReport | null;
    }
}

// ======================================================
// Add Media to Report
// ======================================================

export async function addReportMedia(
    reportId: string,
    images: File[]
): Promise<CitizenReport> {
    const formData = new FormData();
    images.forEach((file) => {
        formData.append('images[]', file);
    });

    const response = await apiClient.postFormData<{
        success: boolean;
        message: string;
        data: CitizenReport;
    }>(ENDPOINTS.reports.addMedia(reportId), formData);

    return response.data;
}

// ======================================================
// Remove Media from Report
// ======================================================

export async function removeReportMedia(
    reportId: string,
    mediaId: string
): Promise<void> {
    await apiClient.delete(ENDPOINTS.reports.removeMedia(reportId, mediaId));
}

// ======================================================
// Geocoding
// ======================================================

export async function geocodeAutocomplete(
    query: string,
    lat?: number,
    lon?: number
): Promise<GeocodeSuggestion[]> {
    try {
        const params = new URLSearchParams({ q: query });
        if (lat !== undefined) params.append('lat', String(lat));
        if (lon !== undefined) params.append('lon', String(lon));

        const response = await apiClient.get<{
            success: boolean;
            data: GeocodeSuggestion[];
        }>(`${ENDPOINTS.geocode.autocomplete}?${params.toString()}`);

        return response.data;
    } catch (error) {
        console.error('[ReportService] Geocode autocomplete failed:', error);
        return [];
    }
}

export async function geocodeReverse(
    lat: number,
    lon: number
): Promise<GeocodeSuggestion | null> {
    try {
        const params = new URLSearchParams({
            lat: String(lat),
            lon: String(lon),
        });

        const response = await apiClient.get<{
            success: boolean;
            data: GeocodeSuggestion;
        }>(`${ENDPOINTS.geocode.reverse}?${params.toString()}`);

        return response.data;
    } catch (error) {
        console.error('[ReportService] Geocode reverse failed:', error);
        return null;
    }
}

// ======================================================
// Export service object
// ======================================================

export const reportService = {
    getCategories,
    createReport,
    getMyReports,
    getPublicReports,
    getReportsStats,
    getReportById,
    addReportMedia,
    removeReportMedia,
    geocodeAutocomplete,
    geocodeReverse,
};

export default reportService;
