/**
 * Home Types - "Hoje em Tijucas"
 * 
 * Types for the aggregated Home API response.
 * These match the backend HomeAggregatorService output.
 */

// ========================================
// Meta
// ========================================

export interface UserStreak {
    current_streak: number;
    longest_streak: number;
    last_activity_date: string | null;
    today_completed: boolean;
}

export interface HomeMeta {
    user_state: 'logged_in' | 'guest';
    bairro: { id: string } | null;
    cache: {
        ttl: number;
        stale_ok: boolean;
    };
    generated_at: string;
    version: number;
    errors: string[]; // Blocks that failed to load
    user?: {
        id: string;
        nome: string;
        streak: UserStreak;
    };
}

// ========================================
// Block Types
// ========================================

export type HomeBlockType =
    | 'alert_banner'
    | 'weather_mini'
    | 'boletim_dia'
    | 'fiscaliza_vivo'
    | 'forum_vivo'
    | 'quick_access'
    | 'events_carousel'
    | 'tourism_carousel'
    | 'tijucanos_counter';

// ========================================
// Alert Banner
// ========================================

export interface AlertItem {
    id: string;
    tipo: 'obras' | 'interdicao' | 'clima' | 'evento' | 'seguranca';
    titulo: string;
    descricao?: string;
    nivel: 'info' | 'warning' | 'critical';
    created_at: string;
}

export interface AlertBannerPayload {
    alerts: AlertItem[];
}

// ========================================
// Weather Mini
// ========================================

export interface WeatherMiniPayload {
    temp: number;
    icon: number;
    frase: string;
    uv: string;
}

// ========================================
// Boletim do Dia
// ========================================

export interface BoletimDoDiaPayload {
    date: string;
    clima: WeatherMiniPayload;
    alertas_count: number;
    alerta_destaque: string | null;
    eventos_count: number;
    fiscaliza_destaque: {
        titulo: string;
        apoios: number;
    } | null;
    forum_destaque: {
        titulo: string;
        comentarios: number;
    } | null;
}

// ========================================
// Fiscaliza Vivo
// ========================================

export interface FiscalizaVivoPayload {
    total: number;
    resolvidos: number;
    hoje: number;
    novas_bairro: number;
    resolvidas_semana: number;
    pendentes_bairro: number;
    frases: string[];
}

// ========================================
// Fórum Vivo
// ========================================

export interface ForumVivoPayload {
    comentarios_hoje: number;
    curtidas_semana: number;
    top_topico: {
        id: string;
        titulo: string;
        comments_count: number;
        likes_count: number;
    } | null;
}

// ========================================
// Quick Access
// ========================================

export interface QuickAccessItem {
    id: string;
    label: string;
    icon: string;
    route: string;
    badge: string | null;
    badge_color?: 'blue' | 'green' | 'orange' | 'red';
    highlight?: boolean;
}

export interface QuickAccessPayload {
    items: QuickAccessItem[];
}

// ========================================
// Events Carousel
// ========================================

export interface CarouselEventItem {
    id: string;
    titulo: string;
    start_date: string;
    end_date: string | null;
    local: string;
    cover_image: string | null;
}

export interface EventsCarouselPayload {
    events: CarouselEventItem[];
}

// ========================================
// Tourism Carousel
// ========================================

export interface CarouselTourismItem {
    id: string;
    nome: string;
    descricao_curta: string;
    categoria: string;
    imagem_capa: string | null;
    rating: number;
}

export interface TourismCarouselPayload {
    title: string;
    spots: CarouselTourismItem[];
}

// ========================================
// Tijucanos Counter (with dynamic goals)
// ========================================

export interface GoalData {
    stage_start: number;
    target: number;
    remaining: number;
    progress: number;
    progress_pct: number;
    message: string;
}

export interface TijucanosCounterPayload {
    total: number;
    verified: number;
    new_today: number;
    goal: GoalData;
}

// ========================================
// Generic Block
// ========================================

export interface HomeBlock<T = unknown> {
    type: HomeBlockType;
    priority: number;
    visible: boolean;
    payload: T;
}

// ========================================
// Full Response
// ========================================

export interface HomeDataResponse {
    meta: HomeMeta;
    blocks: HomeBlock[];
}

// ========================================
// Typed Block Helpers
// ========================================

export type AlertBannerBlock = HomeBlock<AlertBannerPayload>;
export type WeatherMiniBlock = HomeBlock<WeatherMiniPayload>;
export type BoletimDoDiaBlock = HomeBlock<BoletimDoDiaPayload>;
export type FiscalizaVivoBlock = HomeBlock<FiscalizaVivoPayload>;
export type ForumVivoBlock = HomeBlock<ForumVivoPayload>;
export type QuickAccessBlock = HomeBlock<QuickAccessPayload>;
export type EventsCarouselBlock = HomeBlock<EventsCarouselPayload>;
export type TourismCarouselBlock = HomeBlock<TourismCarouselPayload>;
export type TijucanosCounterBlock = HomeBlock<TijucanosCounterPayload>;

// ========================================
// Helper to get typed block
// ========================================

export function getBlock<T>(
    data: HomeDataResponse | undefined,
    type: HomeBlockType
): HomeBlock<T> | undefined {
    return data?.blocks.find((b) => b.type === type) as HomeBlock<T> | undefined;
}

export function getAlertBanner(data: HomeDataResponse | undefined) {
    return getBlock<AlertBannerPayload>(data, 'alert_banner');
}

export function getWeatherMini(data: HomeDataResponse | undefined) {
    return getBlock<WeatherMiniPayload>(data, 'weather_mini');
}

export function getBoletimDoDia(data: HomeDataResponse | undefined) {
    return getBlock<BoletimDoDiaPayload>(data, 'boletim_dia');
}

export function getFiscalizaVivo(data: HomeDataResponse | undefined) {
    return getBlock<FiscalizaVivoPayload>(data, 'fiscaliza_vivo');
}

export function getForumVivo(data: HomeDataResponse | undefined) {
    return getBlock<ForumVivoPayload>(data, 'forum_vivo');
}

export function getQuickAccess(data: HomeDataResponse | undefined) {
    return getBlock<QuickAccessPayload>(data, 'quick_access');
}

export function getEventsCarousel(data: HomeDataResponse | undefined) {
    return getBlock<EventsCarouselPayload>(data, 'events_carousel');
}

export function getTourismCarousel(data: HomeDataResponse | undefined) {
    return getBlock<TourismCarouselPayload>(data, 'tourism_carousel');
}

export function getTijucanosCounter(data: HomeDataResponse | undefined) {
    return getBlock<TijucanosCounterPayload>(data, 'tijucanos_counter');
}
