/**
 * Bairros de Tijucas - Dados da API
 * 
 * Cache local dos bairros do backend.
 * Sincronizado via useBairros() hook.
 */

import { Bairro } from '@/types';

// UUIDs reais do backend - GET /api/v1/bairros
export const bairros: Bairro[] = [
    { id: '019c04f9-345b-70e7-b2a9-61153f311c85', nome: 'Andorinha', slug: 'andorinha' },
    { id: '019c04f9-33cf-7241-807b-9a4ba4dc7ed7', nome: 'Canto da Praia', slug: 'canto-da-praia' },
    { id: '019c04f9-3517-73da-9d16-84b9a6674a55', nome: 'Casa Branca', slug: 'casa-branca' },
    { id: '019c04f9-3344-720a-ae20-db969ef59656', nome: 'Centro', slug: 'centro' },
    { id: '019c04f9-348d-732d-a4d8-4039e78f5f8d', nome: 'Ilhota', slug: 'ilhota' },
    { id: '019c04f9-33fc-7087-92ac-2691f5fe70d3', nome: 'Jardim Praia Mar', slug: 'jardim-praia-mar' },
    { id: '019c04f9-3370-70c7-b7c7-3246e94a4212', nome: 'Meia Praia', slug: 'meia-praia' },
    { id: '019c04f9-33a1-7122-8e28-024c8bb7f799', nome: 'Morretes', slug: 'morretes' },
    { id: '019c04f9-3546-7208-84b2-3323d9141c23', nome: 'Morro do Boi', slug: 'morro-do-boi' },
    { id: '019c04f9-34e8-730c-b09d-2dc2bf97c928', nome: 'Sertãozinho', slug: 'sertaozinho' },
    { id: '019c04f9-342e-7006-9743-552a487bc4d9', nome: 'Tabuleiro', slug: 'tabuleiro' },
    { id: '019c04f9-34b9-71a0-b902-abccb55c24e5', nome: 'Várzea', slug: 'varzea' },
];

/**
 * Get bairro name by ID
 */
export function getBairroName(bairroId: string): string {
    return bairros.find(b => b.id === bairroId)?.nome || 'Tijucas';
}

/**
 * Get bairro by ID
 */
export function getBairroById(bairroId: string): Bairro | undefined {
    return bairros.find(b => b.id === bairroId);
}

/**
 * Get bairro by slug
 */
export function getBairroBySlug(slug: string): Bairro | undefined {
    return bairros.find(b => b.slug === slug);
}

/**
 * Check if a string is a valid bairro UUID
 */
export function isValidBairroId(id: string): boolean {
    return bairros.some(b => b.id === id);
}

export default bairros;
