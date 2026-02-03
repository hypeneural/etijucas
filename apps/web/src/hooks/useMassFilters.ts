import { useState, useMemo } from 'react';
import rawData from '@/data/masses.mock.json';
import { Mass, LocationType, MassData } from '@/types/masses';
import { getDay, getHours, getMinutes } from 'date-fns';

// Cast the raw json to our type
const data = rawData as unknown as MassData;

// Hydrate masses with location data for easier filtering
const allMasses: Mass[] = data.masses.map(m => ({
    ...m,
    location: data.locations.find(l => l.id === m.locationId)
}));

export interface Filters {
    search: string;
    suburbs: string[];
    weekdays: number[];
    types: LocationType[];
    showFavoritesOnly: boolean;
}

export const getFilteredMasses = (masses: Mass[], filters: Filters, favorites: string[]) => {
    return masses.filter(mass => {
        const loc = mass.location!;

        // Favorites check
        if (filters.showFavoritesOnly && !favorites.includes(loc.id)) return false;

        // Search (Name, Neighborhood, Tags)
        if (filters.search) {
            const q = filters.search.toLowerCase();
            const matchName = loc.name.toLowerCase().includes(q);
            const matchSuburb = loc.neighborhood?.toLowerCase().includes(q);
            const matchTags = loc.tags.some(t => t.toLowerCase().includes(q));
            if (!matchName && !matchSuburb && !matchTags) return false;
        }

        // Suburbs
        if (filters.suburbs.length > 0) {
            if (!loc.neighborhood || !filters.suburbs.includes(loc.neighborhood)) return false;
        }

        // Weekdays
        if (filters.weekdays.length > 0) {
            if (!filters.weekdays.includes(mass.weekday)) return false;
        }

        // Types
        if (filters.types.length > 0) {
            if (!filters.types.includes(loc.type)) return false;
        }

        return true;
    });
};

export const useMassFilters = () => {
    const [filters, setFilters] = useState<Filters>({
        search: '',
        suburbs: [],
        weekdays: [],
        types: [],
        showFavoritesOnly: false,
    });

    const [favorites, setFavorites] = useState<string[]>(() => {
        try {
            const stored = localStorage.getItem('etijucas_mass_favorites');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const toggleFavorite = (locationId: string) => {
        setFavorites(prev => {
            const next = prev.includes(locationId)
                ? prev.filter(id => id !== locationId)
                : [...prev, locationId];
            localStorage.setItem('etijucas_mass_favorites', JSON.stringify(next));
            return next;
        });
    };

    const filteredMasses = useMemo(() => {
        return getFilteredMasses(allMasses, filters, favorites);
    }, [filters, favorites]);

    // Group by day for weekday list
    const groupedMasses = useMemo(() => {
        const groups: Record<number, Mass[]> = {};
        filteredMasses.forEach(m => {
            if (!groups[m.weekday]) groups[m.weekday] = [];
            groups[m.weekday].push(m);
        });
        // Sort times within groups
        Object.keys(groups).forEach(key => {
            const k = Number(key);
            groups[k].sort((a, b) => a.time.localeCompare(b.time));
        });
        return groups;
    }, [filteredMasses]);

    // Next Mass Logic
    const nextMass = useMemo(() => {
        const now = new Date();
        const currentDay = getDay(now);
        const currentTimeVal = getHours(now) * 60 + getMinutes(now);

        // 1. Try to find one today after current time
        let todayMasses = allMasses.filter(m => m.weekday === currentDay);
        todayMasses.sort((a, b) => a.time.localeCompare(b.time));

        for (const m of todayMasses) {
            const [h, min] = m.time.split(':').map(Number);
            if (h * 60 + min > currentTimeVal) return m;
        }

        // 2. Look for upcoming days
        // Map masses to "days from now"
        // We want the smallest (daysFromNow, time) tuple
        let candidate: Mass | null = null;
        let minDiffDays = 8; // max difference is 7 days roughly

        // Check all masses to see which one is next
        for (const m of allMasses) {
            let diff = (m.weekday - currentDay + 7) % 7;
            if (diff === 0) diff = 7; // It's next week's same day if time passed

            if (diff < minDiffDays) {
                minDiffDays = diff;
                candidate = m;
            } else if (diff === minDiffDays) {
                // Compare time
                if (candidate && m.time < candidate.time) {
                    candidate = m;
                }
            }
        }

        return candidate;
    }, []);

    const availableSuburbs = useMemo(() => {
        const s = new Set<string>();
        data.locations.forEach(l => {
            if (l.neighborhood) s.add(l.neighborhood);
        });
        return Array.from(s).sort();
    }, []);

    return {
        filters,
        setFilters,
        filteredMasses,
        groupedMasses,
        nextMass,
        favorites,
        toggleFavorite,
        availableSuburbs,
        locations: data.locations,
        meta: data.meta,
        allMasses // Exported for preview calc
    };
};
