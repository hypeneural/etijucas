// Trash Collection Types
// Types for the trash/garbage collection schedule

export type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
export type ServiceType = 'COMMON' | 'SELECTIVE';
export type Cadence = 'WEEKLY' | 'BIWEEKLY';

export interface CollectionSchedule {
    serviceType: ServiceType;
    cadence: Cadence;
    weekdays: Weekday[];
    rrule: string;
    human: string;
}

export interface TrashNeighborhood {
    id: string;
    name: string;
    aliases: string[];
    collections: {
        common: CollectionSchedule;
        selective: CollectionSchedule;
    };
}

export interface TrashScheduleData {
    schemaVersion: string;
    jurisdiction: {
        country: string;
        state: string;
        city: string;
    };
    weekdaysEnum: Weekday[];
    serviceTypesEnum: ServiceType[];
    cadenceEnum: Cadence[];
    neighborhoods: TrashNeighborhood[];
}

// UI State types
export type ServiceTypeFilter = 'COMMON' | 'SELECTIVE' | 'BOTH';
export type DayFilter = 'TODAY' | Weekday;
export type SortOption = 'NEXT' | 'AZ';

export interface TrashFilters {
    serviceType: ServiceTypeFilter;
    selectedDay: DayFilter;
    query: string;
    onlyFavorites: boolean;
    cadenceFilter: 'ALL' | 'WEEKLY' | 'BIWEEKLY';
    sort: SortOption;
}

// Helper constants
export const WEEKDAY_LABELS: Record<Weekday, string> = {
    MON: 'Seg',
    TUE: 'Ter',
    WED: 'Qua',
    THU: 'Qui',
    FRI: 'Sex',
    SAT: 'Sáb',
    SUN: 'Dom',
};

export const WEEKDAY_FULL_LABELS: Record<Weekday, string> = {
    MON: 'Segunda',
    TUE: 'Terça',
    WED: 'Quarta',
    THU: 'Quinta',
    FRI: 'Sexta',
    SAT: 'Sábado',
    SUN: 'Domingo',
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
    COMMON: 'Comum',
    SELECTIVE: 'Seletiva',
};

export const CADENCE_LABELS: Record<Cadence, string> = {
    WEEKLY: 'Semanal',
    BIWEEKLY: 'Quinzenal',
};

// Day of week mapping (JS Date.getDay() returns 0-6, Sunday=0)
export const JS_DAY_TO_WEEKDAY: Record<number, Weekday> = {
    0: 'SUN',
    1: 'MON',
    2: 'TUE',
    3: 'WED',
    4: 'THU',
    5: 'FRI',
    6: 'SAT',
};

export const WEEKDAY_TO_JS_DAY: Record<Weekday, number> = {
    SUN: 0,
    MON: 1,
    TUE: 2,
    WED: 3,
    THU: 4,
    FRI: 5,
    SAT: 6,
};
