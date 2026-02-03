/**
 * EventsCarousel - Enhanced Horizontal Events Carousel
 * Shows upcoming events with week count and modern styling
 */

import React, { useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, ChevronRight, Sparkles, Ticket } from 'lucide-react';
import { TabId } from '@/components/layout/BottomTabBar';
import { hapticFeedback } from '@/hooks/useHaptics';
import { SkeletonEventCard } from './SkeletonCards';
import { useEvents } from '@/hooks/queries/useEventsApi';
import { addDays, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventsCarouselProps {
    onNavigate: (tab: TabId) => void;
    onEventClick?: (eventId: string) => void;
}

// Gradient colors for event cards - more vibrant
const cardGradients = [
    'from-violet-500 via-purple-500 to-fuchsia-500',
    'from-cyan-500 via-blue-500 to-indigo-500',
    'from-rose-500 via-pink-500 to-orange-400',
    'from-emerald-500 via-teal-500 to-cyan-500',
    'from-amber-500 via-orange-500 to-red-500',
];

export default function EventsCarousel({
    onNavigate,
    onEventClick,
}: EventsCarouselProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch events from real API
    const { data: eventsResponse, isLoading } = useEvents({
        perPage: 15,
        orderBy: 'startDateTime',
        order: 'asc',
    });

    const events = eventsResponse?.data ?? [];

    // Calculate events count for this week (next 7 days)
    const weekEventsCount = useMemo(() => {
        if (!events || events.length === 0) return 0;
        const now = startOfDay(new Date());
        const weekEnd = endOfDay(addDays(now, 7));

        return events.filter((event) => {
            try {
                const eventDate = parseISO(event.startDateTime);
                return isWithinInterval(eventDate, { start: now, end: weekEnd });
            } catch {
                return false;
            }
        }).length;
    }, [events]);

    // Calculate today's events count
    const todayEventsCount = useMemo(() => {
        if (!events || events.length === 0) return 0;
        const today = new Date().toDateString();
        return events.filter((event) => {
            try {
                return parseISO(event.startDateTime).toDateString() === today;
            } catch {
                return false;
            }
        }).length;
    }, [events]);

    const formatEventDate = (dateStr: string) => {
        try {
            const d = parseISO(dateStr);
            const today = new Date();
            const tomorrow = addDays(today, 1);

            if (d.toDateString() === today.toDateString()) {
                return 'Hoje';
            } else if (d.toDateString() === tomorrow.toDateString()) {
                return 'Amanhã';
            } else {
                return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
            }
        } catch {
            return 'Em breve';
        }
    };

    const formatTime = (dateStr: string) => {
        try {
            return parseISO(dateStr).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '--:--';
        }
    };

    const handleEventTap = (eventId: string) => {
        hapticFeedback('selection');
        onEventClick?.(eventId);
    };

    if (isLoading) {
        return (
            <div className="py-5">
                <div className="flex items-center justify-between px-4 mb-4">
                    <div className="h-7 w-44 skeleton-shimmer rounded-lg" />
                    <div className="h-5 w-20 skeleton-shimmer rounded-lg" />
                </div>
                <div className="flex gap-3 px-4 overflow-hidden">
                    <SkeletonEventCard />
                    <SkeletonEventCard />
                </div>
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="py-5 px-4">
                <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/50 p-6 text-center">
                    <Calendar className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                    <h3 className="font-semibold text-muted-foreground">Nenhum evento próximo</h3>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                        Confira a agenda completa para ver todos os eventos
                    </p>
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onNavigate('agenda')}
                        className="mt-4 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium"
                    >
                        Ver Agenda
                    </motion.button>
                </div>
            </div>
        );
    }

    return (
        <div className="py-5">
            {/* Enhanced Header with Stats */}
            <div className="px-4 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            {todayEventsCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-sm">
                                    {todayEventsCount}
                                </span>
                            )}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Próximos Eventos</h2>
                            <p className="text-xs text-muted-foreground">
                                <span className="font-semibold text-primary">{weekEventsCount}</span> eventos nesta semana
                            </p>
                        </div>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            hapticFeedback('light');
                            onNavigate('agenda');
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-muted hover:bg-muted/80 rounded-full text-sm font-medium text-foreground transition-colors"
                    >
                        Ver todos
                        <ChevronRight className="w-4 h-4" />
                    </motion.button>
                </div>

                {/* Week summary badges */}
                <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0",
                            todayEventsCount > 0
                                ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                                : "bg-muted text-muted-foreground"
                        )}
                    >
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Hoje: {todayEventsCount}
                    </motion.button>
                    <motion.div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary shrink-0"
                    >
                        <Calendar className="w-3 h-3" />
                        Semana: {weekEventsCount}
                    </motion.div>
                    <motion.div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shrink-0"
                    >
                        <Ticket className="w-3 h-3" />
                        Gratuitos: {events.filter(e => e.ticket?.type === 'free').length}
                    </motion.div>
                </div>
            </div>

            {/* Horizontal scroll container */}
            <div
                ref={containerRef}
                className="overflow-x-auto scrollbar-hide"
            >
                <motion.div
                    className="flex gap-3 px-4 pb-2"
                    drag="x"
                    dragConstraints={containerRef}
                    dragElastic={0.1}
                    onDragStart={() => hapticFeedback('selection')}
                >
                    {events.slice(0, 10).map((event, index) => (
                        <motion.button
                            key={event.id}
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: index * 0.06, type: 'spring', stiffness: 200 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleEventTap(event.id)}
                            className={cn(
                                "flex-shrink-0 w-72 h-36 rounded-2xl p-4 text-white text-left overflow-hidden relative group",
                                "bg-gradient-to-br shadow-lg",
                                cardGradients[index % cardGradients.length]
                            )}
                        >
                            {/* Glassmorphism overlay */}
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* Background decorative elements */}
                            <div className="absolute inset-0 overflow-hidden opacity-20">
                                <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/30 blur-xl" />
                                <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-white/20 blur-2xl" />
                            </div>

                            {/* Free badge */}
                            {event.ticket?.type === 'free' && (
                                <div className="absolute top-3 right-3 px-2 py-0.5 bg-white/25 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wide">
                                    Grátis
                                </div>
                            )}

                            {/* Content */}
                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-xs opacity-90">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span className="font-medium">{formatEventDate(event.startDateTime)}</span>
                                        <span className="opacity-60">•</span>
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{formatTime(event.startDateTime)}</span>
                                    </div>
                                    <h3 className="font-bold mt-2 line-clamp-2 leading-snug text-[15px]">
                                        {event.title}
                                    </h3>
                                </div>

                                <div className="flex items-center gap-1.5 text-xs opacity-80">
                                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">
                                        {event.venue?.name ?? 'Tijucas'}
                                        {event.venue?.bairro?.nome && ` • ${event.venue.bairro.nome}`}
                                    </span>
                                </div>
                            </div>
                        </motion.button>
                    ))}

                    {/* See all card */}
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: events.length * 0.06 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                            hapticFeedback('light');
                            onNavigate('agenda');
                        }}
                        className={cn(
                            "flex-shrink-0 w-36 h-36 rounded-2xl",
                            "bg-gradient-to-br from-muted/80 to-muted border-2 border-dashed border-primary/30",
                            "flex flex-col items-center justify-center gap-3",
                            "text-primary hover:border-primary/50 transition-colors"
                        )}
                    >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-semibold">Ver agenda</span>
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );
}
