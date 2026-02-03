// ======================================================
// Event Service - Real API Integration V2
// Offline-first with API sync
// ======================================================

import { apiClient } from '@/api/client';
import { ENDPOINTS } from '@/api/config';
import { eventsDB } from '@/lib/localDatabase';
import type {
    EventListItem,
    EventDetail,
    EventCategory,
    EventTag,
    EventFiltersParams,
    EventsListResponse,
    EventDetailResponse,
    CategoriesResponse,
    TagsResponse,
    CreateRsvpRequest,
    RsvpResponse,
    UserRsvp,
    AttendeesResponse,
    FavoriteResponse,
    // V2 types
    HomeFeaturedResponse,
    CalendarSummaryResponse,
} from '@/types/events.api';

// ======================================================
// Helper: Convert API params to query string
// ======================================================

function buildQueryString(params: EventFiltersParams): Record<string, string | number | boolean | undefined> {
    const query: Record<string, string | number | boolean | undefined> = {};

    if (params.page) query.page = params.page;
    if (params.perPage) query.perPage = params.perPage;
    if (params.search) query.search = params.search;
    if (params.categoryId) query.categoryId = params.categoryId;
    if (params.category) query.category = params.category;
    if (params.bairroId) query.bairroId = params.bairroId;
    if (params.venueId) query.venueId = params.venueId;
    if (params.organizerId) query.organizerId = params.organizerId;
    if (params.tags) query.tags = params.tags;
    if (params.fromDate) query.fromDate = params.fromDate;
    if (params.toDate) query.toDate = params.toDate;
    if (params.datePreset) query.datePreset = params.datePreset;
    if (params.price) query.price = params.price;
    if (params.priceMin !== undefined) query.priceMin = params.priceMin;
    if (params.priceMax !== undefined) query.priceMax = params.priceMax;
    if (params.timeOfDay) query.timeOfDay = params.timeOfDay;
    if (params.ageRating) query.ageRating = params.ageRating;
    if (params.accessibility) query.accessibility = params.accessibility;
    if (params.parking) query.parking = params.parking;
    if (params.outdoor) query.outdoor = params.outdoor;
    if (params.kids) query.kids = params.kids;
    if (params.featured) query.featured = params.featured;
    if (params.orderBy) query.orderBy = params.orderBy;
    if (params.order) query.order = params.order;

    return query;
}

// ======================================================
// Event Service
// ======================================================

