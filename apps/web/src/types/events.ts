// ======================================================
// Event Types - Unified types for API and UI
// Updated to match real API structure
// ======================================================

// ======================================================
// Category - Now object from API
// ======================================================

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  color?: string | null;
}

// Legacy string category type for backwards compatibility
export type EventCategorySlug =
  | 'show'
  | 'festa'
  | 'cultura'
  | 'infantil'
  | 'gastronomico'
  | 'esportes';

// ======================================================
// Ticket - lowercase types from API
// ======================================================

export type TicketType = 'free' | 'paid' | 'donation';

export interface TicketLot {
  id: string;
  name: string;
  price: number;
  available?: number | null;
  isActive: boolean;
}

export interface EventTicket {
  type: TicketType;
  minPrice: number;
  maxPrice?: number | null;
  currency?: string;
  purchaseUrl?: string | null;
  purchaseInfo?: string | null;
  lots?: TicketLot[];
}

// ======================================================
// Venue - with bairro object
// ======================================================

export interface EventVenue {
  id: string;
  name: string;
  slug?: string;
  address?: string | null;
  bairro?: {
    id: string;
    nome: string;
  } | null;
  coordinates?: {
    latitude: number;
    longitude: number;
  } | null;
  capacity?: number | null;
  phone?: string | null;
}

// ======================================================
// Media
// ======================================================

export interface EventMedia {
  coverImage?: string | null;
  bannerImage?: string | null;
  bannerImageMobile?: string | null;
  gallery?: { id: string; url: string; caption?: string }[];
}

// ======================================================
// Schedule
// ======================================================

export interface EventScheduleItem {
  id?: string;
  time: string;
  endTime?: string;
  title: string;
  description?: string | null;
  stage?: string | null;
  performer?: string | null;
}

export interface EventDaySchedule {
  dayNumber: number;
  date: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string | null;
  coverImage?: string | null;
  items: EventScheduleItem[];
}

export interface EventSchedule {
  hasMultipleDays: boolean;
  totalDays: number;
  days?: EventDaySchedule[];
  items?: EventScheduleItem[];
}

// ======================================================
// Flags
// ======================================================

export interface EventFlags {
  ageRating: string;
  ageRatingLabel?: string;
  outdoor: boolean;
  accessibility: boolean;
  parking: boolean;
}

// ======================================================
// Organizer
// ======================================================

export interface EventOrganizer {
  id: string;
  name: string;
  slug?: string;
  avatarUrl?: string | null;
}

// ======================================================
// Links
// ======================================================

export interface EventLinks {
  instagram?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  facebook?: string | null;
  youtube?: string | null;
  other?: { type: string; url: string; label?: string }[];
}

// ======================================================
// RSVP
// ======================================================

export interface RsvpSummary {
  count: number;
  goingCount: number;
  maybeCount: number;
  attendees?: { id: string; nome: string; avatarUrl?: string }[];
}

// ======================================================
// Tag
// ======================================================

export interface EventTag {
  id: string;
  name: string;
  slug: string;
}

// ======================================================
// Event Item - Main event structure
// ======================================================

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  // Category is now an object
  category: EventCategory;
  tags: (string | EventTag)[];
  descriptionShort: string;
  descriptionFull?: string | null;
  startDateTime: string;
  endDateTime: string;
  // In list: coverImage is at root. In details: inside media
  coverImage?: string | null;
  venue?: EventVenue | null;
  ticket?: EventTicket | null;
  links?: EventLinks | null;
  media?: EventMedia | null;
  schedule?: EventSchedule | EventScheduleItem[] | null;
  flags: EventFlags;
  organizer?: EventOrganizer | null;
  rsvp?: RsvpSummary | null;
  popularityScore: number;
  isFeatured?: boolean;
  // V2 fields
  eventType?: 'single' | 'multi_day' | 'recurring';
  totalDays?: number;
  edition?: string | null;
  expectedAudience?: number | null;
  confirmedAttendance?: number;
  // User-specific (when authenticated)
  isFavorited?: boolean | null;
  userRsvpStatus?: 'going' | 'maybe' | 'not_going' | null;
}

// ======================================================
// Meta - API pagination
// ======================================================

export interface EventMeta {
  current_page: number;
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}

export interface EventData {
  data: EventItem[];
  meta: EventMeta;
}

// ======================================================
// Filters State - UI state for filters
// ======================================================

export interface EventFiltersState {
  search: string;
  datePreset: 'all' | 'today' | 'tomorrow' | 'weekend' | 'this_week' | 'this_month' | 'range';
  dateRange: {
    start: string | null;
    end: string | null;
  };
  categories: string[]; // category slugs
  neighborhoods: string[]; // bairro IDs
  venues: string[]; // venue IDs
  price: 'all' | 'free' | 'paid';
  priceRange: [number, number];
  timeOfDay: Array<'morning' | 'afternoon' | 'night'>;
  accessibility: boolean;
  parking: boolean;
  kids: boolean;
  outdoor: boolean;
  sortBy: 'upcoming' | 'popular';
}

// ======================================================
// Event with parsed dates - Used in UI
// ======================================================

export interface EventWithDates extends EventItem {
  start: Date;
  end: Date;
}
