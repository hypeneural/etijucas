/**
 * useOfflineTopics - Hybrid Offline-First Hook for Forum Topics
 * 
 * Strategy:
 * 1. Read from IndexedDB first (instant, cached)
 * 2. Fetch from API in background (when online)
 * 3. Update IndexedDB with fresh data
 * 4. Mutations go to sync queue when offline
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { topicsDB, syncQueueDB } from '@/lib/localDatabase';
import { topicService } from '@/services';
import { Topic, Comment, TopicCategory } from '@/types';
import { useNetworkStatus } from './useNetworkStatus';
import { toast } from 'sonner';

// Query keys
const TOPICS_KEY = ['offline', 'topics'] as const;
const TOPIC_KEY = (id: string) => ['offline', 'topics', id] as const;

interface UseOfflineTopicsOptions {
    categoria?: TopicCategory | 'all';
    search?: string;
}

/**
 * Get all topics with offline-first strategy
 */
export function useOfflineTopics(options?: UseOfflineTopicsOptions) {
    const { isOnline } = useNetworkStatus();
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: [...TOPICS_KEY, options],
        queryFn: async () => {
            // 1. Always start with IndexedDB cache (instant)
            let topics = await topicsDB.getAll();

            // 2. If online, try to fetch fresh data
            if (isOnline) {
                try {
                    const response = await topicService.getAll({
                        categoria: options?.categoria !== 'all' ? options?.categoria : undefined,
                        search: options?.search,
                    });

                    // Update IndexedDB with fresh data
                    if (response.data && response.data.length > 0) {
                        await topicsDB.saveMany(response.data);
                        topics = response.data;
                    }
                } catch (error) {
                    console.warn('[useOfflineTopics] API failed, using cache:', error);
                    // Continue with cached data
                }
            }

            // 3. Apply local filters
            if (options?.categoria && options.categoria !== 'all') {
                topics = topics.filter(t => t.categoria === options.categoria);
            }

            if (options?.search) {
                const searchLower = options.search.toLowerCase();
                topics = topics.filter(t =>
                    t.titulo.toLowerCase().includes(searchLower) ||
                    t.texto.toLowerCase().includes(searchLower)
                );
            }

            // 4. Sort by date (newest first)
            return topics.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });

    // Refetch when coming back online
    useEffect(() => {
        if (isOnline) {
            queryClient.invalidateQueries({ queryKey: TOPICS_KEY });
        }
    }, [isOnline, queryClient]);

    return query;
}

/**
 * Get single topic by ID with offline support
 */
export function useOfflineTopic(id: string) {
    const { isOnline } = useNetworkStatus();

    return useQuery({
        queryKey: TOPIC_KEY(id),
        queryFn: async () => {
            // Try IndexedDB first
            let topic = await topicsDB.getById(id);

            // If online, try API
            if (isOnline) {
                try {
                    const fresh = await topicService.getById(id);
                    if (fresh) {
                        await topicsDB.save(fresh);
                        topic = fresh;
                    }
                } catch (error) {
                    console.warn('[useOfflineTopic] API failed, using cache');
                }
            }

            return topic;
        },
        enabled: !!id,
    });
}

/**
 * Create a new topic with offline support
 */
