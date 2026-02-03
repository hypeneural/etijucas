import { motion } from 'framer-motion';
import { Check, X, Pause, Minus } from 'lucide-react';
import { VoteCounts } from '@/types/votes';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface VoteSummaryCardsProps {
    counts: VoteCounts;
    className?: string;
}

const CARD_CONFIG = [
    {
        key: 'sim',
        label: 'Sim',
        icon: Check,
        bgColor: 'bg-green-50 dark:bg-green-950/30',
        iconBg: 'bg-green-500',
        textColor: 'text-green-700 dark:text-green-400',
        borderColor: 'border-green-200 dark:border-green-800/50',
    },
    {
        key: 'nao',
        label: 'Não',
        icon: X,
        bgColor: 'bg-red-50 dark:bg-red-950/30',
        iconBg: 'bg-red-500',
        textColor: 'text-red-700 dark:text-red-400',
        borderColor: 'border-red-200 dark:border-red-800/50',
    },
    {
        key: 'abstencao',
        label: 'Abstenção',
        icon: Pause,
        bgColor: 'bg-amber-50 dark:bg-amber-950/30',
        iconBg: 'bg-amber-500',
        textColor: 'text-amber-700 dark:text-amber-400',
        borderColor: 'border-amber-200 dark:border-amber-800/50',
    },
    {
        key: 'naoVotou',
        label: 'Ausente',
        icon: Minus,
        bgColor: 'bg-gray-50 dark:bg-gray-800/30',
        iconBg: 'bg-gray-400',
        textColor: 'text-gray-600 dark:text-gray-400',
        borderColor: 'border-gray-200 dark:border-gray-700',
    },
] as const;

function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const startTime = Date.now();
        const startValue = 0;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth deceleration
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(startValue + (value - startValue) * eased);

            setDisplayValue(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    return <span>{displayValue}</span>;
}

export function VoteSummaryCards({ counts, className }: VoteSummaryCardsProps) {
    return (
        <div className={cn('grid grid-cols-4 gap-2', className)}>
            {CARD_CONFIG.map((config, index) => {
                const Icon = config.icon;
                const count = counts[config.key as keyof VoteCounts];

                return (
                    <motion.div
                        key={config.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                            'flex flex-col items-center gap-1.5 p-3 rounded-xl border',
                            config.bgColor,
                            config.borderColor
                        )}
                    >
                        <div className={cn(
                            'flex items-center justify-center w-8 h-8 rounded-full',
                            config.iconBg
                        )}>
                            <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
                        </div>
                        <span className={cn('text-2xl font-bold tabular-nums', config.textColor)}>
                            <AnimatedCounter value={count} duration={800} />
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                            {config.label}
                        </span>
                    </motion.div>
                );
            })}
        </div>
    );
}
