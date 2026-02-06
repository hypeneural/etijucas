/**
 * Plate OCR Service
 * Handles image upload for plate recognition via Plate Recognizer API
 */
import { apiClient } from '@/api/client';
import { API_CONFIG, ENDPOINTS } from '@/api/config';

export interface PlateOcrResult {
    plate: string;
    score: number;
    dscore: number;
    box?: {
        xmin: number;
        ymin: number;
        xmax: number;
        ymax: number;
    };
    candidates?: Array<{
        plate: string;
        score: number;
    }>;
    region?: string;
    vehicle_type?: string;
}

export interface PlateOcrResponse {
    ok: boolean;
    results?: PlateOcrResult[];
    processing_time_ms?: number;
    message?: string;
}

/**
 * Open camera for capturing plate image
 */
export function pickImageFromCamera(onSelect: (file: File) => void): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // Force rear camera on mobile when supported
    (input as any).capture = 'environment';
    input.onchange = () => {
        const file = input.files?.[0];
        if (file) onSelect(file);
    };
    input.click();
}

/**
 * Open gallery for selecting plate image
 */
export function pickImageFromGallery(onSelect: (file: File) => void): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
        const file = input.files?.[0];
        if (file) onSelect(file);
    };
    input.click();
}

/**
 * Send image to backend for OCR recognition
 */
export async function recognizePlate(file: File): Promise<PlateOcrResponse> {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`${API_CONFIG.baseURL}${ENDPOINTS.plates.recognize}`, {
            method: 'POST',
            body: formData,
        });

        return await response.json();
    } catch (error) {
        console.error('OCR Error:', error);
        return {
            ok: false,
            message: 'Erro ao processar imagem',
        };
    }
}

/**
 * Get confidence level description based on score
 */
export function getConfidenceLevel(score: number): {
    level: 'high' | 'medium' | 'low';
    label: string;
    color: string;
} {
    if (score >= 0.88) {
        return { level: 'high', label: 'Alta confiança', color: 'text-green-400' };
    } else if (score >= 0.70) {
        return { level: 'medium', label: 'Média confiança', color: 'text-yellow-400' };
    } else {
        return { level: 'low', label: 'Baixa confiança', color: 'text-red-400' };
    }
}

/**
 * Suggest O/0 and I/1 alternatives for BR plates
 * BR Mercosul: AAA0X00 (pos 0-2 letters, 3 number, 4 letter, 5-6 numbers)
 * BR Antiga: AAA0000 (pos 0-2 letters, 3-6 numbers)
 */
export function suggestAlternatives(plate: string): string[] {
    if (plate.length !== 7) return [];

    const alternatives: Set<string> = new Set();
    const chars = plate.split('');

    // Positions 0-2 should be letters
    for (let i = 0; i < 3; i++) {
        if (chars[i] === '0') {
            const alt = [...chars];
            alt[i] = 'O';
            alternatives.add(alt.join(''));
        }
        if (chars[i] === '1') {
            const alt = [...chars];
            alt[i] = 'I';
            alternatives.add(alt.join(''));
        }
    }

    // Position 3 should be a number
    if (chars[3] === 'O') {
        const alt = [...chars];
        alt[3] = '0';
        alternatives.add(alt.join(''));
    }
    if (chars[3] === 'I') {
        const alt = [...chars];
        alt[3] = '1';
        alternatives.add(alt.join(''));
    }

    // Position 4: could be letter (mercosul) or number (antiga)
    // Position 5-6 should be numbers
    for (let i = 5; i < 7; i++) {
        if (chars[i] === 'O') {
            const alt = [...chars];
            alt[i] = '0';
            alternatives.add(alt.join(''));
        }
        if (chars[i] === 'I') {
            const alt = [...chars];
            alt[i] = '1';
            alternatives.add(alt.join(''));
        }
    }

    // Remove the original plate from alternatives
    alternatives.delete(plate);

    return Array.from(alternatives);
}

export const plateOcrService = {
    pickImageFromCamera,
    pickImageFromGallery,
    recognizePlate,
    getConfidenceLevel,
    suggestAlternatives,
};
