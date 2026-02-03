// ======================================================
// API Types - Complete type definitions
// For all request/response payloads
// ======================================================

import {
    Bairro,
    Topic,
    Event,
    Report,
    TourismSpot,
    UsefulPhone,
    MassSchedule,
    Alert,
    TopicCategory,
    ReportCategory,
    Comment,
    PhoneCategory,
} from './index';

// ======================================================
// Response Wrappers
// ======================================================

export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}

export interface PaginationMeta {
    total: number;
    page: number;
    perPage: number;
    lastPage: number;
    from: number;
    to: number;
}

// ApiErrorResponse moved to Auth section for enhanced structure

// ======================================================
// Auth DTOs
// ======================================================

export interface SendOtpDTO {
    phone: string;
}

export interface SendOtpResponse {
    success: boolean;
    userExists: boolean; // Whether user is already registered
    expiresIn: number; // seconds
    message?: string;
}

export interface ResendOtpResponse {
    success: boolean;
    expiresIn: number;
    message?: string;
}

export interface VerifyOtpDTO {
    phone: string;
    code: string;
}

/**
 * Response from verify-otp endpoint
 * - If user exists: returns tokens + user
 * - If new user: returns needsRegistration + phone + verifiedUntil for next step
 */
export interface VerifyOtpResponse {
    needsRegistration?: boolean;
    phone?: string;
    verifiedUntil?: string; // ISO date - registration must happen before this
    // Present when user exists:
    token?: string;
    refreshToken?: string;
    user?: User;
    expiresIn?: number;
}

/**
 * Standardized API error response
 */
export interface ApiErrorResponse {
    success: false;
    message: string;
    code: 'RATE_LIMITED' | 'INVALID_OTP' | 'VALIDATION_ERROR' | 'UNAUTHENTICATED' | 'OTP_NOT_VERIFIED' | 'USER_NOT_FOUND' | string;
    attemptsRemaining?: number;
    retryAfter?: number; // seconds to wait before retry
    errors?: Record<string, string[]>;
}

export interface AuthResponse {
    token: string;
    refreshToken: string;
    user: User;
    expiresIn: number;
}

// ======================================================
// Login DTOs (Phone + Password)
// ======================================================

export interface LoginDTO {
    phone: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    refreshToken: string;
    user: User;
    expiresIn: number;
}

// ======================================================
// Registration DTO (includes password)
// ======================================================

export interface RegisterDTO {
    phone: string;
    nome: string;
    password: string;
    confirmPassword: string;
    email?: string;
    bairroId?: string;
    address?: AddressDTO;
}

// ======================================================
// Password Reset DTOs
// ======================================================

export interface ForgotPasswordDTO {
    phone: string;
}

export interface ForgotPasswordResponse {
    success: boolean;
    expiresIn: number;
    message?: string;
}

export interface ResetPasswordDTO {
    phone: string;
    code: string;
    password: string;
    confirmPassword: string;
}

export interface ResetPasswordResponse {
    success: boolean;
    message?: string;
}

export interface RefreshTokenDTO {
    refreshToken: string;
}

// ======================================================
// User/Profile Types
// ======================================================

export interface User {
    id: string;
    phone: string;
    nome: string;
    email?: string;
    avatarUrl?: string;
    bairroId?: string;
    bairro?: Bairro;
    address?: Address;
    notificationSettings: NotificationSettings;
    phoneVerified: boolean;
    phoneVerifiedAt?: string;
    roles: string[];
    stats?: UserStats;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
}

export interface UserStats {
    reportsCount: number;
    topicsCount: number;
    commentsCount: number;
}

// Address uses English field names to match backend
// Address uses English field names to match backend
export interface Address {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
}

export type AddressDTO = Address;

export interface NotificationSettings {
    pushEnabled: boolean;
    alertsEnabled: boolean;
    eventsEnabled: boolean;
    reportsEnabled: boolean;
}

export interface UpdateUserDTO {
    nome?: string;
    email?: string;
    bairroId?: string;
    address?: AddressDTO;
}

