// ViaCEP Service
// Integrates with Brazilian postal code API

import type { ViaCEPResponse } from '@/types/auth.types';

const VIACEP_BASE_URL = 'https://viacep.com.br/ws';

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

export const viacepService = {
    /**
     * Fetch address by CEP
     * @param cep - CEP with 8 digits (with or without hyphen)
     * @returns Address data or throws error
     */
    async fetchByCEP(cep: string): Promise<ViaCEPResponse> {
        const cleanedCEP = cleanCEP(cep);

        // Validate format
        if (!validateCEP(cleanedCEP)) {
            throw new Error('CEP inválido. O CEP deve ter 8 dígitos.');
        }

        try {
            const response = await fetch(`${VIACEP_BASE_URL}/${cleanedCEP}/json/`);

            // Handle HTTP errors
            if (!response.ok) {
                if (response.status === 400) {
                    throw new Error('Formato de CEP inválido.');
                }
                throw new Error('Erro ao consultar o CEP. Tente novamente.');
            }

            const data: ViaCEPResponse = await response.json();

            // ViaCEP returns { erro: true } for non-existent CEPs
            if (data.erro) {
                throw new Error('CEP não encontrado. Verifique e tente novamente.');
            }

            return data;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Erro de conexão ao consultar o CEP.');
        }
    },
};

export default viacepService;
