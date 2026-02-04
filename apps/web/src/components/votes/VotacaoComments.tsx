/**
 * VotacaoComments - Comments section for voting sessions
 * Wraps CommentList and CommentComposer with auth gate logic
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MessageCircle, Loader2 } from 'lucide-react';

import { apiClient } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import CommentList from '@/components/forum/CommentList';
import CommentComposer from '@/components/forum/CommentComposer';
import LoginPromptSheet from '@/components/common/LoginPromptSheet';
import type { Comment } from '@/types';
import { toast } from 'sonner';

interface VotacaoCommentsProps {
    votacaoId: string;
}

interface CommentsResponse {
    success: boolean;
    data: Comment[];
    meta: {
        total: number;
    };
}

export function VotacaoComments({ votacaoId }: VotacaoCommentsProps) {
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuthStore();
    const [loginPromptOpen, setLoginPromptOpen] = useState(false);
    const [loginPromptAction, setLoginPromptAction] = useState<'comment' | 'like'>('comment');

    // Fetch comments
    const { data: commentsData, isLoading, error } = useQuery({
        queryKey: ['votacao-comments', votacaoId],
        queryFn: async () => {
            const response = await apiClient.get<CommentsResponse>(
                `/votacoes/${votacaoId}/comments`
            );
            return response;
        },
    });

    // Create comment mutation
    const createCommentMutation = useMutation({
        mutationFn: async (data: { texto: string; isAnon: boolean; imageUrl?: string; parentId?: string }) => {
            return apiClient.post<{ success: boolean; data: Comment }>(
                `/votacoes/${votacaoId}/comments`,
                data
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['votacao-comments', votacaoId] });
            toast.success('Comentário adicionado!');
        },
        onError: () => {
            toast.error('Erro ao adicionar comentário');
        },
    });

    // Like comment mutation
    const likeCommentMutation = useMutation({
        mutationFn: async (commentId: string) => {
            return apiClient.post<{ success: boolean; liked: boolean; likesCount: number }>(
                `/votacoes/${votacaoId}/comments/${commentId}/like`
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['votacao-comments', votacaoId] });
        },
    });

    // Handle like with auth gate
    const handleLike = useCallback((commentId: string) => {
        if (!isAuthenticated) {
            setLoginPromptAction('like');
            setLoginPromptOpen(true);
            return;
        }
        likeCommentMutation.mutate(commentId);
    }, [isAuthenticated, likeCommentMutation]);

    // Handle reply with auth gate
    const handleReply = useCallback(async (parentId: string, text: string, isAnon: boolean, imageUrl?: string) => {
        if (!isAuthenticated) {
            setLoginPromptAction('comment');
            setLoginPromptOpen(true);
            return;
        }
        await createCommentMutation.mutateAsync({ texto: text, isAnon, imageUrl, parentId });
    }, [isAuthenticated, createCommentMutation]);

    // Handle new comment with auth gate
    const handleSubmit = useCallback(async (text: string, isAnon: boolean, imageUrl?: string) => {
        if (!isAuthenticated) {
            setLoginPromptAction('comment');
            setLoginPromptOpen(true);
            return;
        }
        await createCommentMutation.mutateAsync({ texto: text, isAnon, imageUrl });
    }, [isAuthenticated, createCommentMutation]);

    const comments = commentsData?.data ?? [];
    const totalComments = commentsData?.meta?.total ?? 0;

    return (
        <div className="bg-card rounded-2xl border shadow-card overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">
                    Comentários da População
                </h3>
                {totalComments > 0 && (
                    <span className="text-sm text-muted-foreground">
                        ({totalComments})
                    </span>
                )}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="py-12 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            ) : error ? (
                <div className="py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                        Erro ao carregar comentários
                    </p>
                </div>
            ) : (
                <CommentList
                    comments={comments}
                    onLike={handleLike}
                    onReply={handleReply}
                />
            )}

            {/* Comment composer - show for all, but gate on submit */}
            <div className="border-t border-border/50 bg-muted/30">
                {isAuthenticated ? (
                    <div className="relative">
                        <CommentComposer
                            onSubmit={handleSubmit}
                            placeholder="Deixe seu comentário sobre esta votação..."
                            isSubmitting={createCommentMutation.isPending}
                        />
                    </div>
                ) : (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            setLoginPromptAction('comment');
                            setLoginPromptOpen(true);
                        }}
                        className="w-full px-4 py-4 text-left text-muted-foreground hover:bg-muted/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                <MessageCircle className="w-4 h-4" />
                            </div>
                            <span className="text-sm">
                                Faça login para comentar...
                            </span>
                        </div>
                    </motion.button>
                )}
            </div>

            {/* Login prompt modal */}
            <LoginPromptSheet
                open={loginPromptOpen}
                onClose={() => setLoginPromptOpen(false)}
                action={loginPromptAction}
            />
        </div>
    );
}

export default VotacaoComments;
