/**
 * FiscalizaMiniMap - Compact Map Preview
 * 
 * A lightweight static map preview that shows 3 recent report pins
 * and a CTA to view the full interactive map.
 * Uses a static image approach for performance on mobile.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/hooks/useHaptics';

interface ReportPin {
    id: string;
    lat: number;
    lng: number;
    tipo: string;
    status: 'recebido' | 'em_analise' | 'resolvido';
}

interface FiscalizaMiniMapProps {
    pins?: ReportPin[];
    className?: string;
}

// Status colors for pins
const statusColors: Record<string, string> = {
    recebido: 'bg-orange-500',
    em_analise: 'bg-blue-500',
    resolvido: 'bg-emerald-500',
};

// Tijucas center coordinates
const TIJUCAS_CENTER = { lat: -27.2419, lng: -48.6306 };

export function FiscalizaMiniMap({ pins = [], className }: FiscalizaMiniMapProps) {
    const navigate = useNavigate();
    const visiblePins = pins.slice(0, 3);

    const handleClick = () => {
        hapticFeedback('selection');
        navigate('/denuncias/mapa');
    };

    // Convert lat/lng to percentage position on the mock map
    // This is a simplified positioning - for a real map it would need proper projection
    const getPinPosition = (pin: ReportPin, index: number) => {
        // Spread pins visually for the preview
        const positions = [
            { left: '25%', top: '30%' },
            { left: '60%', top: '45%' },
            { left: '40%', top: '65%' },
        ];
        return positions[index] || positions[0];
    };

    if (visiblePins.length === 0) {
        return null; // Don't show if no pins
    }

    return (
        <motion.button
            onClick={handleClick}
            whileTap={{ scale: 0.97 }}
            className={cn(
                'relative w-full h-24 rounded-xl overflow-hidden',
                'bg-gradient-to-br from-emerald-100 to-teal-100',
                'dark:from-emerald-950/40 dark:to-teal-950/40',
                'border border-emerald-200/50 dark:border-emerald-800/30',
                'cursor-pointer group',
                className
            )}
        >
            {/* Fake map pattern */}
            <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%" className="text-emerald-600">
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            {/* Subtle "road" lines */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute left-1/4 top-0 bottom-0 w-0.5 bg-emerald-400/50" />
                <div className="absolute right-1/3 top-0 bottom-0 w-0.5 bg-emerald-400/50" />
                <div className="absolute left-0 right-0 top-1/3 h-0.5 bg-emerald-400/50" />
            </div>

            {/* Pins */}
            {visiblePins.map((pin, index) => {
                const position = getPinPosition(pin, index);
                const color = statusColors[pin.status] || statusColors.recebido;

                return (
                    <motion.div
                        key={pin.id}
                        initial={{ scale: 0, y: -10 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ delay: index * 0.15 }}
                        className="absolute"
                        style={position}
                    >
                        {/* Pin marker */}
                        <div className={cn(
                            'relative flex items-center justify-center',
                            'w-6 h-6 rounded-full shadow-md',
                            color
                        )}>
                            <MapPin className="h-3 w-3 text-white" />

                            {/* Pulse animation for pending */}
                            {pin.status !== 'resolvido' && (
                                <motion.div
                                    className={cn('absolute inset-0 rounded-full', color)}
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                                    transition={{ repeat: Infinity, duration: 2, delay: index * 0.3 }}
                                />
                            )}
                        </div>
                    </motion.div>
                );
            })}

            {/* CTA overlay */}
            <div className="absolute inset-0 flex items-end justify-center pb-2 bg-gradient-to-t from-black/20 to-transparent">
                <motion.div
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 dark:bg-black/70 text-[10px] font-medium text-foreground shadow-sm"
                    whileHover={{ scale: 1.05 }}
                >
                    <ExternalLink className="h-3 w-3" />
                    Ver mapa completo
                </motion.div>
            </div>

            {/* Pin count badge */}
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-white/80 dark:bg-black/60 text-[10px] font-medium text-foreground">
                {visiblePins.length} denúncias recentes
            </div>
        </motion.button>
    );
}

export default FiscalizaMiniMap;
