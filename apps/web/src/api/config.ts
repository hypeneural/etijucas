// ======================================================
// API Configuration - eTijucas
// Complete endpoint structure for backend integration
// ======================================================

// In development, use '/api' which is proxied by Vite to bypass CORS
// In production, use the full API URL
const isDev = import.meta.env.DEV;
const PROD_API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const API_CONFIG = {
    baseURL: isDev ? '/api' : PROD_API_URL,
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
};

// ======================================================
// API Endpoints organized by module
// ======================================================

export const ENDPOINTS = {
    // ==================== AUTH ====================
    auth: {
        login: '/auth/login',
        sendOtp: '/auth/send-otp',           // For registration
        resendOtp: '/auth/resend-otp',       // Rate limit: 3/min
        verifyOtp: '/auth/verify-otp',
        register: '/auth/register',
        forgotPassword: '/auth/forgot-password',  // Sends OTP for reset
        resetPassword: '/auth/reset-password',    // Sets new password
        refresh: '/auth/refresh',
        logout: '/auth/logout',
        me: '/auth/me',
    },

    // ==================== USER/PROFILE ====================
    users: {
        me: '/users/me',
        update: '/users/me',
        avatar: '/users/me/avatar',
        password: '/users/me/password',
        notifications: '/users/me/notifications',
    },

    // ==================== REPORTS (Denúncias Cidadãs) ====================
    reports: {
        categories: '/report-categories',
        create: '/reports',
        list: '/reports',               // Public list (approved)
        stats: '/reports/stats',         // KPIs: total, resolved, pending, etc.
        myReports: '/reports/me',
        get: (id: string) => `/reports/${id}`,
        addMedia: (id: string) => `/reports/${id}/media`,
        removeMedia: (id: string, mediaId: string) => `/reports/${id}/media/${mediaId}`,
        updateStatus: (id: string) => `/reports/${id}/status`,
        adminList: '/admin/reports',
    },

    // ==================== GEOCODING ====================
    geocode: {
        autocomplete: '/geocode/autocomplete',
        reverse: '/geocode/reverse',
    },

    // ==================== FORUM (Boca no Trombone) ====================
    forum: {
        // Topics
        topics: '/forum/topics',
        topic: (id: string) => `/forum/topics/${id}`,
        createTopic: '/forum/topics',
        updateTopic: (id: string) => `/forum/topics/${id}`,
        deleteTopic: (id: string) => `/forum/topics/${id}`,
        likeTopic: (id: string) => `/forum/topics/${id}/like`,
        saveTopic: (id: string) => `/forum/topics/${id}/save`,
        reportTopic: (id: string) => `/forum/topics/${id}/report`,
        savedTopics: '/forum/saved',

        // Comments
        comments: (topicId: string) => `/forum/topics/${topicId}/comments`,
        deleteComment: (topicId: string, commentId: string) => `/forum/topics/${topicId}/comments/${commentId}`,
        likeComment: (commentId: string) => `/forum/comments/${commentId}/like`,
        reportComment: (commentId: string) => `/forum/comments/${commentId}/report`,

        // Upload
        upload: '/forum/upload',
    },

    // ==================== TOPICS (Legacy - deprecated) ====================
    topics: {
        list: '/forum/topics',
        get: (id: string) => `/forum/topics/${id}`,
        create: '/forum/topics',
        update: (id: string) => `/forum/topics/${id}`,
        delete: (id: string) => `/forum/topics/${id}`,
        like: (id: string) => `/forum/topics/${id}/like`,
        unlike: (id: string) => `/forum/topics/${id}/like`,
        comments: (id: string) => `/forum/topics/${id}/comments`,
    },


    // ==================== EVENTS (Agenda) ====================
    events: {
        // Listings
        list: '/events',
        get: (id: string) => `/events/${id}`,
        upcoming: '/events/upcoming',
        today: '/events/today',
        weekend: '/events/weekend',
        featured: '/events/featured',
        search: '/events/search',

        // V2: Optimized endpoints
        homeFeatured: '/events/home-featured',
        calendarSummary: '/events/calendar-summary',

        // Date filters
        byDate: (date: string) => `/events/date/${date}`,
        byMonth: (year: number, month: number) => `/events/month/${year}/${month}`,

        // Category/Tag/Location filters
        byCategory: (slug: string) => `/events/category/${slug}`,
        byBairro: (bairroId: string) => `/events/bairro/${bairroId}`,
        byVenue: (venueId: string) => `/events/venue/${venueId}`,
        byTag: (slug: string) => `/events/tag/${slug}`,
        byOrganizer: (organizerId: string) => `/events/organizer/${organizerId}`,

        // Categories & Tags
        categories: '/events/categories',
        tags: '/events/tags',
        tagsTrending: '/events/tags/trending',

        // RSVP
        rsvp: (eventId: string) => `/events/${eventId}/rsvp`,
        attendees: (eventId: string) => `/events/${eventId}/attendees`,

        // Favorites
        favorite: (eventId: string) => `/events/${eventId}/favorite`,

        // User's events
        myEvents: '/users/me/events',
        myFavorites: '/users/me/favorites/events',
    },

    // ==================== TRASH (Coleta de Lixo) ====================
    trash: {
        schedules: '/trash/schedules',
        byBairro: (bairroId: string) => `/trash/schedules/bairro/${bairroId}`,
        today: '/trash/today',
        next: '/trash/next',
        types: '/trash/types',
    },

    // ==================== MASSES (Missas) ====================
    masses: {
        list: '/masses',
        byBairro: (bairroId: string) => `/masses/bairro/${bairroId}`,
        today: '/masses/today',
        tomorrow: '/masses/tomorrow',
    },

    // ==================== PHONES (Telefones Úteis) ====================
    phones: {
        list: '/phones',
        byCategory: (category: string) => `/phones/category/${category}`,
        search: '/phones/search',
    },

    // ==================== ALERTS ====================
    alerts: {
        list: '/alerts',
        get: (id: string) => `/alerts/${id}`,
        active: '/alerts/active',
    },

    // ==================== BAIRROS ====================
    bairros: {
        list: '/bairros',
        get: (id: string) => `/bairros/${id}`,
    },

    // ==================== TOURISM ====================
    tourism: {
        spots: '/tourism/spots',
        get: (id: string) => `/tourism/spots/${id}`,
        categories: '/tourism/categories',

        // User interactions (auth required)
        like: (id: string) => `/tourism/spots/${id}/like`,
        save: (id: string) => `/tourism/spots/${id}/save`,

        // Reviews
        reviews: (spotId: string) => `/tourism/spots/${spotId}/reviews`,
        createReview: (spotId: string) => `/tourism/spots/${spotId}/reviews`,
        deleteReview: (reviewId: string) => `/tourism/reviews/${reviewId}`,
    },

    // ==================== UPLOADS ====================
    uploads: {
        image: '/uploads/image',
        images: '/uploads/images',
    },
} as const;

