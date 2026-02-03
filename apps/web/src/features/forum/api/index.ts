/**
 * Forum API Hooks
 * 
 * Hooks de React Query para o fórum.
 * Usa @repo/sdk para chamadas tipadas.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createApiClient, type Topic, type TopicFilters } from '@repo/sdk';

// Query keys padronizados
export const forumKeys = {
    all: ['forum'] as const,
    topics: () => [...forumKeys.all, 'topics'] as const,
    topicsList: (filters?: TopicFilters) => [...forumKeys.topics(), 'list', filters] as const,
    topicDetail: (id: string) => [...forumKeys.topics(), 'detail', id] as const,
    saved: () => [...forumKeys.all, 'saved'] as const,
};

// Hook: Lista de tópicos
export function useForumTopicsQuery(filters?: TopicFilters) {
    // TODO: Inject api client from context
    // const api = useApiClient();

    return useQuery({
        queryKey: forumKeys.topicsList(filters),
        queryFn: async () => {
            // Placeholder - integrar com SDK
            // return api.forum.topics.list(filters);
            throw new Error('TODO: Integrate with @repo/sdk');
        },
    });
}

// Hook: Detalhe de tópico
export function useForumTopicQuery(id: string) {
    return useQuery({
        queryKey: forumKeys.topicDetail(id),
        queryFn: async () => {
            throw new Error('TODO: Integrate with @repo/sdk');
        },
        enabled: !!id,
    });
}

// Hook: Criar tópico
export function useCreateTopicMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { title: string; content: string; category: string }) => {
            throw new Error('TODO: Integrate with @repo/sdk');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: forumKeys.topics() });
        },
    });
}

// Hook: Like em tópico
export function useToggleTopicLikeMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (topicId: string) => {
            throw new Error('TODO: Integrate with @repo/sdk');
        },
        onSuccess: (_, topicId) => {
            queryClient.invalidateQueries({ queryKey: forumKeys.topicDetail(topicId) });
        },
    });
}
