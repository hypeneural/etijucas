/**
 * Auth API Hooks
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

export const authKeys = {
    user: ['auth', 'user'] as const,
};

export function useLoginMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ email, password }: { email: string; password: string }) => {
            throw new Error('TODO: Integrate with @repo/sdk');
        },
        onSuccess: (data) => {
            // Store token and update user query
            queryClient.setQueryData(authKeys.user, data.user);
        },
    });
}

export function useLogoutMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            throw new Error('TODO: Integrate with @repo/sdk');
        },
        onSuccess: () => {
            queryClient.clear();
        },
    });
}

export function useRegisterMutation() {
    return useMutation({
        mutationFn: async (data: {
            name: string;
            email: string;
            password: string;
            password_confirmation: string;
            phone: string;
        }) => {
            throw new Error('TODO: Integrate with @repo/sdk');
        },
    });
}
