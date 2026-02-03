/**
 * Tourism API Hooks
 */

import { useQuery } from '@tanstack/react-query';

export const tourismKeys = {
    all: ['tourism'] as const,
    list: () => [...tourismKeys.all, 'list'] as const,
    detail: (id: string) => [...tourismKeys.all, 'detail', id] as const,
};

export function useTourismListQuery() {
    return useQuery({
        queryKey: tourismKeys.list(),
        staleTime: 24 * 60 * 60 * 1000, // 24h - dados estáticos
        queryFn: async () => {
            throw new Error('TODO: Integrate with @repo/sdk');
        },
    });
}
