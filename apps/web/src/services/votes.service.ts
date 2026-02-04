/**
 * Votes Service - Votação da Câmara
 * API integration for city council voting transparency
 */

import { apiClient } from '@/api/client';
import { ENDPOINTS } from '@/api/config';
import type {
    VereadorList,
    VereadorFull,
    VotacaoList,
    VotacaoFull,
    VotacoesStats,
    Partido,
    Legislatura,
    VereadoresFilters,
    VotacoesFilters,
} from '@/types/votes';

// ==========================================
// API Response Types
// ==========================================

interface PaginatedResponse<T> {
    data: T[];
    links?: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
    meta?: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
    };
}

interface SingleResponse<T> {
    success: boolean;
    data: T;
}

// ==========================================
// Vereadores Service
// ==========================================

export const vereadoresService = {
    /**
     * Get list of councilors
     */
    async getAll(filters?: VereadoresFilters): Promise<VereadorList[]> {
        const params = new URLSearchParams();

        if (filters?.legislaturaAtual !== undefined) {
            params.set('legislatura_atual', filters.legislaturaAtual.toString());
        }
        if (filters?.partido) {
            params.set('partido', filters.partido);
        }
        if (filters?.search) {
            params.set('search', filters.search);
        }

        const queryString = params.toString();
        const url = queryString
            ? `${ENDPOINTS.votes.vereadores}?${queryString}`
            : ENDPOINTS.votes.vereadores;

        const response = await apiClient.get<PaginatedResponse<VereadorList>>(url);
        return response.data;
    },

    /**
     * Get councilor details by slug
     */
    async getBySlug(slug: string): Promise<VereadorFull> {
        const response = await apiClient.get<SingleResponse<VereadorFull>>(
            ENDPOINTS.votes.vereador(slug)
        );
        return response.data;
    },

    /**
     * Get councilor's voting history with their votes
     */
    async getVotacoes(slug: string): Promise<VotacaoList[]> {
        const response = await apiClient.get<SingleResponse<VotacaoList[]>>(
            ENDPOINTS.votes.vereadorVotacoes(slug)
        );
        return response.data;
    },
};

// ==========================================
// Votações Service
// ==========================================

export const votacoesService = {
    /**
     * Get list of voting sessions with filters
     */
    async getAll(filters?: VotacoesFilters): Promise<{
        data: VotacaoList[];
        meta?: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    }> {
        const params = new URLSearchParams();

        if (filters?.status) {
            const statusValue = Array.isArray(filters.status)
                ? filters.status.join(',')
                : filters.status;
            params.set('status', statusValue);
        }
        if (filters?.ano) {
            params.set('ano', filters.ano.toString());
        }
        if (filters?.tipo) {
            params.set('tipo', filters.tipo);
        }
        if (filters?.vereador) {
            params.set('vereador', filters.vereador);
        }
        if (filters?.partido) {
            params.set('partido', filters.partido);
        }
        if (filters?.search) {
            params.set('search', filters.search);
        }
        if (filters?.perPage) {
            params.set('per_page', filters.perPage.toString());
        }
        if (filters?.page) {
            params.set('page', filters.page.toString());
        }

        const queryString = params.toString();
        const url = queryString
            ? `${ENDPOINTS.votes.votacoes}?${queryString}`
            : ENDPOINTS.votes.votacoes;

        const response = await apiClient.get<PaginatedResponse<VotacaoList>>(url);
        return response;
    },

    /**
     * Get voting session details by ID
     */
    async getById(id: string): Promise<VotacaoFull> {
        const response = await apiClient.get<SingleResponse<VotacaoFull>>(
            ENDPOINTS.votes.votacao(id)
        );
        return response.data;
    },

    /**
     * Get voting statistics
     */
    async getStats(): Promise<VotacoesStats> {
        const response = await apiClient.get<SingleResponse<VotacoesStats>>(
            ENDPOINTS.votes.votacoesStats
        );
        return response.data;
    },

    /**
     * Get available years for filtering
     */
    async getAnos(): Promise<number[]> {
        const response = await apiClient.get<SingleResponse<number[]>>(
            ENDPOINTS.votes.votacoesAnos
        );
        return response.data;
    },

    /**
     * Toggle reaction (like/dislike) on a voting session
     */
    async toggleReaction(id: string, reaction: 'like' | 'dislike'): Promise<{
        success: boolean;
        action: 'added' | 'removed' | 'changed';
        user_reaction: 'like' | 'dislike' | null;
        likes_count: number;
        dislikes_count: number;
    }> {
        const response = await apiClient.post<{
            success: boolean;
            action: 'added' | 'removed' | 'changed';
            user_reaction: 'like' | 'dislike' | null;
            likes_count: number;
            dislikes_count: number;
        }>(`/votacoes/${id}/reaction`, { reaction });
        return response;
    },
};

// ==========================================
// Reference Data Service
// ==========================================

export const votesReferenceService = {
    /**
     * Get all political parties
     */
    async getPartidos(): Promise<Partido[]> {
        const response = await apiClient.get<PaginatedResponse<Partido>>(ENDPOINTS.votes.partidos);
        return response.data;
    },

    /**
     * Get all legislative terms
     */
    async getLegislaturas(): Promise<Legislatura[]> {
        const response = await apiClient.get<PaginatedResponse<Legislatura>>(ENDPOINTS.votes.legislaturas);
        return response.data;
    },
};

// ==========================================
// Combined Export
// ==========================================

export const votesService = {
    vereadores: vereadoresService,
    votacoes: votacoesService,
    reference: votesReferenceService,
};

export default votesService;
