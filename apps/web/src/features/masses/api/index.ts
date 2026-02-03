/**
 * Masses API Hooks
 */

import { useQuery } from '@tanstack/react-query';

export const massesKeys = {
    all: ['masses'] as const,
    list: () => [...massesKeys.all, 'list'] as const,
    churches: () => [...massesKeys.all, 'churches'] as const,
};

export function useMassesQuery() {
    return useQuery({
        queryKey: massesKeys.list(),
        staleTime: 24 * 60 * 60 * 1000, // 24h
        queryFn: async () => {
            throw new Error('TODO: Integrate with @repo/sdk');
        },
    });
}
