// ======================================================
// TopicDetailPage - Full topic view with comments
// Fetches from API when topic not in local store
// ======================================================

import { useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Share2, MapPin, Heart, MoreHorizontal, Loader2, LogIn, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useTopic, useTopicComments, useLikeTopic, useAddComment, useLikeComment } from '@/hooks/queries/useTopics';
import { useAuthStore } from '@/store/useAuthStore';
import { TopicCategory, Comment } from '@/types';
import { formatTimeAgo, formatDateAccessible } from '@/lib/formatTimeAgo';
import { bairros } from '@/constants/bairros';
import { CommentList } from '@/components/forum/CommentList';
import { CommentComposer } from '@/components/forum/CommentComposer';
import { ImageGallery } from '@/components/forum/ImageGallery';
import { TopicActionMenu } from '@/components/forum/TopicActionMenu';

const categoryConfig: Record<TopicCategory, { label: string; color: string }> = {
    reclamacao: { label: 'Reclamação', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    sugestao: { label: 'Sugestão', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    duvida: { label: 'Dúvida', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    alerta: { label: 'Alerta', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    elogio: { label: 'Elogio', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    outros: { label: 'Outros', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
};

// Loading skeleton for topic detail
function TopicSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border safe-top">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <Skeleton className="w-24 h-6" />
                    </div>
                    <Skeleton className="w-10 h-10 rounded-full" />
                </div>
            </header>

            <article className="px-4 py-4 space-y-4">
                <div className="flex gap-2">
                    <Skeleton className="w-24 h-6 rounded-full" />
                    <Skeleton className="w-20 h-6 rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-1">
                        <Skeleton className="w-32 h-4" />
                        <Skeleton className="w-16 h-3" />
                    </div>
                </div>
                <Skeleton className="w-full h-8" />
                <div className="space-y-2">
                    <Skeleton className="w-full h-4" />
                    <Skeleton className="w-full h-4" />
                    <Skeleton className="w-3/4 h-4" />
                </div>
            </article>
        </div>
    );
}

// Not found state
function TopicNotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <span className="text-3xl">🔍</span>
                </div>
                <h2 className="text-xl font-semibold">Tópico não encontrado</h2>
                <p className="text-muted-foreground max-w-sm">
                    Este tópico pode ter sido removido ou o link está incorreto.
                </p>
                <Button onClick={() => navigate(-1)} variant="outline">
                    Voltar
                </Button>
            </div>
        </div>
    );
}

export default function TopicDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Auth state
    const { isAuthenticated } = useAuthStore();

    // Fetch topic from API
    const {
        data: topic,
        isLoading,
        isError,
    } = useTopic(id || '');

    // Fetch comments
    const { data: commentsData } = useTopicComments(id || '');
    const comments = commentsData?.data || [];

    // Mutations
    const likeMutation = useLikeTopic();
    const addCommentMutation = useAddComment(id || '');
    const likeCommentMutation = useLikeComment(id || '');

    const [replyTo, setReplyTo] = useState<string | undefined>();
    const shouldAutoFocusComment = searchParams.get('comment') === 'true';

    // Helper to prompt login for auth-required actions
    const requireAuth = useCallback((action: string): boolean => {
        if (!isAuthenticated) {
            toast({
                title: 'Login necessário',
                description: `Para ${action}, você precisa estar logado.`,
                action: (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)}
                    >
                        Entrar
                    </Button>
                ),
            });
            return false;
        }
        return true;
    }, [isAuthenticated, toast, navigate]);

    // Show loading state
    if (isLoading) {
        return <TopicSkeleton />;
    }

    // Show 404 state
    if (isError || !topic) {
        return <TopicNotFound />;
    }

    const category = categoryConfig[topic.categoria] || categoryConfig.outros;
    const bairroName = topic.bairro?.nome || bairros.find((b) => b.id === topic.bairroId)?.nome || 'Tijucas';
    const autorNome = topic.autor?.nome || (topic.isAnon ? 'Anônimo' : 'Usuário');

    const handleShare = async () => {
        const shareData = {
            title: topic.titulo,
            text: topic.texto,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch {
                // User cancelled
            }
        } else {
            await navigator.clipboard.writeText(shareData.url);
            toast({
                title: 'Link copiado!',
                description: 'O link foi copiado para a área de transferência.',
            });
        }
    };

    const handleLike = () => {
        // Check auth before allowing like
        if (!requireAuth('curtir')) return;

        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
        likeMutation.mutate({ id: topic.id, liked: topic.liked || false });
    };

    const handleAddComment = async (text: string, isAnon: boolean, imageUrl?: string) => {
        // Check auth before allowing comment
        if (!requireAuth('comentar')) return;

        try {
            await addCommentMutation.mutateAsync({
                texto: text,
                isAnon,
                imageUrl
            });
            toast({
                title: 'Comentário enviado!',
                description: 'Seu comentário foi publicado.',
            });
            setReplyTo(undefined);
        } catch (error) {
            toast({
                title: 'Erro ao enviar comentário',
                description: 'Tente novamente.',
                variant: 'destructive',
            });
        }
    };

    const handleThreadReply = async (parentId: string, text: string, isAnon: boolean, imageUrl?: string) => {
        // Check auth before allowing reply
        if (!requireAuth('responder')) return;

        try {
            await addCommentMutation.mutateAsync({
                texto: text,
                parentId,
                isAnon,
                imageUrl
            });
            toast({
                title: 'Resposta enviada!',
            });
        } catch (error) {
            toast({
                title: 'Erro ao enviar resposta',
                description: 'Tente novamente.',
                variant: 'destructive',
            });
        }
    };

    const handleCommentLike = (commentId: string) => {
        // Check auth before allowing like
        if (!requireAuth('curtir')) return;

        // Find current like state from comments
        const findComment = (comments: Comment[], id: string): Comment | undefined => {
            for (const c of comments) {
                if (c.id === id) return c;
                if (c.replies) {
                    const found = findComment(c.replies, id);
                    if (found) return found;
                }
            }
            return undefined;
        };

        const comment = findComment(comments, commentId);
        const liked = comment?.liked ?? false;

        if (navigator.vibrate) {
            navigator.vibrate(10);
        }

        likeCommentMutation.mutate({ commentId, liked });
    };

    const handleComposerFocus = () => {
        // If not authenticated, show login prompt instead of focusing
        if (!isAuthenticated) {
            requireAuth('comentar');
        }
    };

    const images = topic.fotoUrl ? [topic.fotoUrl] : [];

    return (
        <div className="min-h-screen bg-background pb-32">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border safe-top">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            aria-label="Voltar"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </motion.button>
                        <h1 className="text-lg font-semibold">Tópico</h1>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleShare}
                        className="p-2 rounded-full hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Compartilhar"
                    >
                        <Share2 className="w-5 h-5" />
                    </motion.button>
                </div>
            </header>

            {/* Topic content */}
            <article className="px-4 py-4">
                {/* Meta */}
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${category.color} border-0`}>
                            {category.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {bairroName}
                        </span>
                    </div>
                    <time
                        dateTime={new Date(topic.createdAt).toISOString()}
                        title={formatDateAccessible(topic.createdAt)}
                        className="text-sm text-muted-foreground"
                    >
                        {formatTimeAgo(topic.createdAt)}
                    </time>
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground overflow-hidden">
                        {topic.autor?.avatarUrl ? (
                            <img
                                src={topic.autor.avatarUrl}
                                alt={autorNome}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            topic.isAnon ? '?' : autorNome[0]?.toUpperCase()
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-foreground">
                            {autorNome}
                        </p>
                        <p className="text-xs text-muted-foreground">Autor</p>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-foreground leading-tight mb-3">
                    {topic.titulo}
                </h2>

                {/* Content */}
                <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap mb-4">
                    {topic.texto}
                </p>

                {/* Images */}
                {images.length > 0 && (
                    <div className="mb-4">
                        <ImageGallery images={images} alt={topic.titulo} />
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleLike}
                        disabled={likeMutation.isPending}
                        className="flex items-center gap-2 py-2 px-4 rounded-full hover:bg-muted/50 transition-colors min-h-[44px] disabled:opacity-50"
                    >
                        <motion.div
                            animate={topic.liked ? { scale: [1, 1.3, 1] } : {}}
                            transition={{ duration: 0.3 }}
                        >
                            {likeMutation.isPending ? (
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            ) : (
                                <Heart
                                    className={`w-6 h-6 ${topic.liked
                                        ? 'fill-red-500 text-red-500'
                                        : 'text-muted-foreground'
                                        }`}
                                />
                            )}
                        </motion.div>
                        <span className={`font-medium ${topic.liked ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {topic.likesCount} Curtidas
                        </span>
                    </motion.button>

                    <div className="flex items-center gap-1 text-muted-foreground">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{topic.commentsCount}</span>
                    </div>

                    <TopicActionMenu topicId={topic.id} isAnonymous={topic.isAnon}>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            className="p-2 rounded-full hover:bg-muted/50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                        </motion.button>
                    </TopicActionMenu>
                </div>
            </article>

            {/* Comments section */}
            <section className="border-t border-border pb-24">
                <CommentList
                    comments={comments}
                    onLike={handleCommentLike}
                    onReply={handleThreadReply}
                />
            </section>

            {/* Comment composer or Login prompt */}
            <AnimatePresence mode="wait">
                {isAuthenticated ? (
                    <CommentComposer
                        onSubmit={handleAddComment}
                        autoFocus={shouldAutoFocusComment}
                        replyTo={replyTo}
                        isSubmitting={addCommentMutation.isPending}
                    />
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 safe-bottom z-40"
                    >
                        <div
                            className="flex items-center gap-3 p-3 rounded-xl bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
                            onClick={handleComposerFocus}
                        >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <LogIn className="w-4 h-4 text-primary" />
                            </div>
                            <p className="text-muted-foreground text-sm flex-1">
                                Faça login para comentar...
                            </p>
                            <Button size="sm" asChild>
                                <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}>
                                    Entrar
                                </Link>
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