export const eventApiService = {
    // ==================== LISTINGS ====================

    /**
     * Get all events with filters and pagination
     */
    async getAll(params: EventFiltersParams = {}): Promise<EventsListResponse> {
        try {
            const response = await apiClient.get<EventsListResponse>(
                ENDPOINTS.events.list,
                buildQueryString(params)
            );

            // Cache events for offline access
            if (response.data && response.data.length > 0) {
                await this.cacheEvents(response.data);
            }

            return response;
        } catch (error) {
            console.warn('[EventService] API failed, using cache:', error);
            return this.getFromCache(params);
        }
    },

    /**
     * Get upcoming events
     */
    async getUpcoming(limit = 10): Promise<EventsListResponse> {
        try {
            const response = await apiClient.get<EventsListResponse>(
                ENDPOINTS.events.upcoming,
                { perPage: limit }
            );

            if (response.data && response.data.length > 0) {
                await this.cacheEvents(response.data);
            }

            return response;
        } catch (error) {
            console.warn('[EventService] API failed for upcoming:', error);
            return this.getFromCache({ orderBy: 'startDateTime', order: 'asc' });
        }
    },

    /**
     * Get today's events
     */
    async getToday(): Promise<EventsListResponse> {
        try {
            const response = await apiClient.get<EventsListResponse>(ENDPOINTS.events.today);

            if (response.data && response.data.length > 0) {
                await this.cacheEvents(response.data);
            }

            return response;
        } catch (error) {
            console.warn('[EventService] API failed for today:', error);
            return this.getFromCache({ datePreset: 'today' });
        }
    },

    /**
     * Get weekend events
     */
    async getWeekend(): Promise<EventsListResponse> {
        try {
            const response = await apiClient.get<EventsListResponse>(ENDPOINTS.events.weekend);

            if (response.data && response.data.length > 0) {
                await this.cacheEvents(response.data);
            }

            return response;
        } catch (error) {
            console.warn('[EventService] API failed for weekend:', error);
            return this.getFromCache({ datePreset: 'weekend' });
        }
    },

    /**
     * Get featured events
     */
    async getFeatured(limit = 6): Promise<EventsListResponse> {
        try {
            const response = await apiClient.get<EventsListResponse>(
                ENDPOINTS.events.featured,
                { perPage: limit }
            );

            if (response.data && response.data.length > 0) {
                await this.cacheEvents(response.data);
            }

            return response;
        } catch (error) {
            console.warn('[EventService] API failed for featured:', error);
            return this.getFromCache({ featured: true });
        }
    },

    /**
     * Search events
     */
    async search(query: string, params: EventFiltersParams = {}): Promise<EventsListResponse> {
        try {
            const response = await apiClient.get<EventsListResponse>(
                ENDPOINTS.events.search,
                { q: query, ...buildQueryString(params) }
            );

            return response;
        } catch (error) {
            console.warn('[EventService] API failed for search:', error);
            return this.getFromCache({ search: query, ...params });
        }
    },

    // ==================== V2 OPTIMIZED ENDPOINTS ====================

    /**
     * V2: Get home featured data (optimized single request for home page)
     */
    async getHomeFeatured(): Promise<HomeFeaturedResponse> {
        try {
            const response = await apiClient.get<HomeFeaturedResponse>(
                ENDPOINTS.events.homeFeatured
            );

            // Cache all events from response for offline access
            if (response.data) {
                const allEvents = [
                    ...(response.data.highlight ? [response.data.highlight] : []),
                    ...response.data.today,
                    ...response.data.weekend,
                    ...response.data.upcoming,
                ];
                // Cache as simplified Event format for IndexedDB
                for (const event of allEvents) {
                    const eventToCache = {
                        id: event.id,
                        titulo: event.title,
                        dateTime: new Date(event.startDateTime),
                        local: event.venue?.name || '',
                        bairroId: event.venue?.bairro || '',
                        tags: [] as string[],
                        imageUrl: event.coverImage || undefined,
                    };
                    await eventsDB.save(eventToCache);
                }
            }

            return response;
        } catch (error) {
            console.warn('[EventService] API failed for homeFeatured:', error);

            // Fallback: build from cached events
            const cached = await eventsDB.getAll();
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const weekendStart = new Date(today);
            weekendStart.setDate(today.getDate() + (6 - today.getDay()));
            const weekendEnd = new Date(weekendStart);
            weekendEnd.setDate(weekendStart.getDate() + 1);

            const mapToHomeFeatured = (e: import('@/types').Event) => ({
                id: e.id,
                title: e.titulo || '',
                slug: e.id,
                coverImage: e.imageUrl || null,
                startDateTime: e.dateTime instanceof Date ? e.dateTime.toISOString() : String(e.dateTime),
                venue: { name: e.local } as HomeFeaturedResponse['data']['upcoming'][0]['venue'],
                ticket: null as unknown as HomeFeaturedResponse['data']['upcoming'][0]['ticket'],
                category: null as unknown as HomeFeaturedResponse['data']['upcoming'][0]['category'],
            });

            return {
                data: {
                    highlight: cached[0] ? { ...mapToHomeFeatured(cached[0]), bannerImage: null, badge: null } : null,
                    today: cached.filter(e => {
                        const dateVal = e.dateTime instanceof Date ? e.dateTime : new Date(String(e.dateTime));
                        return dateVal >= today && dateVal < tomorrow;
                    }).slice(0, 5).map(mapToHomeFeatured),
                    weekend: cached.filter(e => {
                        const dateVal = e.dateTime instanceof Date ? e.dateTime : new Date(String(e.dateTime));
                        return dateVal >= weekendStart && dateVal <= weekendEnd;
                    }).slice(0, 5).map(mapToHomeFeatured),
                    upcoming: cached.slice(0, 10).map(mapToHomeFeatured),
                },
                success: true,
            };
        }
    },

    /**
     * V2: Get calendar summary (optimized for calendar view)
     */
    async getCalendarSummary(year: number, month: number): Promise<CalendarSummaryResponse> {
        try {
            const response = await apiClient.get<CalendarSummaryResponse>(
                ENDPOINTS.events.calendarSummary,
                { year, month }
            );
            return response;
        } catch (error) {
            console.warn('[EventService] API failed for calendarSummary:', error);

            // Fallback: build from cached events
            const cached = await eventsDB.getAll();
            const summary: Record<string, { count: number; hasHighlight: boolean }> = {};
            let totalEvents = 0;

            cached.forEach(e => {
                const dateVal = e.dateTime instanceof Date ? e.dateTime.toISOString() : String(e.dateTime);
                const dateStr = dateVal.substring(0, 10);
                if (!dateStr) return;

                const [eventYear, eventMonth] = dateStr.split('-').map(Number);
                if (eventYear === year && eventMonth === month) {
                    if (!summary[dateStr]) {
                        summary[dateStr] = { count: 0, hasHighlight: false };
                    }
                    summary[dateStr].count++;
                    if ((e as { isFeatured?: boolean }).isFeatured) {
                        summary[dateStr].hasHighlight = true;
                    }
                    totalEvents++;
                }
            });

            return {
                data: summary,
                meta: { year, month, totalEvents },
                success: true,
            };
        }
    },

    // ==================== DATE FILTERS ====================

    /**
     * Get events by specific date
     */
    async getByDate(date: string): Promise<EventsListResponse> {
        try {
            const response = await apiClient.get<EventsListResponse>(
                ENDPOINTS.events.byDate(date)
            );

            if (response.data && response.data.length > 0) {
                await this.cacheEvents(response.data);
            }

            return response;
        } catch (error) {
            console.warn('[EventService] API failed for byDate:', error);
            return this.getFromCache({ fromDate: date, toDate: date });
        }
    },

    /**
     * Get events by month
     */
    async getByMonth(year: number, month: number): Promise<EventsListResponse> {
        try {
            const response = await apiClient.get<EventsListResponse>(
                ENDPOINTS.events.byMonth(year, month),
                { perPage: 100 }
            );

            if (response.data && response.data.length > 0) {
                await this.cacheEvents(response.data);
            }

            return response;
        } catch (error) {
            console.warn('[EventService] API failed for byMonth:', error);
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
            return this.getFromCache({ fromDate: startDate, toDate: endDate });
        }
    },

    // ==================== CATEGORY/TAG/LOCATION FILTERS ====================

    /**
     * Get events by category
     */
    async getByCategory(slug: string, params: EventFiltersParams = {}): Promise<EventsListResponse> {
        try {
            const response = await apiClient.get<EventsListResponse>(
                ENDPOINTS.events.byCategory(slug),
                buildQueryString(params)
            );

            if (response.data && response.data.length > 0) {
                await this.cacheEvents(response.data);
            }

            return response;
        } catch (error) {
            console.warn('[EventService] API failed for byCategory:', error);
            return this.getFromCache({ category: slug, ...params });
        }
    },

    /**
     * Get events by bairro
     */
    async getByBairro(bairroId: string, params: EventFiltersParams = {}): Promise<EventsListResponse> {
        try {
            const response = await apiClient.get<EventsListResponse>(
                ENDPOINTS.events.byBairro(bairroId),
                buildQueryString(params)
            );

            if (response.data && response.data.length > 0) {
                await this.cacheEvents(response.data);
            }

            return response;
        } catch (error) {
            console.warn('[EventService] API failed for byBairro:', error);
            return this.getFromCache({ bairroId, ...params });
        }
    },

    /**
     * Get events by venue
     */
    async getByVenue(venueId: string, params: EventFiltersParams = {}): Promise<EventsListResponse> {
        try {
            return await apiClient.get<EventsListResponse>(
                ENDPOINTS.events.byVenue(venueId),
                buildQueryString(params)
            );
        } catch (error) {
            console.warn('[EventService] API failed for byVenue:', error);
            return this.getFromCache({ venueId, ...params });
        }
    },

    /**
     * Get events by tag
     */
    async getByTag(slug: string, params: EventFiltersParams = {}): Promise<EventsListResponse> {
        try {
            return await apiClient.get<EventsListResponse>(
                ENDPOINTS.events.byTag(slug),
                buildQueryString(params)
            );
        } catch (error) {
            console.warn('[EventService] API failed for byTag:', error);
            return this.getFromCache({ tags: slug, ...params });
        }
    },

    /**
     * Get events by organizer
     */
    async getByOrganizer(organizerId: string, params: EventFiltersParams = {}): Promise<EventsListResponse> {
        try {
            return await apiClient.get<EventsListResponse>(
                ENDPOINTS.events.byOrganizer(organizerId),
                buildQueryString(params)
            );
        } catch (error) {
            console.warn('[EventService] API failed for byOrganizer:', error);
            return this.getFromCache({ organizerId, ...params });
        }
    },

    // ==================== SINGLE EVENT ====================

    /**
     * Get event details
     */
    async getById(id: string): Promise<EventDetailResponse> {
        try {
            const response = await apiClient.get<EventDetailResponse>(
                ENDPOINTS.events.get(id)
            );

            // Cache event for offline access
            if (response.data) {
                await this.cacheEvent(response.data);
            }

            return response;
        } catch (error) {
            console.warn('[EventService] API failed for getById:', error);

            // Try to get from cache
            const cached = await eventsDB.getById(id);
            if (cached) {
                return {
                    data: cached as unknown as EventDetail,
                    success: true,
                };
            }

            throw error;
        }
    },

    // ==================== CATEGORIES & TAGS ====================

    /**
     * Get all categories
     */
    async getCategories(): Promise<CategoriesResponse> {
        try {
            return await apiClient.get<CategoriesResponse>(ENDPOINTS.events.categories);
        } catch (error) {
            console.warn('[EventService] API failed for categories:', error);

            // Return default categories
            return {
                data: this.getDefaultCategories(),
                success: true,
            };
        }
    },

    /**
     * Get all tags
     */
    async getTags(): Promise<TagsResponse> {
        try {
            return await apiClient.get<TagsResponse>(ENDPOINTS.events.tags);
        } catch (error) {
            console.warn('[EventService] API failed for tags:', error);

            return {
                data: this.getDefaultTags(),
                success: true,
            };
        }
    },

    /**
     * Get trending tags
     */
    async getTrendingTags(): Promise<TagsResponse> {
        try {
            return await apiClient.get<TagsResponse>(ENDPOINTS.events.tagsTrending);
        } catch (error) {
            console.warn('[EventService] API failed for trending tags:', error);

            return {
                data: this.getDefaultTags().filter(t => t.isFeatured),
                success: true,
            };
        }
    },

    // ==================== RSVP ====================

    /**
     * Get user's RSVP for an event
     */
    async getRsvp(eventId: string): Promise<RsvpResponse | null> {
        try {
            return await apiClient.get<RsvpResponse>(ENDPOINTS.events.rsvp(eventId));
        } catch (error) {
            console.warn('[EventService] API failed for getRsvp:', error);
            return null;
        }
    },

    /**
     * Create RSVP for an event
     */
    async createRsvp(eventId: string, data: CreateRsvpRequest): Promise<RsvpResponse> {
        return apiClient.post<RsvpResponse>(ENDPOINTS.events.rsvp(eventId), data);
    },

    /**
     * Update RSVP for an event
     */
    async updateRsvp(eventId: string, data: Partial<CreateRsvpRequest>): Promise<RsvpResponse> {
        return apiClient.put<RsvpResponse>(ENDPOINTS.events.rsvp(eventId), data);
    },

    /**
     * Delete RSVP for an event
     */
    async deleteRsvp(eventId: string): Promise<{ success: boolean; message: string }> {
        return apiClient.delete(ENDPOINTS.events.rsvp(eventId));
    },

    /**
     * Get event attendees
     */
    async getAttendees(eventId: string, page = 1, perPage = 20): Promise<AttendeesResponse> {
        return apiClient.get<AttendeesResponse>(
            ENDPOINTS.events.attendees(eventId),
            { page, perPage }
        );
    },

    // ==================== FAVORITES ====================

    /**
     * Toggle favorite status
     */
    async toggleFavorite(eventId: string): Promise<FavoriteResponse> {
        return apiClient.post<FavoriteResponse>(ENDPOINTS.events.favorite(eventId));
    },

    // ==================== USER'S EVENTS ====================

    /**
     * Get user's RSVP'd events
     */
    async getMyEvents(params: {
        status?: 'going' | 'maybe' | 'not_going' | 'all';
        timeframe?: 'upcoming' | 'past' | 'all';
        page?: number;
        perPage?: number;
    } = {}): Promise<EventsListResponse> {
        return apiClient.get<EventsListResponse>(
            ENDPOINTS.events.myEvents,
            params as Record<string, string | number | boolean | undefined>
        );
    },

    /**
     * Get user's favorite events
     */
    async getMyFavorites(params: {
        timeframe?: 'upcoming' | 'past' | 'all';
        page?: number;
        perPage?: number;
    } = {}): Promise<EventsListResponse> {
        return apiClient.get<EventsListResponse>(
            ENDPOINTS.events.myFavorites,
            params as Record<string, string | number | boolean | undefined>
        );
    },

    // ==================== CACHE HELPERS ====================

    /**
     * Cache events to IndexedDB
     */
    async cacheEvents(events: EventListItem[]): Promise<void> {
        try {
            // Cast to the simplified Event type for storage
            const eventsToCache = events.map(e => ({
                id: e.id,
                titulo: e.title,
                dateTime: new Date(e.startDateTime),
                local: e.venue?.name || '',
                bairroId: e.venue?.bairro?.id || '',
                tags: [],
                imageUrl: e.coverImage || undefined,
            }));
            await eventsDB.saveMany(eventsToCache);
            console.log(`[EventService] Cached ${events.length} events`);
        } catch (error) {
            console.warn('[EventService] Failed to cache events:', error);
        }
    },

    /**
     * Cache single event to IndexedDB
     */
    async cacheEvent(event: EventDetail): Promise<void> {
        try {
            const eventToCache = {
                id: event.id,
                titulo: event.title,
                dateTime: new Date(event.startDateTime),
                local: event.venue?.name || '',
                bairroId: event.venue?.bairro?.id || '',
                tags: event.tags?.map(t => typeof t === 'string' ? t : (t as { name?: string }).name || '') || [],
                imageUrl: event.media?.coverImage || undefined,
            };
            await eventsDB.save(eventToCache);
            console.log(`[EventService] Cached event ${event.id}`);
        } catch (error) {
            console.warn('[EventService] Failed to cache event:', error);
        }
    },

    /**
     * Get events from cache with filters
     */
    async getFromCache(params: EventFiltersParams): Promise<EventsListResponse> {
        try {
            let events = await eventsDB.getAll() as unknown as EventListItem[];

            // Apply filters locally
            if (params.search) {
                const q = params.search.toLowerCase();
                events = events.filter(e =>
                    e.title?.toLowerCase().includes(q) ||
                    e.descriptionShort?.toLowerCase().includes(q)
                );
            }

            if (params.category) {
                events = events.filter(e => e.category?.slug === params.category);
            }

            if (params.bairroId) {
                events = events.filter(e => e.venue?.bairro?.id === params.bairroId);
            }

            if (params.price === 'free') {
                events = events.filter(e => e.ticket?.type === 'free');
            } else if (params.price === 'paid') {
                events = events.filter(e => e.ticket?.type === 'paid');
            }

            if (params.featured) {
                events = events.filter(e => e.isFeatured);
            }

            // Sort
            if (params.orderBy === 'popularityScore') {
                events.sort((a, b) => b.popularityScore - a.popularityScore);
            } else {
                events.sort((a, b) =>
                    new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
                );
            }

            if (params.order === 'desc' && params.orderBy !== 'popularityScore') {
                events.reverse();
            }

            // Paginate
            const page = params.page || 1;
            const perPage = params.perPage || 15;
            const start = (page - 1) * perPage;
            const end = start + perPage;

            return {
                data: events.slice(start, end),
                success: true,
                meta: {
                    total: events.length,
                    page,
                    perPage,
                    lastPage: Math.ceil(events.length / perPage),
                },
            };
        } catch (error) {
            console.warn('[EventService] Failed to get from cache:', error);
            return {
                data: [],
                success: false,
                meta: { total: 0, page: 1, perPage: 15, lastPage: 1 },
            };
        }
    },

    /**
     * Clear cache and refresh
     */
    async refresh(): Promise<void> {
        await eventsDB.clear();
        await this.getAll();
    },

    // ==================== DEFAULT DATA ====================

    getDefaultCategories(): EventCategory[] {
        return [
            { id: '1', name: 'Show', slug: 'show', icon: 'music', color: '#9333EA' },
            { id: '2', name: 'Festa', slug: 'festa', icon: 'party-popper', color: '#F97316' },
            { id: '3', name: 'Cultura', slug: 'cultura', icon: 'theater', color: '#3B82F6' },
            { id: '4', name: 'Infantil', slug: 'infantil', icon: 'baby', color: '#10B981' },
            { id: '5', name: 'Gastronômico', slug: 'gastronomico', icon: 'utensils', color: '#EF4444' },
            { id: '6', name: 'Esportes', slug: 'esportes', icon: 'trophy', color: '#FBBF24' },
            { id: '7', name: 'Religioso', slug: 'religioso', icon: 'church', color: '#8B5CF6' },
            { id: '8', name: 'Feira', slug: 'feira', icon: 'store', color: '#EC4899' },
            { id: '9', name: 'Workshop', slug: 'workshop', icon: 'graduation-cap', color: '#06B6D4' },
            { id: '10', name: 'Beneficente', slug: 'beneficente', icon: 'heart', color: '#F43F5E' },
        ];
    },

    getDefaultTags(): EventTag[] {
        return [
            { id: '1', name: 'ao ar livre', slug: 'ao-ar-livre', color: '#22C55E', isFeatured: true },
            { id: '2', name: 'família', slug: 'familia', color: '#3B82F6', isFeatured: true },
            { id: '3', name: 'música', slug: 'musica', color: '#9333EA', isFeatured: true },
            { id: '4', name: 'gratuito', slug: 'gratuito', color: '#10B981', isFeatured: true },
            { id: '5', name: 'food truck', slug: 'food-truck', color: '#F97316', isFeatured: false },
            { id: '6', name: 'crianças', slug: 'criancas', color: '#EC4899', isFeatured: true },
            { id: '7', name: 'noturno', slug: 'noturno', color: '#6366F1', isFeatured: false },
            { id: '8', name: 'fim de semana', slug: 'fim-de-semana', color: '#EAB308', isFeatured: true },
            { id: '9', name: 'acessível', slug: 'acessivel', color: '#14B8A6', isFeatured: false },
            { id: '10', name: 'pet friendly', slug: 'pet-friendly', color: '#F43F5E', isFeatured: false },
        ];
    },
};

export default eventApiService;
