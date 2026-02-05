/**
 * NearYouBento - "Perto de Você" Component
 * 
 * A compact, location-aware bento grid showing what's happening
 * near the user's selected neighborhood (bairro).
 * 
 * Features:
 * - Fiscaliza reports nearby
 * - Events happening close
 * - Active alerts in the area
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, AlertTriangle, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/hooks/useHaptics';

interface NearYouItem {
    type: 'fiscaliza' | 'evento' | 'alerta';
    id: string;
    title: string;
    subtitle?: string;
    count?: number;
    route: string;
}

interface NearYouBentoProps {
    bairroName?: string;
    items: NearYouItem[];
    isLoading?: boolean;
    className?: string;
}

// Icon mapping
const typeIcons = {
    fiscaliza: AlertTriangle,
    evento: Calendar,
    alerta: MapPin,
};

// Color mapping
const typeColors = {
    fiscaliza: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    evento: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    alerta: 'bg-red-500/10 text-red-600 border-red-500/20',
};

// Skeleton
function NearYouSkeleton() {
    return (
        <div className="px-4">
            <div className="animate-pulse space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 w-4 rounded bg-primary/20" />
                    <div className="h-4 w-32 rounded bg-primary/20" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 rounded-xl bg-muted" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function NearYouBento({ bairroName, items, isLoading, className }: NearYouBentoProps) {
    const navigate = useNavigate();

    if (isLoading) {
        return <NearYouSkeleton />;
    }

    // Don't show if no bairro selected or no items
    if (!bairroName || items.length === 0) {
        return null;
    }

    const handleItemClick = (item: NearYouItem) => {
        hapticFeedback('selection');
        navigate(item.route);
    };

    return (
        <div className={cn('px-4', className)}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                    Perto de você
                </h3>
                <span className="text-xs text-muted-foreground">
                    • {bairroName}
                </span>
            </div>

            {/* Bento Grid */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-3 gap-2"
            >
                {items.slice(0, 3).map((item, index) => {
                    const Icon = typeIcons[item.type] || MapPin;
                    const colorClass = typeColors[item.type] || typeColors.alerta;

                    return (
                        <motion.button
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleItemClick(item)}
                            className={cn(
                                'relative flex flex-col items-start p-3 rounded-xl',
                                'border min-h-[80px]',
                                colorClass
                            )}
                        >
                            {/* Icon */}
                            <Icon className="h-4 w-4 mb-1" />

                            {/* Count or title */}
                            {item.count !== undefined ? (
                                <>
                                    <span className="text-lg font-bold leading-tight">
                                        {item.count}
                                    </span>
                                    <span className="text-[10px] leading-tight opacity-80 line-clamp-2">
                                        {item.title}
                                    </span>
                                </>
                            ) : (
                                <span className="text-xs font-medium leading-tight line-clamp-2">
                                    {item.title}
                                </span>
                            )}

                            {/* Chevron */}
                            <ChevronRight className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 opacity-50" />
                        </motion.button>
                    );
                })}
            </motion.div>
        </div>
    );
}

export default NearYouBento;
