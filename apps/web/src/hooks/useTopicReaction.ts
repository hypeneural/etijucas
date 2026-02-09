/**
 * useTopicReaction
 * 
 * Hook for handling topic reactions (confirm/support) with optimistic updates.
 * Mobile-first with haptic feedback support.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { ENDPOINTS, QUERY_KEYS } from '@/api/config';
import { useHaptic } from '@/hooks/useHaptic';
import { useAuthStore } from '@/store/useAuthStore';
import { Topic } from '@/types';
import { TopicReactionType, TopicReactionResponse } from '@/types/api.types';

interface UseTopicReactionOptions {
    onSuccess?: (response: TopicReactionResponse) => void;
    onError?: (error: Error) => void;
}

export function useTopicReaction(topicId: string, options?: UseTopicReactionOptions) {
    const queryClient = useQueryClient();
    const haptic = useHaptic();
    const { isAuthenticated } = useAuthStore();

    const mutation = useMutation({
        mutationFn: async (type: TopicReactionType): Promise<TopicReactionResponse> => {
            const response = await apiClient.post<TopicReactionResponse>(
                ENDPOINTS.forum.react(topicId),
                { type }
            );
            return response;
        },

        onMutate: async (type: TopicReactionType) => {
            // Haptic feedback for instant response feel
            haptic.light();

            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.topics.detail(topicId) });
            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.topics.all });

            // Snapshot the previous value
            const previousTopic = queryClient.getQueryData<Topic>(QUERY_KEYS.topics.detail(topicId));

            // Optimistically update topic detail
            if (previousTopic) {
                const isCurrentlyReacted = type === 'confirm'
                    ? previousTopic.confirmed
                    : previousTopic.supported;

                const updateKey = type === 'confirm' ? 'confirmed' : 'supported';
                const countKey = type === 'confirm' ? 'confirmsCount' : 'supportsCount';

                queryClient.setQueryData<Topic>(QUERY_KEYS.topics.detail(topicId), {
                    ...previousTopic,
                    [updateKey]: !isCurrentlyReacted,
                    [countKey]: isCurrentlyReacted
                        ? (previousTopic[countKey] || 1) - 1
                        : (previousTopic[countKey] || 0) + 1,
                });
            }

            // Also update in list cache
            queryClient.setQueriesData<{ data: Topic[] }>(
                { queryKey: QUERY_KEYS.topics.all },
                (old) => {
                    if (!old?.data) return old;
                    return {
                        ...old,
                        data: old.data.map((topic) => {
                            if (topic.id !== topicId) return topic;

                            const isCurrentlyReacted = type === 'confirm'
                                ? topic.confirmed
                                : topic.supported;

                            const updateKey = type === 'confirm' ? 'confirmed' : 'supported';
                            const countKey = type === 'confirm' ? 'confirmsCount' : 'supportsCount';

                            return {
                                ...topic,
                                [updateKey]: !isCurrentlyReacted,
                                [countKey]: isCurrentlyReacted
                                    ? (topic[countKey] || 1) - 1
                                    : (topic[countKey] || 0) + 1,
                            };
                        }),
                    };
                }
            );

            return { previousTopic };
        },

        onError: (_err, _type, context) => {
            // Rollback on error
            haptic.error();

            if (context?.previousTopic) {
                queryClient.setQueryData(
                    QUERY_KEYS.topics.detail(topicId),
                    context.previousTopic
                );
            }

            options?.onError?.(_err as Error);
        },

        onSuccess: (response) => {
            haptic.success();
            options?.onSuccess?.(response);
        },

        onSettled: () => {
            // Background refresh to sync with server
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.topics.detail(topicId) });
            }, 500);
        },
    });

    const toggleReaction = (type: TopicReactionType) => {
        if (!isAuthenticated) {
            return { requiresAuth: true };
        }
        mutation.mutate(type);
        return { requiresAuth: false };
    };

    return {
        toggleReaction,
        confirm: () => toggleReaction('confirm'),
        support: () => toggleReaction('support'),
        isLoading: mutation.isPending,
        isConfirmLoading: mutation.isPending && mutation.variables === 'confirm',
        isSupportLoading: mutation.isPending && mutation.variables === 'support',
    };
}

export default useTopicReaction;
