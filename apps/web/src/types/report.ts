/**
 * Report Wizard Types
 */

export interface Category {
    id: string;
    label: string;
    icon: string;
    tips: string[];
    subcategories: string[];
}

export interface CapturedImage {
    id: string;
    blob: Blob;
    previewUrl: string;
    capturedAt: Date;
}

export interface LocationData {
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
    reference?: string;
}

export interface ReportDraft {
    // Step 1
    categoryId: string | null;
    subcategory: string | null;

    // Step 2
    location: LocationData | null;

    // Step 3
    images: CapturedImage[];

    // Step 4
    description: string;
    confirmed: boolean;

    // Meta
    currentStep: number;
    createdAt: Date;
    updatedAt: Date;
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

// Initial draft state
export const initialReportDraft: ReportDraft = {
    categoryId: null,
    subcategory: null,
    location: null,
    images: [],
    description: '',
    confirmed: false,
    currentStep: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
};

// Storage key for persistence
export const REPORT_DRAFT_KEY = 'etijucas-report-draft';