export function useCreateOfflineTopic() {
    const queryClient = useQueryClient();
    const { isOnline } = useNetworkStatus();

    return useMutation({
        mutationFn: async (data: {
            titulo: string;
            texto: string;
            categoria: TopicCategory;
            bairroId: string;
            fotoUrl?: string;
            isAnon?: boolean;
        }) => {
            // Bairros now use real UUIDs from API, no conversion needed
            console.log('[useCreateOfflineTopic] Creating topic, online:', isOnline, 'bairroId:', data.bairroId);

            if (!isOnline) {
                // Offline: create locally and queue for sync
                const optimisticTopic: Topic = {
                    id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    titulo: data.titulo,
                    texto: data.texto,
                    categoria: data.categoria,
                    bairroId: data.bairroId,
                    fotoUrl: data.fotoUrl,
                    isAnon: data.isAnon ?? false,
                    autorNome: data.isAnon ? 'Anônimo' : 'Você',
                    likesCount: 0,
                    commentsCount: 0,
                    liked: false,
                    createdAt: new Date(),
                };

                await topicsDB.save(optimisticTopic);
                await syncQueueDB.add({
                    type: 'topic',
                    data: data,
                    idempotencyKey: `topic-${optimisticTopic.id}`,
                });

                toast.info('📴 Tópico salvo offline. Será enviado quando voltar online.');
                return optimisticTopic;
            }

            // Online: call service directly (it handles logging and local backup)
            try {
                const created = await topicService.create(data);
                toast.success('✅ Tópico publicado com sucesso!');
                return created;
            } catch (error) {
                // Don't save locally on API error - let the mutation fail cleanly
                const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
                console.error('[useCreateOfflineTopic] Failed:', errorMessage);
                toast.error(`❌ Falha ao publicar: ${errorMessage}`);
                throw error; // Let the UI handle the error properly
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TOPICS_KEY });
        },
    });
}

/**
 * Like/unlike a topic with offline support
 */
export function useLikeOfflineTopic() {
    const queryClient = useQueryClient();
    const { isOnline } = useNetworkStatus();

    return useMutation({
        // Optimistic update BEFORE the mutation runs (instant UI feedback)
        onMutate: async ({ id, currentlyLiked }: { id: string; currentlyLiked: boolean }) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: TOPICS_KEY });

            // Snapshot previous value for rollback
            const previousTopics = queryClient.getQueryData<Topic[]>(TOPICS_KEY);

            // Optimistically update the cache immediately
            queryClient.setQueryData<Topic[]>(TOPICS_KEY, (old) => {
                if (!old) return old;
                return old.map(topic => {
                    if (topic.id === id) {
                        return {
                            ...topic,
                            liked: !currentlyLiked,
                            likesCount: currentlyLiked
                                ? Math.max(0, topic.likesCount - 1)
                                : topic.likesCount + 1,
                        };
                    }
                    return topic;
                });
            });

            // Also update IndexedDB for persistence
            const topic = await topicsDB.getById(id);
            if (topic) {
                const updated = {
                    ...topic,
                    liked: !currentlyLiked,
                    likesCount: currentlyLiked ? Math.max(0, topic.likesCount - 1) : topic.likesCount + 1,
                };
                await topicsDB.save(updated);
            }

            // Return context with snapshot for rollback
            return { previousTopics, topicId: id };
        },

        mutationFn: async ({ id, currentlyLiked }: { id: string; currentlyLiked: boolean }) => {
            // Try API if online
            if (isOnline) {
                try {
                    const response = await topicService.toggleLike(id);
                    // Sync with server response
                    const topic = await topicsDB.getById(id);
                    if (topic) {
                        await topicsDB.save({
                            ...topic,
                            liked: response.liked,
                            likesCount: response.likesCount,
                        });
                    }
                    return { id, newLiked: response.liked, likesCount: response.likesCount };
                } catch (error) {
                    console.error('[useLikeOfflineTopic] API failed:', error);
                    // Add to sync queue for later
                    await syncQueueDB.add({
                        type: 'like',
                        data: { topicId: id },
                        idempotencyKey: `like-${id}-${Date.now()}`,
                    });
                }
            } else {
                // Offline - add to queue
                await syncQueueDB.add({
                    type: 'like',
                    data: { topicId: id },
                    idempotencyKey: `like-${id}-${Date.now()}`,
                });
            }

            return { id, newLiked: !currentlyLiked };
        },

        // On error, rollback to previous state
        onError: (_err, _variables, context) => {
            if (context?.previousTopics) {
                queryClient.setQueryData(TOPICS_KEY, context.previousTopics);
            }
        },

        // Always refetch after success or error to sync with server
        onSettled: () => {
            // Delay refetch slightly to avoid flickering
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: TOPICS_KEY });
            }, 500);
        },
    });
}

/**
 * Add comment with offline support
 */
