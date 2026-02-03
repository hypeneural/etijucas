// useOfflineTourism - Offline-first hook for tourism spots
// Uses IndexedDB for caching with API-first strategy

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tourismDB, syncQueueDB } from '@/lib/localDatabase';
import { tourismService } from '@/services/tourism.service';
import type { TourismSpotEnhanced, TourismFilters, TourismCategory } from '@/types/tourism.types';
import { tourismSpotsMock, tourismReviewsMock } from '@/data/tourism.mock';
import { useNetworkStatus } from './useNetworkStatus';
import { QUERY_KEYS, CACHE_TIMES } from '@/api/config';

// Initialize with mock data in dev
async function initializeTourismDB() {
  const spots = await tourismDB.getAll();
  if (spots.length === 0) {
    // Cast mock data to work with existing DB
    await tourismDB.saveMany(tourismSpotsMock as unknown as import('@/types').TourismSpot[]);
    console.log('[Tourism] Initialized IndexedDB with mock data');
  }
}

/**
 * Offline-first hook for tourism spots
 * Features:
 * - IndexedDB caching
 * - API-first with fallback
 * - Client-side filtering & search
 * - Optimistic updates for likes/saves
 */
export function useOfflineTourism(filters?: TourismFilters) {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize DB on mount
  useEffect(() => {
    initializeTourismDB().then(() => setIsInitialized(true));
  }, []);

  // Main query - fetch all spots
  const { data: rawSpots = [], isLoading, error, refetch } = useQuery({
    queryKey: [...QUERY_KEYS.tourism.spots, 'enhanced'],
    queryFn: async () => {
      // In production, try API first
      if (import.meta.env.PROD && isOnline) {
        try {
          const apiSpots = await tourismService.getAll();
          return apiSpots as unknown as TourismSpotEnhanced[];
        } catch (err) {
          console.warn('[Tourism] API failed, using cache:', err);
        }
      }
      
      // Fallback to IndexedDB / mock data
      const cached = await tourismDB.getAll();
      if (cached.length > 0) {
        return cached as unknown as TourismSpotEnhanced[];
      }
      
      return tourismSpotsMock;
    },
    staleTime: CACHE_TIMES.events, // 1 hour
    enabled: isInitialized,
  });

  // Apply client-side filters
  const spots = useMemo(() => {
    if (!rawSpots.length) return [];
    
    let filtered = [...rawSpots];

    // Category filter
    if (filters?.categoria) {
      filtered = filtered.filter(s => s.categoria === filters.categoria);
    }

    // Tags filter
    if (filters?.tags?.length) {
      filtered = filtered.filter(s => 
        filters.tags!.some(tag => s.tags.includes(tag))
      );
    }

    // Bairro filter
    if (filters?.bairroId) {
      filtered = filtered.filter(s => s.bairroId === filters.bairroId);
    }

    // Price filter
    if (filters?.preco) {
      filtered = filtered.filter(s => s.preco === filters.preco);
    }

    // Minimum rating filter
    if (filters?.rating) {
      filtered = filtered.filter(s => s.rating >= filters.rating!);
    }

    // Search filter
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(s =>
        s.titulo.toLowerCase().includes(q) ||
        s.descCurta?.toLowerCase().includes(q) ||
        s.descLonga?.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q)) ||
        s.bairroNome?.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (filters?.sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        filtered.sort((a, b) => b.reviewsCount - a.reviewsCount);
        break;
      case 'popular':
        filtered.sort((a, b) => b.likesCount - a.likesCount);
        break;
      case 'recent':
        filtered.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      default:
        // Default: featured first, then by rating
        filtered.sort((a, b) => {
          if (a.isDestaque && !b.isDestaque) return -1;
          if (!a.isDestaque && b.isDestaque) return 1;
          return b.rating - a.rating;
        });
    }

    return filtered;
  }, [rawSpots, filters]);

  // Get single spot by ID
  const getSpotById = useCallback((id: string) => {
    return rawSpots.find(s => s.id === id);
  }, [rawSpots]);

  // Get reviews for a spot
  const getReviews = useCallback((spotId: string) => {
    return tourismReviewsMock.filter(r => r.spotId === spotId);
  }, []);

  // Featured spots
  const featuredSpots = useMemo(() => 
    rawSpots.filter(s => s.isDestaque).slice(0, 4),
    [rawSpots]
  );

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    rawSpots.forEach(s => s.tags.forEach(t => tagsSet.add(t)));
    return Array.from(tagsSet).sort();
  }, [rawSpots]);

  // Get all categories in use
  const usedCategories = useMemo(() => {
    const cats = new Set<TourismCategory>();
    rawSpots.forEach(s => {
      if (s.categoria) cats.add(s.categoria);
    });
    return Array.from(cats);
  }, [rawSpots]);

  // Like mutation (optimistic)
  const likeMutation = useMutation({
    mutationFn: async (spotId: string) => {
      // Queue for sync if offline
      if (!isOnline) {
        await syncQueueDB.add({
          type: 'like',
          data: { spotId, entityType: 'tourism' },
          idempotencyKey: `like-tourism-${spotId}-${Date.now()}`,
        });
      }
      return spotId;
    },
    onMutate: async (spotId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tourism.spots });
      
      // Snapshot previous value
      const previous = queryClient.getQueryData<TourismSpotEnhanced[]>(
        [...QUERY_KEYS.tourism.spots, 'enhanced']
      );

      // Optimistic update
      queryClient.setQueryData<TourismSpotEnhanced[]>(
        [...QUERY_KEYS.tourism.spots, 'enhanced'],
        (old) => old?.map(s => 
          s.id === spotId 
            ? { ...s, liked: !s.liked, likesCount: s.likesCount + (s.liked ? -1 : 1) }
            : s
        )
      );

      return { previous };
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(
          [...QUERY_KEYS.tourism.spots, 'enhanced'],
          context.previous
        );
      }
    },
  });

  // Save/bookmark mutation (optimistic)
  const saveMutation = useMutation({
    mutationFn: async (spotId: string) => {
      if (!isOnline) {
        await syncQueueDB.add({
          type: 'save',
          data: { spotId, entityType: 'tourism' },
          idempotencyKey: `save-tourism-${spotId}-${Date.now()}`,
        });
      }
      return spotId;
    },
    onMutate: async (spotId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tourism.spots });
      
      const previous = queryClient.getQueryData<TourismSpotEnhanced[]>(
        [...QUERY_KEYS.tourism.spots, 'enhanced']
      );

      queryClient.setQueryData<TourismSpotEnhanced[]>(
        [...QUERY_KEYS.tourism.spots, 'enhanced'],
        (old) => old?.map(s => 
          s.id === spotId ? { ...s, isSaved: !s.isSaved } : s
        )
      );

      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          [...QUERY_KEYS.tourism.spots, 'enhanced'],
          context.previous
        );
      }
    },
  });

  return {
    // Data
    spots,
    rawSpots,
    featuredSpots,
    allTags,
    usedCategories,
    
    // Getters
    getSpotById,
    getReviews,
    
    // State
    isLoading: isLoading || !isInitialized,
    error,
    isOnline,
    
    // Actions
    refetch,
    likeSpot: likeMutation.mutate,
    saveSpot: saveMutation.mutate,
    isLiking: likeMutation.isPending,
    isSaving: saveMutation.isPending,
  };
}

/**
 * Hook for single tourism spot detail
 */
export function useTourismSpot(id: string) {
  const { getSpotById, getReviews, likeSpot, saveSpot, isLoading: listLoading } = useOfflineTourism();
  
  const spot = useMemo(() => getSpotById(id), [getSpotById, id]);
  const reviews = useMemo(() => getReviews(id), [getReviews, id]);

  return {
    spot,
    reviews,
    isLoading: listLoading,
    likeSpot: () => likeSpot(id),
    saveSpot: () => saveSpot(id),
  };
}

export default useOfflineTourism;
