/**
 * useOfflinePhones - Hybrid Offline-First Hook for Useful Phones
 * 
 * Strategy:
 * 1. Read from IndexedDB first (instant, cached)
 * 2. Fetch from API in background (when online)
 * 3. Update IndexedDB with fresh data
 * 4. Long cache time since phone numbers rarely change
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { phonesDB } from '@/lib/localDatabase';
import { phoneService } from '@/services';
import { UsefulPhone, PhoneCategory } from '@/types';
import { useNetworkStatus } from './useNetworkStatus';

// Query keys
const PHONES_KEY = ['offline', 'phones'] as const;
const PHONES_BY_CATEGORY_KEY = (cat: PhoneCategory) => ['offline', 'phones', 'category', cat] as const;

/**
 * Get all phones with offline-first strategy
 */
export function useOfflinePhones() {
    const { isOnline } = useNetworkStatus();
    const queryClient = useQueryClient();

    const query = useQuery<UsefulPhone[]>({
        queryKey: PHONES_KEY,
        queryFn: async () => {
            // 1. Start with IndexedDB cache
            let phones = await phonesDB.getAll();

            // 2. If online, fetch fresh data
            if (isOnline) {
                try {
                    const freshPhones = await phoneService.getAll();

                    // Update IndexedDB
                    if (freshPhones.length > 0) {
                        await phonesDB.clear();
                        await phonesDB.saveMany(freshPhones);
                        phones = freshPhones;
                    }
                } catch (error) {
                    console.warn('[useOfflinePhones] API failed, using cache:', error);
                }
            }

            // Sort: emergencies first, then alphabetically
            return phones.sort((a, b) => {
                // Pinned items first
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;

                // Emergencies second
                if (a.categoria === 'emergencias' && b.categoria !== 'emergencias') return -1;
                if (a.categoria !== 'emergencias' && b.categoria === 'emergencias') return 1;

                // Then alphabetically
                return a.nome.localeCompare(b.nome, 'pt-BR');
            });
        },
        staleTime: 1000 * 60 * 60 * 24, // 24 hours - phones rarely change
        gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    // Refetch when coming back online
    useEffect(() => {
        if (isOnline) {
            queryClient.invalidateQueries({ queryKey: PHONES_KEY });
        }
    }, [isOnline, queryClient]);

    return query;
}

/**
 * Get phones by category with offline support
 */
export function usePhonesByCategory(categoria: PhoneCategory) {
    const { data: allPhones, ...rest } = useOfflinePhones();

    const filteredPhones = useMemo(() => {
        if (!allPhones) return [];
        return allPhones.filter(p => p.categoria === categoria);
    }, [allPhones, categoria]);

    return {
        ...rest,
        data: filteredPhones,
    };
}

/**
 * Search phones with offline support
 */
export function useSearchPhones(query: string) {
    const { data: allPhones, ...rest } = useOfflinePhones();

    const results = useMemo(() => {
        if (!allPhones || !query.trim()) return allPhones || [];

        const q = query.toLowerCase();
        return allPhones.filter(
            p => p.nome.toLowerCase().includes(q) ||
                p.descricao?.toLowerCase().includes(q) ||
                p.numero.includes(q)
        );
    }, [allPhones, query]);

    return {
        ...rest,
        data: results,
    };
}

/**
 * Get emergency phones only
 */
export function useEmergencyPhones() {
    const { data: allPhones, ...rest } = useOfflinePhones();

    const emergencyPhones = useMemo(() => {
        if (!allPhones) return [];
        return allPhones.filter(p => p.categoria === 'emergencias' || p.isPinned);
    }, [allPhones]);

    return {
        ...rest,
        data: emergencyPhones,
    };
}

/**
 * Get all unique phone categories from cached data
 */
export function usePhoneCategories() {
    const { data: allPhones } = useOfflinePhones();

    return useMemo(() => {
        if (!allPhones) return [];

        const categories = new Set(allPhones.map(p => p.categoria));
        return Array.from(categories).sort();
    }, [allPhones]);
}

/**
 * Group phones by category
 */
export function usePhonesByCategories() {
    const { data: allPhones, ...rest } = useOfflinePhones();

    const grouped = useMemo(() => {
        if (!allPhones) return {};

        return allPhones.reduce((acc, phone) => {
            const cat = phone.categoria;
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(phone);
            return acc;
        }, {} as Record<PhoneCategory, UsefulPhone[]>);
    }, [allPhones]);

    return {
        ...rest,
        data: grouped,
    };
}

export default {
    useOfflinePhones,
    usePhonesByCategory,
    useSearchPhones,
    useEmergencyPhones,
    usePhoneCategories,
    usePhonesByCategories,
};
