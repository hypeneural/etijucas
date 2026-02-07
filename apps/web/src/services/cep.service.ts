// CEP Lookup Service
// Uses internal API endpoint that handles ViaCEP + bairro matching

import type { CepLookupResponse, BairroOption } from '@/types/auth.types';

// Base API URL for backend (already includes /v1)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

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
            const response = await fetch(`${API_BASE_URL}/cep/${cleanedCEP}`);
            const data: CepLookupResponse = await response.json();
            return data;
        } catch {
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
            const response = await fetch(`${API_BASE_URL}/bairros`);
            const data = await response.json();
            return data.data || [];
        } catch {
            return [];
        }
    },
};

// Legacy exports for backward compatibility
export { validateCEP as isValidCep };
export default cepService;
