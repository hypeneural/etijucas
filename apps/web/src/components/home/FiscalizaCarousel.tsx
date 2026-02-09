import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { FiscalizaCarouselPayload, FiscalizaCarouselItem } from '@/types/home.types';
import { useNavigate } from 'react-router-dom';
import { hapticFeedback } from '@/hooks/useHaptics';

interface FiscalizaCarouselProps {
    data?: FiscalizaCarouselPayload;
    isLoading?: boolean;
}

export const FiscalizaCarousel: React.FC<FiscalizaCarouselProps> = ({ data, isLoading }) => {
    const navigate = useNavigate();

    if (isLoading) {
        return <CarouselSkeleton />;
    }

    if (!data || !data.items || data.items.length === 0) {
        return null; // Don't render empty block
    }

    return (
        <div className="py-6 space-y-4">
            {/* Header */}
            <div className="px-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    {data.title}
                </h2>
                <p className="text-sm text-muted-foreground">{data.subtitle}</p>
            </div>

            {/* Scrollable Container */}
            <div className="w-full flex overflow-x-auto pb-4 px-4 gap-4 snap-x snap-mandatory scrollbar-hide">
                {data.items.map((item, index) => (
                    <CarouselCard key={item.id} item={item} index={index} navigate={navigate} />
                ))}

                {/* "Ver Mais" Card */}
                <div className="min-w-[140px] flex items-center justify-center snap-center">
                    <button
                        onClick={() => navigate('/denuncias')}
                        className="flex flex-col items-center gap-2 text-primary active:opacity-70 transition-opacity"
                    >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium">Ver todas</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const CarouselCard = ({ item, index, navigate }: { item: FiscalizaCarouselItem; index: number, navigate: (path: string) => void }) => {
    const statusColor = getStatusColor(item.status);
    const StatusIcon = getStatusIcon(item.status);

    return (
        <motion.div
            className="relative min-w-[280px] h-[200px] rounded-2xl overflow-hidden snap-center bg-muted/20 shadow-sm border border-border/50"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
                hapticFeedback('selection');
                navigate(`/observacao/${item.id}`);
            }}
        >
            {/* Background Image */}
            <img
                src={item.image.thumb}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                loading="lazy"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

            {/* Content Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col justify-end h-full">
                <div className="flex justify-between items-end gap-2">
                    <div className="flex-1 min-w-0">
                        {/* Meta Top */}
                        <div className="flex items-center gap-2 text-white/70 text-[10px] font-medium mb-1 uppercase tracking-wide">
                            <span className="flex items-center gap-1 bg-black/30 backdrop-blur-md px-1.5 py-0.5 rounded-md">
                                <MapPin size={10} />
                                {item.bairro}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {item.created_at_human}
                            </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-white font-bold leading-tight line-clamp-2 text-base shadow-black/50 drop-shadow-sm">
                            {item.title}
                        </h3>
                    </div>

                    {/* Category Icon */}
                    {/* <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 backdrop-blur-md border border-white/10"
                        style={{ backgroundColor: `${item.category.color}40` }} // 25% opacity
                    >
                         <img src={item.category.icon} className="w-5 h-5" /> 
                         Using generic icon for now if actual icon path is SVG or similar
                        <AlertCircle className="w-5 h-5 text-white" />
                    </div> */}
                </div>
            </div>

            {/* Status Badge (Top Right) */}
            <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border border-white/10 flex items-center gap-1 ${statusColor}`}>
                <StatusIcon size={10} />
                {item.status.replace('_', ' ')}
            </div>
        </motion.div>
    );
};

// Helpers
const getStatusColor = (status: string) => {
    switch (status) {
        case 'resolvido': return 'bg-green-500/80 text-white';
        case 'em_analise': return 'bg-blue-500/80 text-white';
        case 'rejeitado': return 'bg-red-500/80 text-white';
        default: return 'bg-zinc-500/80 text-white'; // recebido
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'resolvido': return CheckCircle;
        default: return AlertCircle;
    }
};

const CarouselSkeleton = () => (
    <div className="py-6 space-y-4 px-4 overflow-hidden">
        <div className="space-y-2">
            <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted/50 rounded animate-pulse" />
        </div>
        <div className="flex gap-4">
            {[1, 2].map(i => (
                <div key={i} className="min-w-[280px] h-[200px] bg-muted/30 rounded-2xl animate-pulse" />
            ))}
        </div>
    </div>
);

export default FiscalizaCarousel;
