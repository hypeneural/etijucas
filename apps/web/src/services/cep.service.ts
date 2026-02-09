// CEP Lookup Service
// Uses internal API endpoint that handles ViaCEP + bairro matching

import { apiClient, ApiError } from '@/api/client';
import type { CepLookupResponse, BairroOption } from '@/types/auth.types';

/**
 * Validates CEP format (8 digits)
 */
export function validateCEP(cep: string): boolean {
    const cleanCEP = cep.replace(/\D/g, '');
    return /^\d{8}$/.test(cleanCEP);
}

/**
 * Formats CEP with hyphen: 99999-999
 */
export function formatCEP(cep: string): string {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length <= 5) return cleanCEP;
    return `${cleanCEP.slice(0, 5)}-${cleanCEP.slice(5, 8)}`;
}

/**
 * Cleans CEP removing non-numeric characters
 */
export function cleanCEP(cep: string): string {
    return cep.replace(/\D/g, '');
}

export const cepService = {
    /**
     * Lookup address by CEP using internal API
     * Returns address data + bairro matching info
     * 
     * @param cep - CEP with 8 digits (with or without hyphen)
     * @returns CepLookupResponse with address, match, and ui_hints
     */
    async lookup(cep: string): Promise<CepLookupResponse> {
        const cleanedCEP = cleanCEP(cep);

        // Validate format
        if (!validateCEP(cleanedCEP)) {
            return {
                success: false,
                error: 'CEP inválido',
                message: 'O CEP deve ter 8 dígitos.',
            };
        }

        try {
            // Uses apiClient to automatically include X-City header
            const data = await apiClient.get<CepLookupResponse>(`/cep/${cleanedCEP}`);
            return data;
        } catch (error) {
            if (error instanceof ApiError) {
                return {
                    success: false,
                    error: error.code || 'API_ERROR',
                    message: error.message,
                };
            }
            return {
                success: false,
                error: 'Erro de conexão',
                message: 'Não foi possível consultar o CEP. Tente novamente.',
            };
        }
    },

    /**
     * Get available bairros for the current city (tenant)
     */
    async getBairros(): Promise<BairroOption[]> {
        try {
            // Uses apiClient to automatically include X-City header
            const data = await apiClient.get<{ data: BairroOption[] }>('/bairros');
            return data.data || [];
        } catch {
            return [];
        }
    },
};

// Legacy exports for backward compatibility
export { validateCEP as isValidCep };
export default cepService;

