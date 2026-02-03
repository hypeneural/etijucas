// Tourism Service - Offline-First
// Tourist spots and attractions with IndexedDB caching

import { apiClient } from '@/api/client';
import { ENDPOINTS } from '@/api/config';
import { TourismSpot } from '@/types';
import { tourismDB } from '@/lib/localDatabase';
import type { TourismReview } from '@/types/tourism.types';

export interface CreateReviewData {
    rating: number;
    titulo?: string;
    texto: string;
    fotos?: string[];
    visitDate?: string;
}

export const tourismService = {
    /**
     * Get all tourism spots
     * Strategy: API first → IndexedDB fallback
     */
    async getAll(): Promise<TourismSpot[]> {
        try {
            console.log('[TourismService] Fetching from API...');
            const response = await apiClient.get<{ data: TourismSpot[] }>(ENDPOINTS.tourism.spots);

            // Cache to IndexedDB
            if (response.data && response.data.length > 0) {
                await tourismDB.clear();
                await tourismDB.saveMany(response.data);
                console.log('[TourismService] Cached', response.data.length, 'spots to IndexedDB');
            }

            return response.data || [];
        } catch (error) {
            console.warn('[TourismService] API failed, using cache:', error);
            const cached = await tourismDB.getAll();
            return cached || [];
        }
    },

    /**
     * Get a single spot by ID
     */
    async getById(id: string): Promise<TourismSpot | undefined> {
        try {
            const response = await apiClient.get<{ data: TourismSpot }>(ENDPOINTS.tourism.get(id));
            return response.data;
        } catch (error) {
            console.warn('[TourismService] API failed for getById, using cache');
            const spots = await tourismDB.getAll();
            return spots.find(s => s.id === id);
        }
    },

    /**
     * Get reviews for a spot
     */
    async getReviews(spotId: string): Promise<TourismReview[]> {
        try {
            const response = await apiClient.get<{ data: TourismReview[] }>(
                ENDPOINTS.tourism.reviews(spotId)
            );
            return response.data || [];
        } catch (error) {
            console.warn('[TourismService] Failed to fetch reviews:', error);
            return [];
        }
    },

    /**
     * Toggle like on a spot (auth required)
     */
    async toggleLike(spotId: string): Promise<{ liked: boolean; likesCount: number }> {
        const response = await apiClient.post<{ liked: boolean; likesCount: number }>(
            ENDPOINTS.tourism.like(spotId)
        );
        return response;
    },

    /**
     * Toggle save/favorite on a spot (auth required)
     */
    async toggleSave(spotId: string): Promise<{ isSaved: boolean }> {
        const response = await apiClient.post<{ isSaved: boolean }>(
            ENDPOINTS.tourism.save(spotId)
        );
        return response;
    },

    /**
     * Create a review (auth required)
     */
    async createReview(spotId: string, data: CreateReviewData): Promise<TourismReview> {
        const response = await apiClient.post<{ data: TourismReview; success: boolean; message: string }>(
            ENDPOINTS.tourism.createReview(spotId),
            data
        );
        return response.data;
    },

    /**
     * Delete own review (auth required)
     */
    async deleteReview(reviewId: string): Promise<void> {
        await apiClient.delete(ENDPOINTS.tourism.deleteReview(reviewId));
    },

    /**
     * Clear local cache and refetch from API
     */
    async refresh(): Promise<void> {
        await tourismDB.clear();
        await this.getAll();
    },
};

export default tourismService;