// ======================================================
// Query keys for React Query (cache management)
// ======================================================

export const QUERY_KEYS = {
    // Auth
    auth: {
        me: ['auth', 'me'] as const,
    },

    // User
    user: {
        profile: ['user', 'profile'] as const,
        notifications: ['user', 'notifications'] as const,
    },

    // Reports - full structure matching other modules
    reports: {
        all: ['reports'] as const,
        list: (filters?: Record<string, unknown>) => ['reports', 'list', filters] as const,
        mine: ['reports', 'mine'] as const,
        public: ['reports', 'public'] as const,
        stats: () => ['reports', 'stats'] as const,
        detail: (id: string) => ['reports', 'detail', id] as const,
        categories: ['reports', 'categories'] as const,
    },
    // Legacy - keep for backwards compatibility
    myReports: ['reports', 'mine'] as const,

    // Topics
    topics: {
        all: ['topics'] as const,
        list: (filters?: Record<string, unknown>) => ['topics', 'list', filters] as const,
        detail: (id: string) => ['topics', 'detail', id] as const,
        comments: (id: string) => ['topics', id, 'comments'] as const,
    },

    // Trash
    trash: {
        schedules: ['trash', 'schedules'] as const,
        byBairro: (bairroId: string) => ['trash', 'bairro', bairroId] as const,
        today: ['trash', 'today'] as const,
        next: ['trash', 'next'] as const,
        types: ['trash', 'types'] as const,
    },

    // Masses
    masses: {
        all: ['masses'] as const,
        byBairro: (bairroId: string) => ['masses', 'bairro', bairroId] as const,
        today: ['masses', 'today'] as const,
    },

    // Phones
    phones: {
        all: ['phones'] as const,
        byCategory: (category: string) => ['phones', 'category', category] as const,
    },

    // Alerts
    alerts: {
        all: ['alerts'] as const,
        active: ['alerts', 'active'] as const,
    },

    // Bairros
    bairros: {
        all: ['bairros'] as const,
        detail: (id: string) => ['bairros', id] as const,
    },

    // Tourism
    tourism: {
        all: ['tourism'] as const,
        spots: (filters?: Record<string, unknown>) => ['tourism', 'spots', filters] as const,
        detail: (id: string) => ['tourism', 'detail', id] as const,
        reviews: (spotId: string) => ['tourism', spotId, 'reviews'] as const,
        categories: ['tourism', 'categories'] as const,
    },
} as const;

// ======================================================
// Cache times (in milliseconds)
// ======================================================

export const CACHE_TIMES = {
    // Static data - rarely changes
    bairros: 7 * 24 * 60 * 60 * 1000,      // 7 days
    phones: 24 * 60 * 60 * 1000,            // 1 day
    masses: 24 * 60 * 60 * 1000,            // 1 day
    trashTypes: 7 * 24 * 60 * 60 * 1000,   // 7 days

    // Dynamic data
    events: 60 * 60 * 1000,                 // 1 hour
    alerts: 5 * 60 * 1000,                  // 5 minutes
    reports: 10 * 60 * 1000,                // 10 minutes
    topics: 10 * 60 * 1000,                 // 10 minutes
    trashSchedules: 24 * 60 * 60 * 1000,   // 1 day

    // User-specific
    profile: 5 * 60 * 1000,                 // 5 minutes
} as const;
