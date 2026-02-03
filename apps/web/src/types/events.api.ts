// ======================================================
// Events API Types - Real API Integration V2
// Matches the backend API exactly
// ======================================================

// ======================================================
// Base Types
// ======================================================

export type EventTicketType = 'free' | 'paid';

export type RsvpStatus = 'going' | 'maybe' | 'not_going';

export type AgeRating = 'livre' | '10' | '12' | '14' | '16' | '18';

export type DatePreset = 'today' | 'tomorrow' | 'weekend' | 'this_week' | 'this_month';

export type TimeOfDay = 'morning' | 'afternoon' | 'night';

export type EventOrderBy = 'startDateTime' | 'popularityScore' | 'createdAt';

// V2: Event types
export type EventType = 'single' | 'multi_day' | 'recurring';

// ======================================================
// Category
// ======================================================

export interface EventCategory {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    eventsCount?: number;
}

// ======================================================
// Tag
// ======================================================

export interface EventTag {
    id: string;
    name: string;
    slug: string;
    color?: string | null;
    isFeatured?: boolean;
    usageCount?: number;
}

// ======================================================
// Venue
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
    geo?: {
        lat: number;
        lng: number;
    } | null;
    capacity?: number | null;
    phone?: string | null;
    website?: string | null;
}

// ======================================================
// Ticket & Lots
// ======================================================

export interface TicketLot {
    id: string;
    name: string;
    price: number;
    available?: number | null;
    isActive: boolean;
}

export interface EventTicket {
    type: EventTicketType;
    minPrice: number;
    maxPrice?: number | null;
    currency?: string;
    purchaseUrl?: string | null;
    purchaseInfo?: string | null;
    lots?: TicketLot[];
}

// ======================================================
// Links
// ======================================================

export interface EventLink {
    type: string;
    url: string;
    label?: string;
}

export interface EventLinks {
    instagram?: string | null;
    whatsapp?: string | null;
    website?: string | null;
    facebook?: string | null;
    youtube?: string | null;
    tiktok?: string | null;
    other?: EventLink[];
}

// ======================================================
// Media (V2 with banners)
// ======================================================

export interface EventMediaItem {
    id: string;
    type: 'image' | 'video';
    url: string;
    thumbnail?: string | null;
    caption?: string | null;
}

export interface EventMedia {
    coverImage?: string | null;
    // V2: Banner images for hero sections
    bannerImage?: string | null;        // Wide image (16:9 or 21:9)
    bannerImageMobile?: string | null;  // Mobile banner (3:2)
    gallery?: EventMediaItem[];
}

// ======================================================
// Schedule (V2 with multi-day support)
// ======================================================

export interface EventScheduleItem {
    id: string;
    time: string;
    endTime?: string;
    date?: string | null;
    title: string;
    description?: string | null;
    stage?: string | null;
    performer?: string | null;
    type?: 'info' | 'show' | 'workshop' | 'food' | 'break' | 'ceremony' | 'kids';
    icon?: string | null;
}

// V2: Day schedule for multi-day events
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

// V2: Schedule wrapper supporting both single and multi-day
export interface EventScheduleV2 {
    hasMultipleDays: boolean;
    totalDays: number;
    // For multi-day events
    days?: EventDaySchedule[];
    // For single-day events (backward compatible)
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
    avatar?: string | null;
    instagram?: string | null;
    whatsapp?: string | null;
    website?: string | null;
    isVerified?: boolean;
}

// ======================================================
// RSVP
// ======================================================

export interface EventAttendee {
    id: string;
    nome: string;
    avatarUrl?: string | null;
    guestsCount?: number;
}

export interface EventRsvpSummary {
    count: number;
    goingCount: number;
    maybeCount: number;
    attendees?: EventAttendee[];
    userStatus?: RsvpStatus | null;
}

export interface UserRsvp {
    id: string;
    eventId: string;
    status: RsvpStatus;
    statusLabel?: string;
    guestsCount: number;
    notes?: string | null;
    createdAt: string;
    updatedAt?: string;
}

// ======================================================
// Event List Item (for listings) - V2
// ======================================================

export interface EventListItem {
    id: string;
    title: string;
    slug: string;
    category?: EventCategory | null;
    tags: string[];
    descriptionShort: string;
    startDateTime: string;
    endDateTime: string;
    venue?: {
        id: string;
        name: string;
        bairro?: { id: string; nome: string } | null;
    } | null;
    ticket?: {
        type: EventTicketType;
        minPrice: number;
        maxPrice?: number | null;
    } | null;
    coverImage?: string | null;
    flags: EventFlags;
    rsvpCount: number;
    popularityScore: number;
    isFeatured: boolean;
    isFavorited?: boolean | null;
    userRsvpStatus?: RsvpStatus | null;
    // V2 fields
    eventType?: EventType;
    totalDays?: number;
    edition?: string | null;
}

