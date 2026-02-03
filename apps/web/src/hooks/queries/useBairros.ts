// useBairros Hook
// React Query hook for neighborhoods with infinite cache

import { useQuery } from '@tanstack/react-query';
import { bairroService } from '@/services';
import { Bairro } from '@/types';
import bairrosLocal from '@/constants/bairros';

// Query keys for bairros
const BAIRROS_KEY = ['bairros'] as const;
const BAIRRO_KEY = (id: string) => ['bairros', id] as const;

/**
 * Get all bairros (neighborhoods)
 * Uses infinite cache since bairros rarely change
 * Falls back to local constants if API fails
 */
export function useBairros() {
    return useQuery<Bairro[]>({
        queryKey: BAIRROS_KEY,
        queryFn: async () => {
            try {
                const data = await bairroService.getAll();
                return data;
            } catch {
                // Fallback to local constants
                console.log('[useBairros] API failed, using local cache');
                return bairrosLocal;
            }
        },
        // Bairros are static data - cache forever
        staleTime: Infinity,
        gcTime: Infinity,
        // Start with local data for instant display
        placeholderData: bairrosLocal,
    });
}

/**
 * Get a single bairro by ID
 */
export function useBairro(id: string) {
    const { data: bairros = bairrosLocal } = useBairros();

    return useQuery<Bairro | undefined>({
        queryKey: BAIRRO_KEY(id),
        queryFn: () => {
            const found = bairros.find((b: Bairro) => b.id === id);
            if (found) return found;
            // Fallback to local
            return bairrosLocal.find(b => b.id === id);
        },
        enabled: !!id,
        staleTime: Infinity,
    });
}

/**
 * Helper to get bairro name by ID (synchronous)
 */
export function useBairroName(bairroId: string | undefined): string {
    const { data: bairros = bairrosLocal } = useBairros();

    if (!bairroId) return 'Tijucas';

    const bairro = (bairros as Bairro[]).find(b => b.id === bairroId);
    return bairro?.nome || bairrosLocal.find(b => b.id === bairroId)?.nome || 'Tijucas';
}
