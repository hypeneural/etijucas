/**
 * PullToRefresh - Componente de pull-to-refresh nativo
 * Com animação de mola e feedback háptico
 */

import { useState, useRef, useCallback, type ReactNode } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { haptic } from '@/hooks/useHaptic';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: ReactNode;
    className?: string;
    threshold?: number; // Pixels to pull before triggering
    disabled?: boolean;
}

export function PullToRefresh({
    onRefresh,
    children,
    className,
    threshold = 80,
    disabled = false,
}: PullToRefreshProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isPulling, setIsPulling] = useState(false);
    const startY = useRef<number | null>(null);
    const controls = useAnimation();
    const pullDistance = useMotionValue(0);

    // Transforms
    const indicatorOpacity = useTransform(pullDistance, [0, threshold / 2], [0, 1]);
    const indicatorScale = useTransform(pullDistance, [0, threshold], [0.5, 1]);
    const indicatorRotation = useTransform(pullDistance, [0, threshold], [0, 180]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (disabled || isRefreshing) return;
        // Only trigger if at top of scroll
        const target = e.currentTarget;
        if (target.scrollTop <= 0) {
            startY.current = e.touches[0].clientY;
            setIsPulling(true);
        }
    }, [disabled, isRefreshing]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!startY.current || disabled || isRefreshing) return;

        const currentY = e.touches[0].clientY;
        const diff = Math.max(0, currentY - startY.current);

        // Apply resistance
        const resistance = 0.4;
        const pulled = diff * resistance;

        pullDistance.set(pulled);

        // Haptic when crossing threshold
        if (pulled >= threshold && pullDistance.getPrevious() < threshold) {
            haptic('medium');
        }
    }, [disabled, isRefreshing, threshold, pullDistance]);

    const handleTouchEnd = useCallback(async () => {
        if (disabled || isRefreshing) return;

        const pulled = pullDistance.get();
        startY.current = null;
        setIsPulling(false);

        if (pulled >= threshold) {
            // Trigger refresh
            haptic('success');
            setIsRefreshing(true);

            // Animate to loading position
            await controls.start({ y: threshold, transition: { type: 'spring', damping: 20 } });

            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                controls.start({ y: 0, transition: { type: 'spring', damping: 25, stiffness: 500 } });
                pullDistance.set(0);
            }
        } else {
            // Spring back
            controls.start({ y: 0, transition: { type: 'spring', damping: 25, stiffness: 500 } });
            pullDistance.set(0);
        }
    }, [disabled, isRefreshing, threshold, pullDistance, controls, onRefresh]);

    return (
        <div className={cn("relative overflow-hidden", className)}>
            {/* Pull indicator */}
            <motion.div
                style={{ opacity: indicatorOpacity }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
            >
                <motion.div
                    style={{
                        scale: indicatorScale,
                        rotate: isRefreshing ? undefined : indicatorRotation
                    }}
                    animate={isRefreshing ? { rotate: 360 } : undefined}
                    transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : undefined}
                    className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center"
                >
                    <Icon
                        icon={isRefreshing ? "mdi:loading" : "mdi:arrow-down"}
                        className={cn(
                            "h-5 w-5 text-primary",
                            isRefreshing && "animate-spin"
                        )}
                    />
                </motion.div>
            </motion.div>

            {/* Content */}
            <motion.div
                animate={controls}
                style={{ y: isPulling ? pullDistance : 0 }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="min-h-full"
            >
                {children}
            </motion.div>
        </div>
    );
}

export default PullToRefresh;
