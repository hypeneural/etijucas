/**
 * BocaNoTromboneVivo - Live Forum Preview Card
 * 
 * Shows dynamic KPIs about forum activity and highlights the top topic.
 * Designed to make the community feel vibrant and active.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    MessageCircle,
    Heart,
    TrendingUp,
    ChevronRight,
    Flame,
    Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ForumVivoPayload } from '@/types/home.types';
import { useHaptic } from '@/hooks/useHaptic';
import { useAuthStore } from '@/store/useAuthStore';
import { Skeleton } from '@/components/ui/skeleton';

interface BocaNoTromboneVivoProps {
    data?: ForumVivoPayload;
    isLoading?: boolean;
    hasError?: boolean;
    className?: string;
}

// Skeleton loading state
function ForumSkeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-2xl',
                'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
                'border border-purple-200/50 dark:border-purple-800/30',
                'p-4',
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-28" />
                    </div>
                </div>
                <Skeleton className="h-5 w-5" />
            </div>

            {/* KPIs Row */}
            <div className="flex gap-3 mb-3">
                {[1, 2].map((i) => (
                    <div key={i} className="flex-1 flex items-center gap-2 p-2 rounded-xl bg-white/50 dark:bg-white/5">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div>
                            <Skeleton className="h-5 w-8 mb-1" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Top Topic placeholder */}
            <div className="p-3 rounded-xl bg-white/30 dark:bg-white/5 mb-3">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4" />
            </div>

            {/* CTA */}
            <Skeleton className="h-10 w-full rounded-xl" />
        </div>
    );
}

export function BocaNoTromboneVivo({ data, isLoading, hasError, className }: BocaNoTromboneVivoProps) {
    const navigate = useNavigate();
    const haptic = useHaptic();

    const { isAuthenticated } = useAuthStore();

    const handleClick = () => {
        haptic.light();
        navigate('/forum');
    };

    const handleNewTopic = (e: React.MouseEvent) => {
        e.stopPropagation();
        haptic.medium();

        if (isAuthenticated) {
            navigate('/forum/novo');
        } else {
            navigate('/forum');
        }
    };

    const handleTopTopic = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (data?.top_topico) {
            haptic.light();
            navigate(`/topico/${data.top_topico.id}`);
        }
    };

    // Show skeleton while loading
    if (isLoading) {
        return <ForumSkeleton className={className} />;
    }

    const comentariosHoje = data?.comentarios_hoje || 0;
    const curtidasSemana = data?.curtidas_semana || 0;
    const topTopico = data?.top_topico;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleClick}
            className={cn(
                'relative overflow-hidden rounded-2xl cursor-pointer',
                'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
                'border border-purple-200/50 dark:border-purple-800/30',
                'p-4',
                hasError && 'opacity-75',
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20">
                        <MessageCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Boca no Trombone</h3>
                        <p className="text-xs text-muted-foreground">Fórum da comunidade</p>
                    </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* KPIs Row */}
            <div className="flex gap-3 mb-3">
                {/* Comentários hoje */}
                <div className="flex-1 flex items-center gap-2 p-2 rounded-xl bg-white/50 dark:bg-white/5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40">
                        <MessageCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <span className="text-lg font-bold text-foreground">{comentariosHoje}</span>
                        <p className="text-[10px] text-muted-foreground">comentários hoje</p>
                    </div>
                </div>

                {/* Curtidas semana */}
                <div className="flex-1 flex items-center gap-2 p-2 rounded-xl bg-white/50 dark:bg-white/5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/40">
                        <Heart className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                        <span className="text-lg font-bold text-foreground">{curtidasSemana}</span>
                        <p className="text-[10px] text-muted-foreground">curtidas na semana</p>
                    </div>
                </div>
            </div>

            {/* Top Topic */}
            {topTopico && (
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleTopTopic}
                    className="w-full p-3 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-left mb-3 min-h-[44px]"
                >
                    <div className="flex items-start gap-2">
                        <Flame className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-0.5">
                                🔥 Em alta agora
                            </p>
                            <p className="text-sm font-medium text-foreground line-clamp-2">
                                {topTopico.titulo}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MessageCircle className="h-3 w-3" />
                                    {topTopico.comments_count}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Heart className="h-3 w-3" />
                                    {topTopico.likes_count}
                                </span>
                            </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                </motion.button>
            )}

            {/* Empty state if no top topic */}
            {!topTopico && (
                <div className="p-3 rounded-xl bg-white/30 dark:bg-white/5 text-center mb-3">
                    <Users className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">
                        Seja o primeiro a iniciar uma discussão hoje!
                    </p>
                </div>
            )}

            {/* CTA Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleNewTopic}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-500 text-white font-medium text-sm shadow-sm min-h-[44px]"
            >
                <MessageCircle className="h-4 w-4" />
                Iniciar discussão
            </motion.button>

            {/* Activity indicator */}
            {comentariosHoje > 10 && (
                <motion.div
                    className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20"
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] font-medium text-green-600 dark:text-green-400">
                        Ativo agora
                    </span>
                </motion.div>
            )}
        </motion.div>
    );
}

export default BocaNoTromboneVivo;

