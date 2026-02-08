/**
 * TijucanosCounter - Gamification Counter Component
 * 
 * Shows the number of registered Tijucanos with animated progress bar
 * using dynamic milestone goals that adapt as the community grows.
 * 
 * Features:
 * - Animated counter with spring physics
 * - Progress bar per "degrau" (stage), not total
 * - Motivational messages that change per tier
 * - Confetti celebration when reaching milestones
 * - Web Share API for inviting friends
 */

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { Users, Share2, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TijucanosCounterPayload } from '@/types/home.types';
import { hapticFeedback } from '@/hooks/useHaptics';
import confetti from 'canvas-confetti';
import { useCityName, useAppName } from '@/hooks/useCityName';

interface TijucanosCounterProps {
    data?: TijucanosCounterPayload;
    isLoading?: boolean;
    className?: string;
}

// LocalStorage key to avoid repeated confetti
const LAST_GOAL_KEY = 'etijucas:last_goal_seen';

// Skeleton component
function TijucanosSkeleton() {
    return (
        <div className="animate-pulse rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 p-4 border border-primary/20">
            <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary/20" />
                <div className="flex-1">
                    <div className="h-6 w-24 rounded bg-primary/20 mb-1" />
                    <div className="h-3 w-32 rounded bg-primary/20" />
                </div>
            </div>
            <div className="h-2 w-full rounded-full bg-primary/20 mb-2" />
            <div className="h-4 w-3/4 rounded bg-primary/20 mx-auto" />
        </div>
    );
}

export function TijucanosCounter({ data, isLoading, className }: TijucanosCounterProps) {
    const [hasAnimated, setHasAnimated] = useState(false);
    const prevTotalRef = useRef<number | null>(null);
    const { name: cityName } = useCityName();
    const appName = useAppName();

    // Show skeleton while loading
    if (isLoading && !data) {
        return <TijucanosSkeleton />;
    }

    // If no data, show placeholder
    if (!data) {
        return (
            <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 p-4 border border-primary/20 text-center text-muted-foreground">
                <Users className="h-6 w-6 mx-auto mb-2 text-primary/50" />
                <p className="text-sm">Carregando comunidade...</p>
            </div>
        );
    }

    const { total, verified, new_today, goal } = data;

    // Animated counter
    const springValue = useSpring(0, { stiffness: 50, damping: 15 });
    const displayValue = useTransform(springValue, (value) =>
        Math.floor(value).toLocaleString('pt-BR')
    );

    // Animated progress bar (stage progress, not total)
    const progressSpring = useSpring(0, { stiffness: 80, damping: 20 });

    // Check if we just reached a new goal (for confetti)
    useEffect(() => {
        const lastGoal = localStorage.getItem(LAST_GOAL_KEY);
        const lastGoalNum = lastGoal ? parseInt(lastGoal, 10) : 0;

        if (goal.target > lastGoalNum && total >= goal.stage_start && goal.progress >= 1) {
            // We just reached a milestone!
            localStorage.setItem(LAST_GOAL_KEY, goal.target.toString());

            setTimeout(() => {
                confetti({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.6 },
                    colors: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899'],
                });
            }, 300);
        }
    }, [goal.target, goal.progress, goal.stage_start, total]);

    // Animate on mount
    useEffect(() => {
        if (!hasAnimated && total > 0) {
            springValue.set(total);
            progressSpring.set(goal.progress_pct);
            setHasAnimated(true);
        }
    }, [total, goal.progress_pct, hasAnimated, springValue, progressSpring]);

    // Handle share with haptic feedback
    const handleShare = async () => {
        hapticFeedback('medium');

        const shareData = {
            title: `${appName} - A cidade na palma da mão`,
            text: `Já somos ${total.toLocaleString('pt-BR')} cidadãos no ${appName}! Junte-se a nós.`,
            url: `https://${appName.toLowerCase()}.com.br`,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                hapticFeedback('success');
            }
        } catch (err) {
            console.log('Share cancelled or failed');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(
                'relative overflow-hidden rounded-2xl',
                'bg-gradient-to-br from-primary/5 via-primary/10 to-emerald-500/10',
                'border border-primary/20 p-4',
                className
            )}
        >
            {/* Background decoration */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
            <div className="absolute -left-4 -bottom-4 h-20 w-20 rounded-full bg-emerald-500/10 blur-xl" />

            {/* Header */}
            <div className="relative flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                        <Users className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                        Cidadãos no {appName}
                    </span>
                </div>

                {/* New today badge */}
                {new_today > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1"
                    >
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                        <span className="text-xs font-medium text-emerald-600">
                            +{new_today} hoje
                        </span>
                    </motion.div>
                )}
            </div>

            {/* Main counter */}
            <div className="relative flex items-baseline gap-2 mb-2">
                <motion.span className="text-3xl font-bold text-foreground tabular-nums">
                    {displayValue}
                </motion.span>
                <span className="text-sm text-muted-foreground">
                    / {goal.target.toLocaleString('pt-BR')}
                </span>
            </div>

            {/* Motivational message */}
            <p className="text-xs text-muted-foreground mb-3">
                {goal.message}
            </p>

            {/* Progress bar */}
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted mb-3">
                <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-emerald-500"
                    style={{ width: useTransform(progressSpring, (v) => `${Math.min(v, 100)}%`) }}
                />

                {/* Shimmer effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                />
            </div>

            {/* Footer with remaining count and share button */}
            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                    Faltam <span className="font-semibold text-foreground">{goal.remaining.toLocaleString('pt-BR')}</span> para bater a meta!
                </span>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShare}
                    className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                    <Share2 className="h-3.5 w-3.5" />
                    Convidar
                </motion.button>
            </div>

            {/* Sparkles decoration for high progress */}
            {goal.progress_pct > 80 && (
                <motion.div
                    className="absolute right-2 top-2"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    <Sparkles className="h-4 w-4 text-amber-400" />
                </motion.div>
            )}
        </motion.div>
    );
}

export default TijucanosCounter;