export function useAddOfflineComment(topicId: string) {
    const queryClient = useQueryClient();
    const { isOnline } = useNetworkStatus();

    return useMutation({
        mutationFn: async (data: { texto: string; parentId?: string; isAnon?: boolean }) => {
            console.log('[useAddOfflineComment] Adding comment, online:', isOnline);

            const optimisticComment: Comment = {
                id: `temp-${Date.now()}`,
                topicId,
                texto: data.texto,
                parentId: data.parentId,
                autorNome: data.isAnon ? 'Anônimo' : 'Você',
                isAnon: data.isAnon ?? false,
                createdAt: new Date(),
            };

            if (!isOnline) {
                // Update topic comment count optimistically
                const topic = await topicsDB.getById(topicId);
                if (topic) {
                    await topicsDB.save({ ...topic, commentsCount: topic.commentsCount + 1 });
                }

                await syncQueueDB.add({
                    type: 'comment',
                    data: { topicId, ...data },
                    idempotencyKey: `comment-${optimisticComment.id}`,
                });
                toast.info('📴 Comentário salvo. Será enviado quando voltar online.');
                return optimisticComment;
            }

            // Online: call service directly
            try {
                const created = await topicService.addComment(topicId, data);
                toast.success('✅ Comentário publicado!');
                return created;
            } catch (error) {
                // Service already handled local backup
                const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
                console.error('[useAddOfflineComment] Failed:', errorMessage);
                toast.error(`❌ Falha ao comentar: ${errorMessage}. Salvo localmente.`);
                return optimisticComment;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TOPIC_KEY(topicId) });
            queryClient.invalidateQueries({ queryKey: TOPICS_KEY });
        },
    });
}

/**
 * Like/unlike a comment with optimistic updates
 */
export function useLikeComment(topicId: string) {
    const queryClient = useQueryClient();
    const { isOnline } = useNetworkStatus();

    return useMutation({
        // Optimistic update for instant feedback
        onMutate: async ({ commentId, currentlyLiked }: { commentId: string; currentlyLiked: boolean }) => {
            // Cancel any outgoing refetches
            const topicKey = TOPIC_KEY(topicId);
            await queryClient.cancelQueries({ queryKey: topicKey });

            // Store previous state for rollback
            const previousData = queryClient.getQueryData(topicKey);

            // Update UI immediately
            queryClient.setQueryData(topicKey, (old: Topic | undefined) => {
                if (!old) return old;
                // Note: Comments are fetched separately, but we can update local cache
                return old;
            });

            return { previousData, commentId };
        },

        mutationFn: async ({ commentId, currentlyLiked }: { commentId: string; currentlyLiked: boolean }) => {
            console.log('[useLikeComment] Liking comment:', commentId, 'online:', isOnline);

            if (isOnline) {
                try {
                    const response = await topicService.toggleCommentLike(commentId);
                    console.log('[useLikeComment] ✅ Success:', response);
                    return { commentId, liked: response.liked, likesCount: response.likesCount };
                } catch (error) {
                    console.error('[useLikeComment] ❌ Failed:', error);
                    // Queue for later sync
                    await syncQueueDB.add({
                        type: 'comment-like',
                        data: { commentId, topicId },
                        idempotencyKey: `comment-like-${commentId}-${Date.now()}`,
                    });
                    throw error;
                }
            } else {
                // Offline - queue for sync
                await syncQueueDB.add({
                    type: 'comment-like',
                    data: { commentId, topicId },
                    idempotencyKey: `comment-like-${commentId}-${Date.now()}`,
                });
                toast.info('📴 Like salvo. Será enviado quando voltar online.');
                return { commentId, liked: !currentlyLiked, likesCount: 0 };
            }
        },

        onError: (_err, _variables, context) => {
            // Rollback on error
            if (context?.previousData) {
                queryClient.setQueryData(TOPIC_KEY(topicId), context.previousData);
            }
        },

        onSettled: () => {
            // Refresh comments after like
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: TOPIC_KEY(topicId) });
            }, 300);
        },
    });
}

export default {
    useOfflineTopics,
    useOfflineTopic,
    useCreateOfflineTopic,
    useLikeOfflineTopic,
    useAddOfflineComment,
    useLikeComment,
};

