/**
 * Reports API Hooks
 * 
 * Suporta offline sync com idempotency keys.
 * @see OFFLINE_SYNC.md
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';

export const reportsKeys = {
    all: ['reports'] as const,
    myReports: () => [...reportsKeys.all, 'my'] as const,
};

export function useCreateReportMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            title: string;
            description: string;
            categoryId: string;
            bairroId: string;
            location?: string;
            images?: { base64: string; filename: string }[];
        }) => {
            // Gera idempotency key para suportar offline sync
            const idempotencyKey = uuidv4();

            // TODO: Usar SDK com idempotency key
            // return api.reports.create(data, idempotencyKey);
            throw new Error('TODO: Integrate with @repo/sdk');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reportsKeys.myReports() });
        },
    });
}

export function useMyReportsQuery() {
    return {
        // TODO: Implement
    };
}
