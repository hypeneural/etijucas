// Trash Schedule Service
// Business logic for trash collection schedule

import { trashScheduleData } from '@/data/trashScheduleData';
import {
    TrashNeighborhood,
    TrashFilters,
    Weekday,
    ServiceType,
    JS_DAY_TO_WEEKDAY,
    WEEKDAY_TO_JS_DAY,
    WEEKDAY_FULL_LABELS,
} from '@/types/trash.types';

// Storage key for favorites
const FAVORITES_KEY = 'etijucas-trash-favorites';

/**
 * Get today's weekday
 */
export function getTodayWeekday(): Weekday {
    const today = new Date();
    return JS_DAY_TO_WEEKDAY[today.getDay()];
}

/**
 * Get day label in Portuguese
 */
export function getDayLabel(): string {
    const days = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    return days[new Date().getDay()];
}

/**
 * Calculate next collection date for a neighborhood
 */
export function getNextCollection(
    neighborhood: TrashNeighborhood,
    serviceType?: 'COMMON' | 'SELECTIVE' | 'BOTH'
): { date: Date; type: ServiceType; dayLabel: string } | null {
    const today = new Date();
    const todayDay = today.getDay();

    const candidates: { date: Date; type: ServiceType }[] = [];

    const checkCollection = (type: ServiceType) => {
        const collection = type === 'COMMON' ? neighborhood.collections.common : neighborhood.collections.selective;

        for (const weekday of collection.weekdays) {
            const targetDay = WEEKDAY_TO_JS_DAY[weekday];
            let daysUntil = targetDay - todayDay;
            if (daysUntil < 0) daysUntil += 7;
            if (daysUntil === 0) daysUntil = 0; // Today is valid

            const date = new Date(today);
            date.setDate(today.getDate() + daysUntil);
            candidates.push({ date, type });
        }
    };

    if (serviceType === 'COMMON' || serviceType === 'BOTH' || !serviceType) {
        checkCollection('COMMON');
    }
    if (serviceType === 'SELECTIVE' || serviceType === 'BOTH' || !serviceType) {
        checkCollection('SELECTIVE');
    }

    if (candidates.length === 0) return null;

    // Sort by date and get the nearest
    candidates.sort((a, b) => a.date.getTime() - b.date.getTime());
    const next = candidates[0];

    const dayLabel = WEEKDAY_FULL_LABELS[JS_DAY_TO_WEEKDAY[next.date.getDay()]];

    return { ...next, dayLabel };
}

/**
 * Check if neighborhood has collection on a specific day
 */
export function hasCollectionOnDay(
    neighborhood: TrashNeighborhood,
    weekday: Weekday,
    serviceType: 'COMMON' | 'SELECTIVE' | 'BOTH'
): boolean {
    if (serviceType === 'COMMON') {
        return neighborhood.collections.common.weekdays.includes(weekday);
    }
    if (serviceType === 'SELECTIVE') {
        return neighborhood.collections.selective.weekdays.includes(weekday);
    }
    // BOTH
    return (
        neighborhood.collections.common.weekdays.includes(weekday) ||
        neighborhood.collections.selective.weekdays.includes(weekday)
    );
}

/**
 * Filter neighborhoods based on filters
 */
export function filterNeighborhoods(
    neighborhoods: TrashNeighborhood[],
    filters: TrashFilters,
    favorites: string[]
): TrashNeighborhood[] {
    let result = [...neighborhoods];

    // Filter by day
    if (filters.selectedDay !== 'TODAY') {
        result = result.filter(n =>
            hasCollectionOnDay(n, filters.selectedDay as Weekday, filters.serviceType)
        );
    } else {
        const today = getTodayWeekday();
        result = result.filter(n =>
            hasCollectionOnDay(n, today, filters.serviceType)
        );
    }

    // Filter by cadence
    if (filters.cadenceFilter !== 'ALL') {
        result = result.filter(n => {
            if (filters.serviceType === 'COMMON') {
                return n.collections.common.cadence === filters.cadenceFilter;
            }
            if (filters.serviceType === 'SELECTIVE') {
                return n.collections.selective.cadence === filters.cadenceFilter;
            }
            // BOTH - match either
            return (
                n.collections.common.cadence === filters.cadenceFilter ||
                n.collections.selective.cadence === filters.cadenceFilter
            );
        });
    }

    // Filter by search query
    if (filters.query.trim()) {
        const q = filters.query.toLowerCase().trim();
        result = result.filter(n =>
            n.name.toLowerCase().includes(q) ||
            n.aliases.some(a => a.toLowerCase().includes(q))
        );
    }

    // Filter by favorites only
    if (filters.onlyFavorites) {
        result = result.filter(n => favorites.includes(n.id));
    }

    // Sort
    if (filters.sort === 'AZ') {
        result.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    } else {
        // Sort by next collection
        result.sort((a, b) => {
            const nextA = getNextCollection(a, filters.serviceType);
            const nextB = getNextCollection(b, filters.serviceType);
            if (!nextA && !nextB) return 0;
            if (!nextA) return 1;
            if (!nextB) return -1;
            return nextA.date.getTime() - nextB.date.getTime();
        });
    }

    // Move favorites to top
    const favSet = new Set(favorites);
    result.sort((a, b) => {
        const aFav = favSet.has(a.id);
        const bFav = favSet.has(b.id);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return 0;
    });

    return result;
}

/**
 * Trash Schedule Service
 */
export const trashService = {
    /**
     * Get all neighborhoods
     */
    getAll(): TrashNeighborhood[] {
        return trashScheduleData.neighborhoods;
    },

    /**
     * Get a neighborhood by ID
     */
    getById(id: string): TrashNeighborhood | undefined {
        return trashScheduleData.neighborhoods.find(n => n.id === id);
    },

    /**
     * Search neighborhoods
     */
    search(query: string): TrashNeighborhood[] {
        const q = query.toLowerCase();
        return trashScheduleData.neighborhoods.filter(n =>
            n.name.toLowerCase().includes(q) ||
            n.aliases.some(a => a.toLowerCase().includes(q))
        );
    },

    /**
     * Get neighborhoods with collection today
     */
    getCollectingToday(serviceType?: 'COMMON' | 'SELECTIVE' | 'BOTH'): TrashNeighborhood[] {
        const today = getTodayWeekday();
        return trashScheduleData.neighborhoods.filter(n =>
            hasCollectionOnDay(n, today, serviceType || 'BOTH')
        );
    },

    /**
     * Get favorites from localStorage
     */
    getFavorites(): string[] {
        try {
            const stored = localStorage.getItem(FAVORITES_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    },

    /**
     * Toggle favorite
     */
    toggleFavorite(id: string): string[] {
        const favorites = this.getFavorites();
        const index = favorites.indexOf(id);

        if (index >= 0) {
            favorites.splice(index, 1);
        } else {
            favorites.push(id);
        }

        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        return favorites;
    },

    /**
     * Check if a neighborhood is favorited
     */
    isFavorite(id: string): boolean {
        return this.getFavorites().includes(id);
    },
};

export default trashService;