// ======================================================
// Event Detail (full event) - V2
// ======================================================

export interface EventDetail extends EventListItem {
    descriptionFull?: string | null;
    venue: EventVenue | null;
    ticket: EventTicket | null;
    links: EventLinks;
    media: EventMedia;
    // V2: Support both old schedule array and new V2 schedule object
    schedule: EventScheduleItem[] | EventScheduleV2;
    organizer?: EventOrganizer | null;
    rsvp: EventRsvpSummary;
    status: 'draft' | 'published' | 'cancelled' | 'finished';
    createdAt: string;
    updatedAt?: string | null;
    // V2 fields
    expectedAudience?: number | null;
    confirmedAttendance?: number;
}

// ======================================================
// API Request/Response Types
// ======================================================

export interface EventFiltersParams {
    // Pagination
    page?: number;
    perPage?: number;

    // Search
    search?: string;

    // Filters
    categoryId?: string;
    category?: string;
    bairroId?: string;
    venueId?: string;
    organizerId?: string;
    tags?: string;

    // Date filters
    fromDate?: string;
    toDate?: string;
    datePreset?: DatePreset;

    // Price filters
    price?: 'free' | 'paid';
    priceMin?: number;
    priceMax?: number;

    // Other filters
    timeOfDay?: TimeOfDay;
    ageRating?: string;
    accessibility?: boolean;
    parking?: boolean;
    outdoor?: boolean;
    kids?: boolean;
    featured?: boolean;

    // V2 filters
    hasSchedule?: boolean;
    hasTickets?: boolean;
    multiDay?: boolean;
    minCapacity?: number;
    withRsvp?: boolean;

    // Sorting
    orderBy?: EventOrderBy;
    order?: 'asc' | 'desc';
}

export interface EventsListResponse {
    data: EventListItem[];
    success: boolean;
    meta: {
        total: number;
        page: number;
        perPage: number;
        lastPage: number;
    };
}

export interface EventDetailResponse {
    data: EventDetail;
    success: boolean;
}

export interface CategoriesResponse {
    data: EventCategory[];
    success: boolean;
}

export interface TagsResponse {
    data: EventTag[];
    success: boolean;
}

export interface CreateRsvpRequest {
    status: RsvpStatus;
    guestsCount?: number;
    notes?: string;
}

export interface RsvpResponse {
    data: UserRsvp;
    success: boolean;
    message?: string;
}

export interface AttendeesResponse {
    data: {
        total: number;
        goingCount: number;
        maybeCount: number;
        attendees: EventAttendee[];
    };
    meta: {
        page: number;
        perPage: number;
        lastPage: number;
    };
    success: boolean;
}

export interface FavoriteResponse {
    data: {
        isFavorited: boolean;
    };
    success: boolean;
    message?: string;
}

// ======================================================
// Filter State (for frontend)
// ======================================================

export interface EventFiltersState {
    search: string;
    datePreset: 'all' | DatePreset | 'range';
    dateRange: {
        start: string | null;
        end: string | null;
    };
    categories: string[];
    neighborhoods: string[];
    venues: string[];
    price: 'all' | 'free' | 'paid';
    priceRange: [number, number];
    timeOfDay: TimeOfDay[];
    accessibility: boolean;
    parking: boolean;
    kids: boolean;
    outdoor: boolean;
    sortBy: 'upcoming' | 'popular';
}

// ======================================================
// V2: Home Featured Endpoint Response
// ======================================================

export interface HomeFeaturedEvent {
    id: string;
    title: string;
    slug: string;
    coverImage?: string | null;
    startDateTime: string;
    venue?: {
        name: string;
        bairro?: string;
    } | null;
    ticket?: {
        type: EventTicketType;
        minPrice: number;
    } | null;
    category?: {
        name: string;
        color?: string;
    } | null;
}

export interface HomeFeaturedHighlight extends HomeFeaturedEvent {
    bannerImage?: string | null;
    badge?: {
        text: string;
        color: string;
    } | null;
}

export interface HomeFeaturedResponse {
    data: {
        highlight: HomeFeaturedHighlight | null;
        today: HomeFeaturedEvent[];
        weekend: HomeFeaturedEvent[];
        upcoming: HomeFeaturedEvent[];
    };
    success: boolean;
}

// ======================================================
// V2: Calendar Summary Endpoint Response
// ======================================================

export interface CalendarSummaryDay {
    count: number;
    hasHighlight: boolean;
}

export interface CalendarSummaryResponse {
    data: Record<string, CalendarSummaryDay>;
    meta: {
        year: number;
        month: number;
        totalEvents: number;
    };
    success: boolean;
}
