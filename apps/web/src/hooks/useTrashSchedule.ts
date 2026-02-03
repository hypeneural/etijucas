// useTrashSchedule Hook
// React hook for trash collection schedule with filtering

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
    trashService,
    filterNeighborhoods,
    getTodayWeekday,
    getDayLabel
} from '@/services/trash.service';
import {
    TrashNeighborhood,
    TrashFilters,
    ServiceTypeFilter,
    DayFilter,
    Weekday,
} from '@/types/trash.types';

const DEFAULT_FILTERS: TrashFilters = {
    serviceType: 'BOTH',
    selectedDay: 'TODAY',
    query: '',
    onlyFavorites: false,
    cadenceFilter: 'ALL',
    sort: 'NEXT',
};

export function useTrashSchedule() {
    // Filters state
    const [filters, setFilters] = useState<TrashFilters>(DEFAULT_FILTERS);

    // Favorites state
    const [favorites, setFavorites] = useState<string[]>([]);

    // Selected neighborhood for detail sheet
    const [selectedNeighborhood, setSelectedNeighborhood] = useState<TrashNeighborhood | null>(null);

    // Load favorites on mount
    useEffect(() => {
        setFavorites(trashService.getFavorites());
    }, []);

    // All neighborhoods
    const allNeighborhoods = useMemo(() => trashService.getAll(), []);

    // Filtered neighborhoods
    const filteredNeighborhoods = useMemo(() =>
        filterNeighborhoods(allNeighborhoods, filters, favorites),
        [allNeighborhoods, filters, favorites]
    );

    // Today's weekday
    const todayWeekday = useMemo(() => getTodayWeekday(), []);

    // Dynamic subtitle
    const dynamicSubtitle = useMemo(() => {
        const dayLabel = getDayLabel();
        const typeLabel = filters.serviceType === 'COMMON'
            ? 'Coleta Comum'
            : filters.serviceType === 'SELECTIVE'
                ? 'Coleta Seletiva'
                : 'Todas as Coletas';

        if (filters.selectedDay === 'TODAY') {
            return `Hoje é ${dayLabel} • mostrando ${typeLabel}`;
        }

        const dayNames: Record<Weekday, string> = {
            MON: 'segunda',
            TUE: 'terça',
            WED: 'quarta',
            THU: 'quinta',
            FRI: 'sexta',
            SAT: 'sábado',
            SUN: 'domingo',
        };

        return `Mostrando ${dayNames[filters.selectedDay as Weekday]} • ${typeLabel}`;
    }, [filters.serviceType, filters.selectedDay]);

    // Filter setters
    const setServiceType = useCallback((type: ServiceTypeFilter) => {
        setFilters(f => ({ ...f, serviceType: type }));
    }, []);

    const setSelectedDay = useCallback((day: DayFilter) => {
        setFilters(f => ({ ...f, selectedDay: day }));
    }, []);

    const setQuery = useCallback((query: string) => {
        setFilters(f => ({ ...f, query }));
    }, []);

    const toggleOnlyFavorites = useCallback(() => {
        setFilters(f => ({ ...f, onlyFavorites: !f.onlyFavorites }));
    }, []);

    const setCadenceFilter = useCallback((cadence: 'ALL' | 'WEEKLY' | 'BIWEEKLY') => {
        setFilters(f => ({ ...f, cadenceFilter: cadence }));
    }, []);

    const setSort = useCallback((sort: 'NEXT' | 'AZ') => {
        setFilters(f => ({ ...f, sort }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters(DEFAULT_FILTERS);
    }, []);

    // Toggle favorite
    const toggleFavorite = useCallback((id: string) => {
        const newFavorites = trashService.toggleFavorite(id);
        setFavorites(newFavorites);
    }, []);

    // Check if is favorite
    const isFavorite = useCallback((id: string) => {
        return favorites.includes(id);
    }, [favorites]);

    // Stats
    const stats = useMemo(() => ({
        total: allNeighborhoods.length,
        filtered: filteredNeighborhoods.length,
        collectingToday: trashService.getCollectingToday(filters.serviceType).length,
        favoritesCount: favorites.length,
    }), [allNeighborhoods, filteredNeighborhoods, favorites, filters.serviceType]);

    return {
        // Data
        neighborhoods: filteredNeighborhoods,
        allNeighborhoods,
        favorites,
        stats,
        todayWeekday,
        dynamicSubtitle,

        // Current filters
        filters,

        // Selected for detail
        selectedNeighborhood,
        setSelectedNeighborhood,

        // Filter setters
        setServiceType,
        setSelectedDay,
        setQuery,
        toggleOnlyFavorites,
        setCadenceFilter,
        setSort,
        resetFilters,

        // Favorites
        toggleFavorite,
        isFavorite,
    };
}

export default useTrashSchedule;
