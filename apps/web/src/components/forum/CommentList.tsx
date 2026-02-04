// ======================================================
// CommentList - Threaded comments with replies
// ======================================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, ChevronDown, ChevronUp, Image as ImageIcon, Camera, X, Loader2, Send } from 'lucide-react';
import { Comment } from '@/types';
import { formatTimeAgo } from '@/lib/formatTimeAgo';
import { useUploadImage } from '@/hooks/useUploadImage';
import { toast } from 'sonner';

type CommentSortOption = 'relevantes' | 'recentes';

interface CommentListProps {
    comments: Comment[];
    onLike?: (commentId: string) => void;
    onReply?: (parentId: string, text: string, isAnon: boolean, imageUrl?: string) => Promise<void>;
}

// Type for comments with replies (API already returns this structure)
type CommentWithReplies = Comment & { replies?: CommentWithReplies[] };

/**
 * Process comments from API
 * API already returns nested structure with replies[]
 * This function only filters root comments (parentId = null) and sorts
 */
function getProcessedComments(comments: CommentWithReplies[], sortBy: CommentSortOption): CommentWithReplies[] {
    // Filter only root-level comments (API already has replies nested)
    const rootComments = comments.filter(c => !c.parentId);

    // Sort root comments
    return rootComments.sort((a, b) => {
        if (sortBy === 'recentes') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // relevantes - by likes then by date
        const likesDiff = (b.likesCount ?? 0) - (a.likesCount ?? 0);
        if (likesDiff !== 0) return likesDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

export function CommentList({ comments, onLike, onReply }: CommentListProps) {
    const [sortBy, setSortBy] = useState<CommentSortOption>('relevantes');

    // Use API structure directly - replies are already nested
    const threadedComments = useMemo(() => {
        console.log('[CommentList] Processing comments:', comments.length, 'total');
        const processed = getProcessedComments(comments as CommentWithReplies[], sortBy);
        console.log('[CommentList] Root comments:', processed.length, 'with replies:', processed.map(c => c.replies?.length ?? 0));
        return processed;
    }, [comments, sortBy]);

    if (comments.length === 0) {
        return (
            <div className="py-12 text-center">
                <MessageCircle className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                    Nenhum comentário ainda.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    Seja o primeiro a comentar!
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Sort toggle */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
                <span className="text-sm font-medium text-foreground">
                    {comments.length} {comments.length === 1 ? 'comentário' : 'comentários'}
                </span>
                <div className="flex gap-1">
                    {(['relevantes', 'recentes'] as CommentSortOption[]).map((option) => (
                        <button
                            key={option}
                            onClick={() => setSortBy(option)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${sortBy === option
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted'
                                }`}
                        >
                            {option === 'relevantes' ? 'Relevantes' : 'Recentes'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Comment list */}
            <div className="divide-y divide-border/50">
                <AnimatePresence>
                    {threadedComments.map((comment, index) => (
                        <CommentThread
                            key={comment.id}
                            comment={comment}
                            index={index}
                            depth={0}
                            onLike={onLike}
                            onReply={onReply}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

interface CommentThreadProps {
    comment: Comment & { replies?: Comment[] };
    index: number;
    depth: number;
    onLike?: (commentId: string) => void;
    onReply?: (parentId: string, text: string, isAnon: boolean, imageUrl?: string) => Promise<void>;
}

function CommentThread({ comment, index, depth, onLike, onReply }: CommentThreadProps) {
    // Use API liked state if available, otherwise initialize to false
    const [liked, setLiked] = useState(comment.liked ?? false);
    const [localLikesCount, setLocalLikesCount] = useState(comment.likesCount ?? 0);
    const [showReplies, setShowReplies] = useState(depth < 2);
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [replyIsAnon, setReplyIsAnon] = useState(false);
    const [replyImage, setReplyImage] = useState<string | null>(null);
    const [replyFile, setReplyFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const { uploadAsync } = useUploadImage();

    const hasReplies = comment.replies && comment.replies.length > 0;
    const maxDepth = 3;

    const handleLike = () => {
        // Optimistic update - instant UI feedback
        setLiked(!liked);
        setLocalLikesCount(prev => liked ? Math.max(0, prev - 1) : prev + 1);
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
        onLike?.(comment.id);
    };

    // Helper: get author name from comment (supports both API format and legacy)
    const getAuthorName = () => {
        if (comment.isAnon) return 'Anônimo';
        if (comment.autor?.nome) return comment.autor.nome;
        if (comment.autorNome) return comment.autorNome;
        return 'Usuário';
    };

    const getAuthorInitial = () => {
        if (comment.isAnon) return '?';
        const name = comment.autor?.nome || comment.autorNome || 'U';
        return name[0]?.toUpperCase() || 'U';
    };

    const handleSubmitReply = async () => {
        if (!replyText.trim() || !onReply) return;

        setIsSubmitting(true);
        try {
            let imageUrl: string | undefined;

            if (replyFile) {
                try {
                    const result = await uploadAsync(replyFile);
                    imageUrl = result.url;
                } catch (error) {
                    toast.error('Erro ao enviar imagem');
                    setIsSubmitting(false);
                    return;
                }
            }

            await onReply(comment.id, replyText.trim(), replyIsAnon, imageUrl);
            setReplyText('');
            setReplyImage(null);
            setReplyFile(null);
            setIsReplying(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={depth > 0 ? 'border-l-2 border-muted' : ''}
            style={{ marginLeft: depth > 0 ? `${Math.min(depth, maxDepth) * 16}px` : 0 }}
        >
            <div className="px-4 py-3">
                <div className="flex gap-3">
                    {/* Avatar */}
                    <div className={`${depth > 0 ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'} rounded-full bg-muted flex items-center justify-center font-medium text-muted-foreground flex-shrink-0`}>
                        {comment.autor?.avatarUrl ? (
                            <img
                                src={comment.autor.avatarUrl}
                                alt={getAuthorName()}
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            getAuthorInitial()
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Author + time */}
                        <div className="flex items-baseline gap-2">
                            <span className={`${depth > 0 ? 'text-xs' : 'text-sm'} font-medium text-foreground`}>
                                {getAuthorName()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(comment.createdAt)}
                            </span>
                        </div>

                        {/* Comment text */}
                        <p className={`${depth > 0 ? 'text-xs' : 'text-sm'} text-foreground mt-1 leading-relaxed whitespace-pre-wrap`}>
                            {comment.texto}
                        </p>

                        {/* Comment image - clickable for fullscreen */}
                        {comment.imageUrl && (
                            <>
                                <img
                                    src={comment.imageUrl}
                                    alt="Imagem do comentário"
                                    className="mt-2 rounded-lg max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => setImageModalOpen(true)}
                                />

                                {/* Fullscreen image modal */}
                                <AnimatePresence>
                                    {imageModalOpen && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                                            onClick={() => setImageModalOpen(false)}
                                        >
                                            <button
                                                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/50 rounded-full"
                                                onClick={() => setImageModalOpen(false)}
                                            >
                                                <X className="w-6 h-6" />
                                            </button>
                                            <motion.img
                                                initial={{ scale: 0.9 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0.9 }}
                                                src={comment.imageUrl}
                                                alt="Imagem em tela cheia"
                                                className="max-w-full max-h-full object-contain rounded-lg"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-4 mt-2">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={handleLike}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[32px]"
                            >
                                <Heart
                                    className={`w-4 h-4 transition-all ${liked ? 'fill-red-500 text-red-500 scale-110' : ''}`}
                                />
                                <span className={liked ? 'text-red-500 font-medium' : ''}>
                                    {localLikesCount > 0 ? localLikesCount : 'Curtir'}
                                </span>
                            </motion.button>

                            {depth < maxDepth && (
                                <button
                                    onClick={() => setIsReplying(!isReplying)}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[32px]"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    <span>Responder</span>
                                </button>
                            )}

                            {hasReplies && (
                                <button
                                    onClick={() => setShowReplies(!showReplies)}
                                    className="flex items-center gap-1 text-xs text-primary font-medium min-h-[32px]"
                                >
                                    {showReplies ? (
                                        <>
                                            <ChevronUp className="w-4 h-4" />
                                            <span>Ocultar {comment.replies.length} {comment.replies.length === 1 ? 'resposta' : 'respostas'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="w-4 h-4" />
                                            <span>Ver {comment.replies.length} {comment.replies.length === 1 ? 'resposta' : 'respostas'}</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Inline reply form */}
                        <AnimatePresence>
                            {isReplying && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-3 overflow-hidden"
                                >
                                    <div className="flex flex-col gap-2 p-3 bg-muted/50 rounded-xl">
                                        {/* Reply image preview */}
                                        {replyImage && (
                                            <div className="relative">
                                                <img
                                                    src={replyImage}
                                                    alt="Preview"
                                                    className="h-24 rounded-lg object-cover"
                                                />
                                                <button
                                                    onClick={() => setReplyImage(null)}
                                                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}

                                        <div className="flex items-end gap-2">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    placeholder={`Responder ${comment.isAnon ? 'Anônimo' : comment.autorNome}...`}
                                                    className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSubmitReply();
                                                        }
                                                    }}
                                                />
                                            </div>

                                            {/* Image button */}
                                            <label className="p-2 rounded-lg hover:bg-muted cursor-pointer">
                                                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            setReplyFile(file);
                                                            const reader = new FileReader();
                                                            reader.onload = () => setReplyImage(reader.result as string);
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                />
                                            </label>

                                            {/* Send button */}
                                            <button
                                                onClick={handleSubmitReply}
                                                disabled={!replyText.trim() || isSubmitting}
                                                className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                                            >
                                                {isSubmitting ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Send className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Replies */}
            <AnimatePresence>
                {hasReplies && showReplies && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        {comment.replies.map((reply, replyIndex) => (
                            <CommentThread
                                key={reply.id}
                                comment={{ ...reply, replies: (reply as Comment & { replies: Comment[] }).replies || [] }}
                                index={replyIndex}
                                depth={depth + 1}
                                onLike={onLike}
                                onReply={onReply}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default CommentList;
