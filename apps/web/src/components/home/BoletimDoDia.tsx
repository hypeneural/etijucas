/**
 * BoletimDoDia - Daily Brief Card
 * 
 * The "morning ritual" card that summarizes everything
 * happening in Tijucas today. Designed to be the first
 * thing users check every day.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
    Sun,
    Cloud,
    CloudRain,
    AlertTriangle,
    Calendar,
    MapPin,
    MessageCircle,
    CheckCircle2,
    ChevronDown,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BoletimDoDiaPayload } from '@/types/home.types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BoletimDoDiaProps {
    data?: BoletimDoDiaPayload;
    isLoading?: boolean;
    onMarkAsRead?: () => void;
    className?: string;
}

// Weather icon based on weather code
function WeatherIcon({ code, className }: { code: number; className?: string }) {
    // Simplified weather code mapping
    if (code === 0 || code === 1) {
        return <Sun className={cn('text-amber-500', className)} />;
    }
    if (code >= 2 && code <= 3) {
        return <Cloud className={cn('text-gray-400', className)} />;
    }
    if (code >= 51 && code <= 99) {
        return <CloudRain className={cn('text-blue-500', className)} />;
    }
    return <Sun className={cn('text-amber-500', className)} />;
}

// Format date in Portuguese
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    };
    return date.toLocaleDateString('pt-BR', options);
}

// Skeleton component for loading state
function BoletimSkeleton() {
    return (
        <div className="animate-pulse rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 p-4 border border-primary/20">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded bg-primary/20" />
                    <div className="h-5 w-32 rounded bg-primary/20" />
                </div>
                <div className="h-4 w-20 rounded bg-primary/20" />
            </div>
            <div className="space-y-2">
                <div className="h-4 w-3/4 rounded bg-primary/20" />
                <div className="h-4 w-1/2 rounded bg-primary/20" />
            </div>
        </div>
    );
}

export function BoletimDoDia({ data, isLoading, onMarkAsRead, className }: BoletimDoDiaProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasBeenRead, setHasBeenRead] = useState(false);

    // Show skeleton while loading or if no data
    if (isLoading && !data) {
        return <BoletimSkeleton />;
    }

    // If no data and not loading, show placeholder
    if (!data) {
        return (
            <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 p-4 border border-primary/20 text-center text-muted-foreground">
                <Sparkles className="h-6 w-6 mx-auto mb-2 text-primary/50" />
                <p className="text-sm">Carregando boletim do dia...</p>
            </div>
        );
    }

    const handleMarkAsRead = () => {
        setHasBeenRead(true);
        onMarkAsRead?.();
    };

    // Build the summary lines
    const summaryLines = [];

    // Weather line
    summaryLines.push({
        icon: <WeatherIcon code={data.clima?.icon || 0} className="h-4 w-4" />,
        text: data.clima?.frase || `${data.clima?.temp || 25}°C hoje`,
        color: 'text-foreground',
    });

    // Alerts line (if any)
    if (data.alertas_count > 0) {
        summaryLines.push({
            icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
            text: data.alerta_destaque || `${data.alertas_count} alerta(s) ativo(s)`,
            color: 'text-amber-600',
        });
    }

    // Events line
    if (data.eventos_count > 0) {
        summaryLines.push({
            icon: <Calendar className="h-4 w-4 text-primary" />,
            text: `${data.eventos_count} evento(s) hoje`,
            color: 'text-primary',
        });
    }

    // Fiscaliza line
    if (data.fiscaliza_destaque) {
        summaryLines.push({
            icon: <MapPin className="h-4 w-4 text-orange-500" />,
            text: `Em alta: ${data.fiscaliza_destaque.titulo.substring(0, 40)}...`,
            color: 'text-orange-600',
        });
    }

    // Forum line
    if (data.forum_destaque) {
        summaryLines.push({
            icon: <MessageCircle className="h-4 w-4 text-purple-500" />,
            text: `Discussão: ${data.forum_destaque.titulo.substring(0, 35)}...`,
            color: 'text-purple-600',
        });
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'relative overflow-hidden rounded-2xl',
                'bg-gradient-to-br from-card via-card to-primary/5',
                'border border-border shadow-sm',
                className
            )}
        >
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">
                                📋 Boletim do Dia
                            </h3>
                            <p className="text-xs text-muted-foreground capitalize">
                                {formatDate(data.date)}
                            </p>
                        </div>
                    </div>

                    {/* Read status */}
                    {hasBeenRead ? (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1"
                        >
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            <span className="text-xs font-medium text-emerald-600">Visto</span>
                        </motion.div>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleMarkAsRead}
                            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        >
                            Vi o boletim ✓
                        </motion.button>
                    )}
                </div>
            </div>

            {/* Summary lines */}
            <div className="px-4 py-3 space-y-2">
                <AnimatePresence mode="popLayout">
                    {summaryLines.slice(0, isExpanded ? summaryLines.length : 3).map((line, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-3"
                        >
                            {line.icon}
                            <span className={cn('text-sm', line.color)}>{line.text}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Expand button (if more than 3 lines) */}
            {summaryLines.length > 3 && (
                <motion.button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex w-full items-center justify-center gap-1 border-t border-border/50 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                    <span>{isExpanded ? 'Ver menos' : `+${summaryLines.length - 3} itens`}</span>
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="h-4 w-4" />
                    </motion.div>
                </motion.button>
            )}

            {/* Decorative corner */}
            <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-primary/5 blur-xl" />
        </motion.div>
    );
}

export default BoletimDoDia;
