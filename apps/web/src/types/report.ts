/**
 * Report Types - Citizen Reports (Denúncias Cidadãs)
 */

// ======================================================
// API Response Types (from backend)
// ======================================================

export type ReportStatus = 'recebido' | 'em_analise' | 'resolvido' | 'rejeitado';
export type LocationQuality = 'precisa' | 'aproximada' | 'manual';
export type AddressSource = 'gps' | 'manual' | 'mapa';

export interface ReportCategory {
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
    tips: string[];
    sortOrder: number;
}

export interface ReportMedia {
    id: string;
    url: string;
    thumbUrl: string;
    webUrl: string;
    width?: number;
    height?: number;
    mimeType: string;
    size: number;
}

export interface ReportStatusHistoryItem {
    status: ReportStatus;
    note: string | null;
    at: string;
    by: string;
}

export interface CitizenReport {
    id: string;
    protocol: string;
    title: string;
    description: string;

    // Status
    status: ReportStatus;
    statusLabel: string;
    statusColor: string;
    statusIcon: string;

    // Category
    category?: ReportCategory;
    categoryId: string;

    // Location
    addressText: string | null;
    addressSource: AddressSource;
    locationQuality: LocationQuality | null;
    locationQualityLabel: string | null;
    latitude: number | null;
    longitude: number | null;
    locationAccuracyM: number | null;

    // Bairro
    bairro?: {
        id: string;
        nome: string;
    };
    bairroId: string | null;

    // Media
    media?: ReportMedia[];

    // History
    history?: ReportStatusHistoryItem[];

    // Timestamps
    createdAt: string;
    updatedAt: string | null;
    resolvedAt: string | null;
}

// ======================================================
// Wizard Types (for frontend)
// ======================================================

export interface CapturedImage {
    id: string;
    file: File;
    previewUrl: string;
    capturedAt: Date;
}

export interface LocationData {
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
    source: AddressSource;
    quality: LocationQuality;
}

export interface ReportDraft {
    // Step 1
    categoryId: string | null;
    category: ReportCategory | null;

    // Step 2
    location: LocationData | null;
    locationNote: string; // Optional observation / reference point

    // Step 3
    images: CapturedImage[];
    title: string;
    description: string;

    // Step 4
    confirmed: boolean;

    // Meta
    currentStep: WizardStep;
    createdAt: Date;
    updatedAt: Date;
    idempotencyKey: string; // For offline dedupe
}

export type WizardStep = 1 | 2 | 3 | 4;

export interface CameraState {
    status: 'idle' | 'requesting' | 'active' | 'denied' | 'error';
    errorMessage?: string;
    facingMode: 'environment' | 'user';
    stream: MediaStream | null;
}

export interface LocationState {
    status: 'idle' | 'requesting' | 'success' | 'denied' | 'error';
    errorMessage?: string;
}

// ======================================================
// API Request Types
// ======================================================

export interface CreateReportPayload {
    categoryId: string;
    title: string;
    description: string;
    addressText?: string;
    addressSource?: AddressSource;
    locationQuality?: LocationQuality;
    latitude?: number;
    longitude?: number;
    locationAccuracyM?: number;
    bairroId?: string;
    images?: File[];
}

// ======================================================
// Geocoding Types
// ======================================================

export interface GeocodeSuggestion {
    placeId: string | null;
    displayName: string;
    latitude: number;
    longitude: number;
    type: string;
    address: string;
}

// ======================================================
// Initial State & Constants
// ======================================================

export const generateIdempotencyKey = (): string =>
    `report-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

export const initialReportDraft: ReportDraft = {
    categoryId: null,
    category: null,
    location: null,
    locationNote: '',
    images: [],
    title: '',
    description: '',
    confirmed: false,
    currentStep: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    idempotencyKey: generateIdempotencyKey(),
};

// Storage key for persistence
export const REPORT_DRAFT_KEY = 'etijucas-report-draft';

// Max images allowed
export const MAX_REPORT_IMAGES = 3;