export interface UpdatePasswordDTO {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface UpdateNotificationsDTO {
    pushEnabled?: boolean;
    alertsEnabled?: boolean;
    eventsEnabled?: boolean;
    reportsEnabled?: boolean;
}

// ======================================================
// Pagination & Filter Types
// ======================================================

export interface PaginationParams {
    page?: number;
    perPage?: number;
}

export interface SortParams {
    orderBy?: string;
    order?: 'asc' | 'desc';
}

// ======================================================
// Report Filters & DTOs
// ======================================================

export interface ReportFilters extends PaginationParams, SortParams {
    bairroId?: string;
    categoria?: ReportCategory;
    status?: 'recebido' | 'em_analise' | 'resolvido';
    fromDate?: string;
    toDate?: string;
}

export interface CreateReportDTO {
    texto: string;
    categoria: ReportCategory;
    bairroId: string;
    local?: string;
    latitude?: number;
    longitude?: number;
    fotos?: string[];
}

// ======================================================
// Topic Filters & DTOs
// ======================================================

export interface TopicFilters extends PaginationParams {
    bairroId?: string;
    categoria?: TopicCategory;
    search?: string;
    periodo?: 'hoje' | '7dias' | '30dias';
    comFoto?: boolean;
    orderBy?: 'createdAt' | 'likesCount' | 'commentsCount' | 'hotScore';
    order?: 'asc' | 'desc';
}

export interface CreateTopicDTO {
    titulo: string;
    texto: string;
    categoria: TopicCategory;
    bairroId: string;
    isAnon?: boolean;
    fotoUrl?: string;
}

export interface UpdateTopicDTO {
    titulo?: string;
    texto?: string;
    categoria?: TopicCategory;
    fotoUrl?: string | null;
}

export interface CreateCommentDTO {
    texto: string;
    parentId?: string;
    isAnon?: boolean;
    imageUrl?: string;
}

// Forum API Responses
export interface TopicAuthor {
    id: string | null;
    nome: string;
    avatarUrl: string | null;
}

export interface TopicBairro {
    id: string;
    nome: string;
}

export interface TopicLikeResponse {
    liked: boolean;
    likesCount: number;
}

export interface TopicSaveResponse {
    saved: boolean;
}

export interface CommentLikeResponse {
    liked: boolean;
    likesCount: number;
}

export type ReportMotivo = 'spam' | 'ofensivo' | 'falso' | 'outro';

export interface ReportDTO {
    motivo: ReportMotivo;
    descricao?: string;
}

export interface ReportResponse {
    success: boolean;
    message: string;
}


// ======================================================
// Event Filters
// ======================================================

export interface EventFilters extends PaginationParams {
    bairroId?: string;
    fromDate?: string;
    toDate?: string;
    tags?: string[];
    search?: string;
}

// ======================================================
// Trash Schedule Types
// ======================================================

export interface TrashSchedule {
    id: string;
    bairroId: string;
    tipo: TrashType;
    diaSemana: number;
    horario?: string;
    observacao?: string;
}

export type TrashType = 'organico' | 'reciclavel' | 'rejeitos' | 'volumoso';

export interface TrashTypeConfig {
    id: TrashType;
    nome: string;
    cor: string;
    icone: string;
    dicas: string[];
}

export interface TrashFilters {
    bairroId?: string;
    tipo?: TrashType;
    diaSemana?: number;
}

// ======================================================
// Phone Filters
// ======================================================

export interface PhoneFilters {
    categoria?: PhoneCategory;
    search?: string;
}

// ======================================================
// Mass Schedule Filters
// ======================================================

export interface MassFilters {
    bairroId?: string;
    diaSemana?: number;
}

// ======================================================
// File Upload
// ======================================================

export interface UploadResponse {
    url: string;
    thumb: string;
    medium: string;
}

export interface UploadMultipleResponse {
    files: UploadResponse[];
}

// ======================================================
// Re-exports for convenience
// ======================================================

export type {
    Bairro,
    Topic,
    Event,
    Report,
    TourismSpot,
    UsefulPhone,
    MassSchedule,
    Alert,
    Comment,
    TopicCategory,
    ReportCategory,
    PhoneCategory,
};
