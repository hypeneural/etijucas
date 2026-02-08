/**
 * Report Service - Citizen Reports (Denúncias Cidadãs)
 * Uses multipart/form-data for image uploads
 */

import { ApiError, apiClient } from '@/api/client';
import { ENDPOINTS } from '@/api/config';
import { compressForReportUpload } from '@/lib/imageCompression';
import { reportsDB } from '@/lib/localDatabase';
import type {
    CitizenReport,
    ReportCategory,
    CreateReportPayload,
    GeocodeSuggestion,
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

const MAX_BACKEND_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB guardrail aligned with API

async function compressImagesForUpload(images: File[]): Promise<File[]> {
    const optimized: File[] = [];

    for (const image of images) {
        try {
            const compressed = await compressForReportUpload(image);
            optimized.push(compressed);
        } catch (error) {
            console.warn(
                `[ReportService] Failed to compress image "${image.name}", using original file`,
                error
            );
            optimized.push(image);
        }
    }

    return optimized;
}

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

    // Images (multipart) with upload-time compression safeguard.
    if (payload.images && payload.images.length > 0) {
        const optimizedImages = await compressImagesForUpload(payload.images);

        optimizedImages.forEach((file) => {
            if (file.size > MAX_BACKEND_IMAGE_SIZE_BYTES) {
                throw new Error(
                    `Imagem "${file.name}" excede o limite de 8MB mesmo apos a otimizacao.`
                );
            }
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

        // Cache to IndexedDB (non-blocking)
        if (response.data) {
            try {
                await reportsDB.save(response.data as unknown as import('@/types').Report);
            } catch (cacheErr) {
                console.warn('[ReportService] Failed to cache report to IndexedDB:', cacheErr);
            }
        }

        return response.data;
    } catch (error) {
        console.error('[ReportService] Failed to create report:', error);
        throw error;
    }
}

// ======================================================
// Reports Map (viewport query)
// ======================================================

export interface ReportsMapFilters {
    bbox?: string;
    zoom?: number;
    limit?: number;
    status?: string[];
    category?: string[];
}

export interface ReportMapCategory {
    slug: string;
    name: string;
    icon: string;
    color: string;
}

export interface ReportMapImage {
    url: string;
    thumb: string;
}

export interface ReportMapItem {
    id: string;
    lat: number;
    lon: number;
    category: ReportMapCategory | null;
    status: string;
    title: string;
    description: string | null;
    protocol: string | null;
    address: string | null;
    addressShort: string;
    images: ReportMapImage[];
    thumbUrl: string | null;
    createdAt: string;
}

export interface ReportsMapResponse {
    bbox?: string | null;
    zoom?: number | null;
    reports: ReportMapItem[];
    total: number;
}

export async function getReportsMap(
    filters: ReportsMapFilters = {}
): Promise<ReportsMapResponse> {
    const params: Record<string, string | number | boolean | undefined> = {
        bbox: filters.bbox,
        zoom: filters.zoom,
        limit: filters.limit ?? 300,
        status: filters.status?.length ? filters.status.join(',') : undefined,
        category: filters.category?.length ? filters.category.join(',') : undefined,
    };

    try {
        return await apiClient.get<ReportsMapResponse>(ENDPOINTS.reports.map, params);
    } catch (error) {
        console.error('[ReportService] Failed to fetch reports map:', error);
        throw error;
    }
}

/**
 * Detects network/offline errors that should be routed to the reports outbox.
 */
export function isOfflineLikeReportError(error: unknown): boolean {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return true;
    }

    if (error instanceof ApiError) {
        return error.code === 'OFFLINE' || error.status === 0 || error.status === 408;
    }

    if (error instanceof TypeError) {
        return true;
    }

    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return message.includes('failed to fetch') || message.includes('network');
    }

    return false;
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

        // Cache to IndexedDB (non-blocking)
        if (response.data.length > 0) {
            try {
                await reportsDB.saveMany(
                    response.data as unknown as import('@/types').Report[]
                );
            } catch (cacheErr) {
                console.warn('[ReportService] Failed to cache reports to IndexedDB:', cacheErr);
            }
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

        // Cache to IndexedDB (non-blocking)
        try {
            await reportsDB.save(response.data as unknown as import('@/types').Report);
        } catch (cacheErr) {
            console.warn('[ReportService] Failed to cache report to IndexedDB:', cacheErr);
        }

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
    getReportsMap,
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
