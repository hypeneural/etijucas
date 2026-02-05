// ======================================================
// TopicCard - Scannable topic card for feed
// ======================================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal, MapPin, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Topic, TopicCategory } from '@/types';
import { formatTimeAgo, formatDateAccessible } from '@/lib/formatTimeAgo';
import { bairros } from '@/constants/bairros';

const categoryConfig: Record<TopicCategory, { label: string; color: string }> = {
    reclamacao: { label: 'Reclamação', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    reclamacoes: { label: 'Reclamação', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    sugestao: { label: 'Sugestão', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    duvida: { label: 'Dúvida', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    alerta: { label: 'Alerta', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    elogio: { label: 'Elogio', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    comercio: { label: 'Comércio', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    eventos: { label: 'Eventos', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
    outros: { label: 'Outros', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
};

interface TopicCardProps {
    topic: Topic;
    onPress?: () => void;
    onLike?: () => void;
    onComment?: () => void;
    onShare?: () => void;
    onMore?: () => void;
}

export const TopicCard = memo(function TopicCard({
    topic,
    onPress,
    onLike,
    onComment,
    onShare,
    onMore,
}: TopicCardProps) {
    const category = categoryConfig[topic.categoria] || categoryConfig.outros;
    const bairroName = bairros.find(b => b.id === topic.bairroId)?.nome || 'Tijucas';
    const timeAgo = formatTimeAgo(topic.createdAt);
    const accessibleDate = formatDateAccessible(topic.createdAt);

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
        onLike?.();
    };

    const handleComment = (e: React.MouseEvent) => {
        e.stopPropagation();
        onComment?.();
    };

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        onShare?.();
    };

    const handleMore = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMore?.();
    };

    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileTap={{ scale: 0.99 }}
            onClick={onPress}
            className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 cursor-pointer active:bg-muted/50 transition-colors"
            role="article"
            aria-label={`${topic.titulo} - ${category.label} em ${bairroName}`}
        >
            {/* Header: Category + Bairro + Time */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <Badge
                        variant="secondary"
                        className={`${category.color} border-0 font-medium text-xs px-2 py-0.5`}
                    >
                        {category.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{bairroName}</span>
                    </span>
                </div>
                <time
                    dateTime={new Date(topic.createdAt).toISOString()}
                    title={accessibleDate}
                    className="text-xs text-muted-foreground whitespace-nowrap"
                >
                    {timeAgo}
                </time>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-foreground text-base leading-snug line-clamp-2 mb-1">
                {topic.titulo}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                {topic.texto}
            </p>

            {/* Image Thumbnail */}
            {topic.fotoUrl && (
                <div className="relative mb-3 rounded-xl overflow-hidden bg-muted aspect-video">
                    <img
                        src={topic.fotoUrl}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
            )}

            {/* Author */}
            <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                    {topic.isAnon ? '?' : (topic.autorNome?.[0] || 'U')}
                </div>
                <span className="text-xs text-muted-foreground">
                    {topic.isAnon ? 'Anônimo' : topic.autorNome}
                </span>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                {/* Like */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleLike}
                    className="flex items-center gap-1.5 py-2 px-3 -ml-3 rounded-lg hover:bg-muted/50 transition-colors min-h-[44px]"
                    aria-label={topic.liked ? 'Remover curtida' : 'Curtir'}
                    aria-pressed={topic.liked}
                >
                    <motion.div
                        animate={topic.liked ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 0.3 }}
                    >
                        <Heart
                            className={`w-5 h-5 ${topic.liked
                                ? 'fill-red-500 text-red-500'
                                : 'text-muted-foreground'
                                }`}
                        />
                    </motion.div>
                    <span className={`text-sm font-medium ${topic.liked ? 'text-red-500' : 'text-muted-foreground'
                        }`}>
                        {topic.likesCount > 0 ? topic.likesCount : 'Curtir'}
                    </span>
                </motion.button>

                {/* Comment */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleComment}
                    className="flex items-center gap-1.5 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors min-h-[44px]"
                    aria-label={`${topic.commentsCount} comentários`}
                >
                    <MessageCircle className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                        {topic.commentsCount > 0 ? topic.commentsCount : 'Comentar'}
                    </span>
                </motion.button>

                {/* Share */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleShare}
                    className="flex items-center gap-1.5 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors min-h-[44px]"
                    aria-label="Compartilhar"
                >
                    <Share2 className="w-5 h-5 text-muted-foreground" />
                </motion.button>

                {/* More */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleMore}
                    className="flex items-center justify-center p-2 rounded-lg hover:bg-muted/50 transition-colors min-h-[44px] min-w-[44px]"
                    aria-label="Mais opções"
                >
                    <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                </motion.button>
            </div>
        </motion.article>
    );
});

export default TopicCard;
