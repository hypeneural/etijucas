/**
 * Trash API Hooks
 */

import { useQuery } from '@tanstack/react-query';

export const trashKeys = {
    all: ['trash'] as const,
    schedules: () => [...trashKeys.all, 'schedules'] as const,
};

export function useTrashSchedulesQuery() {
    return useQuery({
        queryKey: trashKeys.schedules(),
        staleTime: 24 * 60 * 60 * 1000, // 24h - dados estáticos
        queryFn: async () => {
            throw new Error('TODO: Integrate with @repo/sdk');
        },
    });
}
