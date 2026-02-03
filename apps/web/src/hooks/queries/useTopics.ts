// useTopics Hook
// React Query hooks for forum topics

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/api/config';
import { topicService } from '@/services';
import { Topic, Comment } from '@/types';
import { TopicFilters, PaginatedResponse, CreateTopicDTO, CreateCommentDTO } from '@/types/api.types';

/**
 * Get paginated topics with filters
 */
export function useTopics(filters?: TopicFilters) {
    return useQuery<PaginatedResponse<Topic>>({
        queryKey: [...QUERY_KEYS.topics.all, filters],
        queryFn: () => topicService.getAll(filters),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Get a single topic by ID
 */
export function useTopic(id: string) {
    return useQuery<Topic | undefined>({
        queryKey: QUERY_KEYS.topics.detail(id),
        queryFn: () => topicService.getById(id),
        enabled: !!id,
        retry: (failureCount, error) => {
            // Don't retry on 404
            if ((error as { status?: number })?.status === 404) return false;
            return failureCount < 3;
        },
    });
}

/**
 * Get comments for a topic
 */
export function useTopicComments(topicId: string) {
    return useQuery<PaginatedResponse<Comment>>({
        queryKey: QUERY_KEYS.topics.comments(topicId),
        queryFn: () => topicService.getComments(topicId),
        enabled: !!topicId,
    });
}

/**
 * Create a new topic
 */
export function useCreateTopic() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateTopicDTO) => topicService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.topics.all });
        },
    });
}

/**
 * Like/unlike a topic
 */
export function useLikeTopic() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id }: { id: string; liked: boolean }) => {
            return topicService.toggleLike(id);
        },
        onSuccess: (result, { id }) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.topics.all });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.topics.detail(id) });
        },
    });
}

/**
 * Add a comment to a topic
 */
export function useAddComment(topicId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCommentDTO) => topicService.addComment(topicId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.topics.comments(topicId) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.topics.detail(topicId) });
        },
    });
}

/**
 * Like/unlike a comment with optimistic updates
 */
export function useLikeComment(topicId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        // Optimistic update for instant UI feedback
        onMutate: async ({ commentId, liked }: { commentId: string; liked: boolean }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.topics.comments(topicId) });

            // Snapshot previous state for rollback
            const previousComments = queryClient.getQueryData<PaginatedResponse<Comment>>(
                QUERY_KEYS.topics.comments(topicId)
            );

            // Optimistically update comment in cache
            queryClient.setQueryData<PaginatedResponse<Comment>>(
                QUERY_KEYS.topics.comments(topicId),
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: updateCommentLikeInTree(old.data, commentId, !liked),
                    };
                }
            );

            return { previousComments };
        },

        mutationFn: async ({ commentId }: { commentId: string; liked: boolean }) => {
            return topicService.toggleCommentLike(commentId);
        },

        // Rollback on error
        onError: (_err, _variables, context) => {
            if (context?.previousComments) {
                queryClient.setQueryData(
                    QUERY_KEYS.topics.comments(topicId),
                    context.previousComments
                );
            }
        },

        // Refetch to sync with server
        onSettled: () => {
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.topics.comments(topicId) });
            }, 500);
        },
    });
}

/**
 * Helper to update like state in nested comment tree
 */
function updateCommentLikeInTree(
    comments: Comment[],
    commentId: string,
    newLiked: boolean
): Comment[] {
    return comments.map((comment) => {
        if (comment.id === commentId) {
            return {
                ...comment,
                liked: newLiked,
                likesCount: newLiked
                    ? (comment.likesCount ?? 0) + 1
                    : Math.max(0, (comment.likesCount ?? 0) - 1),
            };
        }
        // Recursively update nested replies
        if (comment.replies && comment.replies.length > 0) {
            return {
                ...comment,
                replies: updateCommentLikeInTree(comment.replies, commentId, newLiked),
            };
        }
        return comment;
    });
}
