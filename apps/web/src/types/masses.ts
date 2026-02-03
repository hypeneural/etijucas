export type LocationType = 'MATRIZ' | 'COMUNIDADE' | 'CAPELA';

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  neighborhood: string | null;
  address: string | null;
  geo: { lat: number; lng: number } | null;
  tags: string[];
}

export interface Mass {
  id: string;
  weekday: number; // 0=Sunday, 1=Monday...
  time: string; // "HH:MM"
  locationId: string;
  note: string | null;
  location?: Location; // Hydrated
}

export interface MassData {
  meta: {
    parishName: string;
    city: string;
    timezone: string;
    lastUpdated: string;
    sourceNote: string;
  };
  locations: Location[];
  masses: Mass[];
}
