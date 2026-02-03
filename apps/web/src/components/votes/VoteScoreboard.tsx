import { motion } from 'framer-motion';
import { Vote as VoteIcon } from 'lucide-react';
import { VoteCounts } from '@/types/votes';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';

interface VoteScoreboardProps {
    counts: VoteCounts;
    status: 'approved' | 'rejected';
    className?: string;
}

function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            const current = Math.round(value * eased);

            setDisplayValue(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    return <span>{displayValue}</span>;
}

export function VoteScoreboard({ counts, status, className }: VoteScoreboardProps) {
    const [chartProgress, setChartProgress] = useState(0);
    const chartRef = useRef<HTMLDivElement>(null);

    const total = counts.sim + counts.nao + counts.abstencao + counts.naoVotou;
    const simPercentage = total > 0 ? (counts.sim / total) * 100 : 0;
    const naoPercentage = total > 0 ? (counts.nao / total) * 100 : 0;

    // Animate the donut chart
    useEffect(() => {
        const startTime = Date.now();
        const duration = 1500;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            setChartProgress(eased);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, []);

    // Calculate the conic gradient based on progress
    const simDegrees = simPercentage * 3.6 * chartProgress;
    const naoDegrees = naoPercentage * 3.6 * chartProgress;
    const othersPercentage = 100 - simPercentage - naoPercentage;
    const othersDegrees = othersPercentage * 3.6 * chartProgress;

    const conicGradient = `conic-gradient(
    #22c55e 0deg ${simDegrees}deg,
    #ef4444 ${simDegrees}deg ${simDegrees + naoDegrees}deg,
    #9ca3af ${simDegrees + naoDegrees}deg ${simDegrees + naoDegrees + othersDegrees}deg,
    #e5e7eb ${simDegrees + naoDegrees + othersDegrees}deg 360deg
  )`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('flex items-center justify-between gap-4', className)}
        >
            {/* Score Display */}
            <div className="flex flex-col gap-3">
                {/* Large Score */}
                <div className="flex items-baseline gap-2">
                    <motion.span
                        className="text-5xl font-extrabold text-foreground tabular-nums tracking-tight"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                        <AnimatedNumber value={counts.sim} />
                    </motion.span>
                    <span className="text-2xl text-muted-foreground font-medium">×</span>
                    <motion.span
                        className="text-5xl font-extrabold text-foreground tabular-nums tracking-tight"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                    >
                        <AnimatedNumber value={counts.nao} />
                    </motion.span>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="text-green-600 dark:text-green-400 font-medium">
                            {counts.sim} {counts.sim === 1 ? 'voto' : 'votos'} Sim
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="text-red-600 dark:text-red-400 font-medium">
                            {counts.nao} {counts.nao === 1 ? 'voto' : 'votos'} Não
                        </span>
                    </div>
                    {(counts.abstencao > 0 || counts.naoVotou > 0) && (
                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                            <span className="text-muted-foreground font-medium">
                                {counts.abstencao + counts.naoVotou} outros
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Donut Chart */}
            <motion.div
                ref={chartRef}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.2 }}
                className="relative w-28 h-28 shrink-0 rounded-full flex items-center justify-center"
                style={{ background: conicGradient }}
            >
                {/* Inner Circle (Hole) */}
                <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center shadow-inner">
                    <VoteIcon className="w-7 h-7 text-muted-foreground" />
                </div>
            </motion.div>
        </motion.div>
    );
}
