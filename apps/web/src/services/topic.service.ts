// ======================================================
// Topic Service - Forum API Integration
// Complete service for Boca no Trombone with offline-first support
// ======================================================

import { apiClient } from '@/api/client';
import { ENDPOINTS } from '@/api/config';
import { Topic, Comment } from '@/types';
import {
    TopicFilters,
    PaginatedResponse,
    CreateTopicDTO,
    UpdateTopicDTO,
    CreateCommentDTO,
    TopicLikeResponse,
    TopicSaveResponse,
    CommentLikeResponse,
    ReportDTO,
    ReportResponse,
    UploadResponse,
} from '@/types/api.types';
import { topicsDB, commentsDB, syncQueueDB } from '@/lib/localDatabase';

// Seed data for first load (dev only)
import { initialTopics as seedTopics } from '@/data/mockData';

// Helper to paginate data locally
function paginateData<T>(data: T[], page = 1, perPage = 10): PaginatedResponse<T> {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedData = data.slice(start, end);

    return {
        data: paginatedData,
        meta: {
            total: data.length,
            page,
            perPage,
            lastPage: Math.ceil(data.length / perPage),
            from: start + 1,
            to: Math.min(end, data.length),
        },
    };
}

/**
 * Normalize API response to extract the actual data
 * Handles multiple response formats: { data: T }, { topic: T }, { comment: T }, or T directly
 */
function normalizeResponse<T>(response: unknown, objectKey?: string): T {
    if (!response || typeof response !== 'object') {
        throw new Error(`Invalid API response: ${JSON.stringify(response)}`);
    }

    const res = response as Record<string, unknown>;

    // Try common wrappers
    if ('data' in res && res.data) return res.data as T;
    if (objectKey && objectKey in res && res[objectKey]) return res[objectKey] as T;
    if ('topic' in res && res.topic) return res.topic as T;
    if ('comment' in res && res.comment) return res.comment as T;

    // If response has 'id', it's likely the object itself
    if ('id' in res) return res as T;

    throw new Error(`Could not extract data from response: ${JSON.stringify(response)}`);
}

// Initialize on first import
let initialized = false;
async function ensureInitialized() {
    if (!initialized) {
        initialized = true;
        const cached = await topicsDB.getAll();
        if (cached.length === 0 && import.meta.env.DEV) {
            await topicsDB.saveMany(seedTopics);
            console.log('[TopicService] Initialized with seed data');
        }
    }
}

