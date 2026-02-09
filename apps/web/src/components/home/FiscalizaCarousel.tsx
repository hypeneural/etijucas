/**
 * FiscalizaCarousel — "📷 Olhares da Cidade"
 * 
 * Premium horizontal carousel showcasing recent observations with photos.
 * Mobile-first, native-like scroll, lazy image loading with shimmer states.
 */

import React, { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, MapPin, Clock, ChevronRight, Eye, CheckCircle2, Loader2 } from 'lucide-react';
import { FiscalizaCarouselPayload, FiscalizaCarouselItem } from '@/types/home.types';
import { useTenantNavigate } from '@/hooks/useTenantNavigate';
import { hapticFeedback } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';

// ── Status config ──────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
    recebido: { label: 'Recebido', color: 'bg-amber-500/70 text-white', dotColor: 'bg-amber-300' },
    em_analise: { label: 'Em análise', color: 'bg-sky-500/70 text-white', dotColor: 'bg-sky-300' },
    resolvido: { label: 'Resolvido', color: 'bg-emerald-500/70 text-white', dotColor: 'bg-emerald-300' },
    rejeitado: { label: 'Rejeitado', color: 'bg-red-500/70 text-white', dotColor: 'bg-red-300' },
};

// ── Main Component ─────────────────────────────────────────
interface FiscalizaCarouselProps {
    data?: FiscalizaCarouselPayload;
    isLoading?: boolean;
}

export const FiscalizaCarousel: React.FC<FiscalizaCarouselProps> = ({ data, isLoading }) => {
    const navigate = useTenantNavigate();
    const scrollRef = useRef<HTMLDivElement>(null);

    if (isLoading) {
        return <CarouselSkeleton />;
    }

    if (!data || !data.items || data.items.length === 0) {
        return null;
    }

    return (
        <div className="py-5">
            {/* ── Header ── */}
            <div className="px-4 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                                <Camera className="w-5 h-5 text-white" />
                            </div>
                            {data.items.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-sm">
                                    {data.items.length}
                                </span>
                            )}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">{data.title}</h2>
                            <p className="text-xs text-muted-foreground">{data.subtitle}</p>
                        </div>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            hapticFeedback('light');
                            navigate('/observacoes');
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-muted hover:bg-muted/80 rounded-full text-sm font-medium text-foreground transition-colors"
                    >
                        Ver todos
                        <ChevronRight className="w-4 h-4" />
                    </motion.button>
                </div>
            </div>

            {/* ── Horizontal Scroll ── */}
            <div
                ref={scrollRef}
                className="overflow-x-auto overflow-y-hidden scrollbar-hide touch-pan-x snap-x snap-mandatory"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                <div className="flex gap-4 px-4 pb-4">
                    {data.items.map((item, index) => (
                        <CarouselCard key={item.id} item={item} index={index} navigate={navigate} />
                    ))}

                    {/* ── "Ver Mais" end card ── */}
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: data.items.length * 0.06 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                            hapticFeedback('light');
                            navigate('/observacoes');
                        }}
                        className={cn(
                            "snap-start flex-shrink-0 w-36 h-[220px] rounded-3xl",
                            "bg-muted/50 border-2 border-dashed border-muted-foreground/20",
                            "flex flex-col items-center justify-center gap-3",
                            "text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
                        )}
                    >
                        <div className="w-12 h-12 rounded-full bg-background shadow-sm flex items-center justify-center text-primary">
                            <Eye className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-semibold">Ver todas</span>
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

// ── Card Component ─────────────────────────────────────────
const CarouselCard = ({
    item,
    index,
    navigate,
}: {
    item: FiscalizaCarouselItem;
    index: number;
    navigate: (path: string) => void;
}) => {
    const [imgState, setImgState] = useState<'loading' | 'loaded' | 'error'>('loading');
    const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.recebido;

    const handleLoad = useCallback(() => setImgState('loaded'), []);
    const handleError = useCallback(() => setImgState('error'), []);

    return (
        <motion.button
            className={cn(
                "snap-start flex-shrink-0 w-[300px] h-[220px] rounded-3xl overflow-hidden relative group text-left",
                "shadow-xl shadow-muted/20 border border-border/30"
            )}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.06, type: 'spring', stiffness: 200 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
                hapticFeedback('selection');
                navigate(`/observacao/${item.id}`);
            }}
        >
            {/* ── Shimmer placeholder ── */}
            {imgState === 'loading' && (
                <div className="absolute inset-0 bg-muted/40 flex items-center justify-center">
                    <div className="absolute inset-0 skeleton-shimmer" />
                    <Loader2 className="w-6 h-6 text-muted-foreground/40 animate-spin relative z-10" />
                </div>
            )}

            {/* ── Error fallback ── */}
            {imgState === 'error' && (
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600">
                    <div className="absolute inset-0 overflow-hidden opacity-20">
                        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/30 blur-xl" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/20 blur-2xl" />
                    </div>
                </div>
            )}

            {/* ── Background Image ── */}
            {imgState !== 'error' && (
                <img
                    src={item.image.thumb || item.image.full}
                    alt={item.title}
                    className={cn(
                        "absolute inset-0 w-full h-full object-cover transition-all duration-700",
                        imgState === 'loaded' ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                    )}
                    loading="lazy"
                    decoding="async"
                    onLoad={handleLoad}
                    onError={handleError}
                />
            )}

            {/* ── Gradient overlay ── */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/5" />

            {/* ── Glassmorphism hover ── */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-active:opacity-100 transition-opacity duration-200" />

            {/* ── Status Badge (top-right) ── */}
            <div className={cn(
                "absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                "backdrop-blur-md border border-white/15 flex items-center gap-1.5 shadow-sm",
                statusCfg.color
            )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dotColor)} />
                {statusCfg.label}
            </div>

            {/* ── Content overlay ── */}
            <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col justify-end">
                {/* Meta badges */}
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="flex items-center gap-1 text-white/80 text-[10px] font-medium bg-black/20 backdrop-blur-[2px] px-2 py-0.5 rounded-full">
                        <MapPin size={10} className="shrink-0" />
                        <span className="truncate max-w-[100px]">{item.bairro}</span>
                    </span>
                    <span className="flex items-center gap-1 text-white/70 text-[10px] font-medium">
                        <Clock size={10} className="shrink-0" />
                        {item.created_at_human}
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-white font-bold leading-tight line-clamp-2 text-[15px] drop-shadow-md">
                    {item.title}
                </h3>

                {/* Category */}
                <p className="text-white/60 text-[11px] font-medium mt-1 truncate">
                    {item.category.name}
                </p>
            </div>
        </motion.button>
    );
};

// ── Skeleton ───────────────────────────────────────────────
const CarouselSkeleton = () => (
    <div className="py-5">
        {/* Header skeleton */}
        <div className="px-4 mb-4">
            <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl skeleton-shimmer" />
                <div className="space-y-1.5">
                    <div className="h-5 w-40 skeleton-shimmer rounded-lg" />
                    <div className="h-3.5 w-52 skeleton-shimmer rounded-lg" />
                </div>
            </div>
        </div>
        {/* Cards skeleton */}
        <div className="flex gap-4 px-4 overflow-hidden">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex-shrink-0 w-[300px] h-[220px] rounded-3xl skeleton-shimmer" />
            ))}
        </div>
    </div>
);

export default FiscalizaCarousel;