export const topicService = {
    // ==================== TOPICS ====================

    /**
     * Get paginated topics with optional filters
     */
    async getAll(filters?: TopicFilters): Promise<PaginatedResponse<Topic>> {
        await ensureInitialized();

        try {
            const response = await apiClient.get<PaginatedResponse<Topic>>(
                ENDPOINTS.forum.topics,
                filters as Record<string, string | number | boolean | undefined>
            );

            // Cache to IndexedDB
            if (response.data.length > 0) {
                await topicsDB.saveMany(response.data);
            }

            return response;
        } catch {
            // Fallback to IndexedDB
            let topics = await topicsDB.getAll();

            if (filters?.bairroId) {
                topics = topics.filter(t => t.bairroId === filters.bairroId);
            }
            if (filters?.categoria) {
                topics = topics.filter(t => t.categoria === filters.categoria);
            }
            if (filters?.search) {
                const search = filters.search.toLowerCase();
                topics = topics.filter(
                    t => t.titulo.toLowerCase().includes(search) ||
                        t.texto.toLowerCase().includes(search)
                );
            }
            if (filters?.comFoto) {
                topics = topics.filter(t => t.fotoUrl);
            }

            // Sort
            if (filters?.orderBy) {
                const order = filters.order === 'asc' ? 1 : -1;
                topics.sort((a, b) => {
                    if (filters.orderBy === 'createdAt') {
                        return order * (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    }
                    if (filters.orderBy === 'likesCount') {
                        return order * (b.likesCount - a.likesCount);
                    }
                    if (filters.orderBy === 'commentsCount') {
                        return order * (b.commentsCount - a.commentsCount);
                    }
                    return 0;
                });
            }

            return paginateData(topics, filters?.page, filters?.perPage);
        }
    },

    /**
     * Get a single topic by ID
     */
    async getById(id: string): Promise<Topic | undefined> {
        await ensureInitialized();

        try {
            const response = await apiClient.get<{ data: Topic }>(ENDPOINTS.forum.topic(id));
            await topicsDB.save(response.data);
            return response.data;
        } catch {
            return topicsDB.getById(id);
        }
    },

    /**
     * Create a new topic
     */
    async create(data: CreateTopicDTO): Promise<Topic> {
        await ensureInitialized();

        const idempotencyKey = `topic-${JSON.stringify(data)}-${Date.now()}`;

        try {
            console.log('[TopicService] Creating topic:', data);
            const response = await apiClient.post<unknown>(ENDPOINTS.forum.createTopic, data);
            console.log('[TopicService] API response:', response);

            const topic = normalizeResponse<Topic>(response, 'topic');
            console.log('[TopicService] ✅ Topic created successfully:', topic.id);

            await topicsDB.save(topic);
            return topic;
        } catch (error) {
            console.error('[TopicService] ❌ Failed to create topic:', error);

            // Create locally for offline support
            const newTopic: Topic = {
                ...data,
                id: `topic-local-${Date.now()}`,
                createdAt: new Date(),
                likesCount: 0,
                commentsCount: 0,
                liked: false,
                isSaved: false,
                isAnon: data.isAnon ?? false,
                syncStatus: 'pending',
            };

            await topicsDB.save(newTopic);

            // Queue for sync
            const exists = await syncQueueDB.exists(idempotencyKey);
            if (!exists) {
                await syncQueueDB.add({
                    type: 'topic',
                    data: { ...data, localId: newTopic.id },
                    idempotencyKey,
                });
            }

            // Rethrow to let caller know API failed
            throw error;
        }
    },

    /**
     * Update a topic (only within 24h window)
     */
    async update(id: string, data: UpdateTopicDTO): Promise<Topic> {
        const response = await apiClient.put<{ data: Topic }>(ENDPOINTS.forum.updateTopic(id), data);
        await topicsDB.save(response.data);
        return response.data;
    },

    /**
     * Delete a topic (soft delete)
     */
    async delete(id: string): Promise<void> {
        await apiClient.delete(ENDPOINTS.forum.deleteTopic(id));
        await topicsDB.delete(id);
    },

    /**
     * Toggle like on a topic
     */
    async toggleLike(id: string): Promise<TopicLikeResponse> {
        await ensureInitialized();

        const idempotencyKey = `like-${id}-${Date.now()}`;

        try {
            const response = await apiClient.post<TopicLikeResponse>(ENDPOINTS.forum.likeTopic(id));

            // Update local cache
            const topic = await topicsDB.getById(id);
            if (topic) {
                await topicsDB.update(id, {
                    liked: response.liked,
                    likesCount: response.likesCount,
                });
            }

            return response;
        } catch {
            // Optimistic update locally
            const topic = await topicsDB.getById(id);
            const newLiked = !topic?.liked;
            const newCount = (topic?.likesCount ?? 0) + (newLiked ? 1 : -1);

            if (topic) {
                await topicsDB.update(id, {
                    liked: newLiked,
                    likesCount: Math.max(0, newCount),
                });
            }

            // Queue for sync
            const exists = await syncQueueDB.exists(idempotencyKey);
            if (!exists) {
                await syncQueueDB.add({
                    type: 'like',
                    data: { topicId: id },
                    idempotencyKey,
                });
            }

            return { liked: newLiked, likesCount: Math.max(0, newCount) };
        }
    },

    /**
     * Toggle save/bookmark on a topic
     */
    async toggleSave(id: string): Promise<TopicSaveResponse> {
        const response = await apiClient.post<TopicSaveResponse>(ENDPOINTS.forum.saveTopic(id));

        // Update local cache
        const topic = await topicsDB.getById(id);
        if (topic) {
            await topicsDB.update(id, { isSaved: response.saved });
        }

        return response;
    },

    /**
     * Get saved topics
     */
    async getSaved(filters?: TopicFilters): Promise<PaginatedResponse<Topic>> {
        return apiClient.get<PaginatedResponse<Topic>>(
            ENDPOINTS.forum.savedTopics,
            filters as Record<string, string | number | boolean | undefined>
        );
    },

    /**
     * Report a topic
     */
    async report(id: string, data: ReportDTO): Promise<ReportResponse> {
        return apiClient.post<ReportResponse>(ENDPOINTS.forum.reportTopic(id), data);
    },

    // ==================== COMMENTS ====================

    /**
     * Get comments for a topic (with nested replies)
     */
    async getComments(topicId: string, filters?: {
        page?: number;
        perPage?: number;
        orderBy?: 'createdAt' | 'likesCount';
        order?: 'asc' | 'desc';
    }): Promise<PaginatedResponse<Comment>> {
        try {
            const response = await apiClient.get<PaginatedResponse<Comment>>(
                ENDPOINTS.forum.comments(topicId),
                filters as Record<string, string | number | boolean | undefined>
            );

            // Cache flat comments
            for (const comment of response.data) {
                await commentsDB.save(comment);
            }

            return response;
        } catch {
            // Fallback to local
            const comments = await commentsDB.getByTopicId(topicId);
            return paginateData(comments, filters?.page, filters?.perPage);
        }
    },

    /**
     * Add a comment to a topic
     */
    async addComment(topicId: string, data: CreateCommentDTO): Promise<Comment> {
        const idempotencyKey = `comment-${topicId}-${JSON.stringify(data)}-${Date.now()}`;

        try {
            console.log('[TopicService] Adding comment to topic:', topicId, data);
            const response = await apiClient.post<unknown>(
                ENDPOINTS.forum.comments(topicId),
                data
            );
            console.log('[TopicService] Comment API response:', response);

            const comment = normalizeResponse<Comment>(response, 'comment');
            console.log('[TopicService] ✅ Comment added successfully:', comment.id);

            await commentsDB.save(comment);

            // Increment comment count
            const topic = await topicsDB.getById(topicId);
            if (topic) {
                await topicsDB.update(topicId, { commentsCount: topic.commentsCount + 1 });
            }

            return comment;
        } catch (error) {
            console.error('[TopicService] ❌ Failed to add comment:', error);

            // Create locally for offline support
            const newComment: Comment = {
                id: `comment-local-${Date.now()}`,
                topicId,
                parentId: data.parentId,
                texto: data.texto,
                imageUrl: data.imageUrl,
                isAnon: data.isAnon ?? false,
                likesCount: 0,
                liked: false,
                depth: data.parentId ? 1 : 0,
                createdAt: new Date(),
                autor: {
                    id: null,
                    nome: data.isAnon ? 'Anônimo' : 'Você',
                    avatarUrl: null,
                },
            };

            await commentsDB.save(newComment);

            // Increment comment count
            const topic = await topicsDB.getById(topicId);
            if (topic) {
                await topicsDB.update(topicId, { commentsCount: topic.commentsCount + 1 });
            }

            // Queue for sync
            const exists = await syncQueueDB.exists(idempotencyKey);
            if (!exists) {
                await syncQueueDB.add({
                    type: 'comment',
                    data: { topicId, ...data, localId: newComment.id },
                    idempotencyKey,
                });
            }

            // Rethrow to let caller know API failed
            throw error;
        }
    },

    /**
     * Delete a comment
     */
    async deleteComment(topicId: string, commentId: string): Promise<void> {
        await apiClient.delete(ENDPOINTS.forum.deleteComment(topicId, commentId));
        await commentsDB.delete(commentId);

        // Decrement comment count
        const topic = await topicsDB.getById(topicId);
        if (topic) {
            await topicsDB.update(topicId, { commentsCount: Math.max(0, topic.commentsCount - 1) });
        }
    },

    /**
     * Toggle like on a comment
     */
    async toggleCommentLike(commentId: string): Promise<CommentLikeResponse> {
        return apiClient.post<CommentLikeResponse>(ENDPOINTS.forum.likeComment(commentId));
    },

    /**
     * Report a comment
     */
    async reportComment(commentId: string, data: ReportDTO): Promise<ReportResponse> {
        return apiClient.post<ReportResponse>(ENDPOINTS.forum.reportComment(commentId), data);
    },

    /**
     * Upload an image for topics/comments
     * Uses /api/forum/upload which Vite proxy rewrites to /api/v1/forum/upload
     */
    async uploadImage(file: File): Promise<UploadResponse> {
        const formData = new FormData();
        formData.append('file', file);

        // Get token using correct key
        const { getAuthToken } = await import('@/api/client');
        const token = getAuthToken();

        if (!token) {
            throw new Error('Você precisa estar logado para enviar imagens');
        }

        // Construct the full URL correctly
        // In dev: /api/forum/upload -> Vite rewrites to https://api.../api/v1/forum/upload
        // In prod: https://api.../api/v1/forum/upload
        const { API_CONFIG } = await import('@/api/config');
        const baseURL = API_CONFIG.baseURL.endsWith('/')
            ? API_CONFIG.baseURL.slice(0, -1)
            : API_CONFIG.baseURL;

        const uploadUrl = `${baseURL}${ENDPOINTS.forum.upload}`;
        console.log('[topicService.uploadImage] Uploading to:', uploadUrl);
        console.log('[topicService.uploadImage] Token present:', !!token);

        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                // DO NOT set Content-Type - browser will set it correctly with boundary for FormData
            },
            body: formData,
        });

        console.log('[topicService.uploadImage] Response status:', response.status);

        if (!response.ok) {
            if (response.status === 413) {
                throw new Error('Imagem muito grande. Máximo 5MB.');
            }
            if (response.status === 401) {
                throw new Error('Sessão expirada. Faça login novamente.');
            }
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Falha no upload da imagem');
        }

        const result = await response.json();
        console.log('[topicService.uploadImage] Success:', result);
        return result;
    },

    // ==================== LEGACY METHODS (backward compatibility) ====================

    /** @deprecated Use toggleLike instead */
    async like(id: string): Promise<void> {
        await this.toggleLike(id);
    },

    /** @deprecated Use toggleLike instead */
    async unlike(id: string): Promise<void> {
        await this.toggleLike(id);
    },
};

export default topicService;
