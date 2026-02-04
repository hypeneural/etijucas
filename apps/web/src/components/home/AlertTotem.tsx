/**
 * AlertTotem - Animated Alert Ticker
 * 
 * A horizontal scrolling ticker that displays active city alerts.
 * Auto-rotates through alerts with smooth animations.
 * Much more compact than AlertBanner - designed to be always visible.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    Construction,
    CloudRain,
    Calendar,
    ShieldAlert,
    Info,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertItem } from '@/types/home.types';
import { hapticFeedback } from '@/hooks/useHaptics';

interface AlertTotemProps {
    alerts: AlertItem[];
    onAlertClick?: (alert: AlertItem) => void;
    onDismiss?: (alertId: string) => void;
    className?: string;
}

// Icons by alert type
const alertIcons: Record<AlertItem['tipo'], React.ElementType> = {
    obras: Construction,
    interdicao: AlertTriangle,
    clima: CloudRain,
    evento: Calendar,
    seguranca: ShieldAlert,
};

// Colors by level
const levelColors: Record<AlertItem['nivel'], string> = {
    info: 'from-blue-500 to-sky-500',
    warning: 'from-amber-500 to-orange-500',
    critical: 'from-red-500 to-rose-600',
};

const levelBg: Record<AlertItem['nivel'], string> = {
    info: 'bg-blue-500/10',
    warning: 'bg-amber-500/10',
    critical: 'bg-red-500/10',
};

export function AlertTotem({
    alerts,
    onAlertClick,
    onDismiss,
    className
}: AlertTotemProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const [isPaused, setIsPaused] = useState(false);

    // Filter out dismissed alerts
    const visibleAlerts = alerts.filter(a => !dismissed.has(a.id));
    const currentAlert = visibleAlerts[currentIndex % Math.max(1, visibleAlerts.length)];

    // Auto-rotate every 5 seconds
    useEffect(() => {
        if (visibleAlerts.length <= 1 || isPaused) return;

        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % visibleAlerts.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [visibleAlerts.length, isPaused]);

    // Reset index if it's out of bounds
    useEffect(() => {
        if (currentIndex >= visibleAlerts.length) {
            setCurrentIndex(0);
        }
    }, [visibleAlerts.length, currentIndex]);

    if (!currentAlert || visibleAlerts.length === 0) {
        return null;
    }

    const Icon = alertIcons[currentAlert.tipo] || Info;
    const gradientClass = levelColors[currentAlert.nivel] || levelColors.info;
    const bgClass = levelBg[currentAlert.nivel] || levelBg.info;

    const handleClick = () => {
        hapticFeedback('selection');
        onAlertClick?.(currentAlert);
    };

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        hapticFeedback('light');
        setDismissed(prev => new Set(prev).add(currentAlert.id));
        onDismiss?.(currentAlert.id);
    };

    const handleNext = () => {
        if (visibleAlerts.length > 1) {
            hapticFeedback('light');
            setCurrentIndex(prev => (prev + 1) % visibleAlerts.length);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn('px-4 py-2', className)}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setTimeout(() => setIsPaused(false), 3000)}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentAlert.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    onClick={handleClick}
                    className={cn(
                        'relative flex items-center gap-3 p-3 rounded-xl cursor-pointer',
                        bgClass,
                        'border border-current/10'
                    )}
                >
                    {/* Icon with gradient background */}
                    <motion.div
                        className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full',
                            'bg-gradient-to-br text-white',
                            gradientClass
                        )}
                        animate={{
                            scale: currentAlert.nivel === 'critical' ? [1, 1.1, 1] : 1
                        }}
                        transition={{
                            repeat: currentAlert.nivel === 'critical' ? Infinity : 0,
                            duration: 1.5
                        }}
                    >
                        <Icon className="h-4 w-4" />
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                            {currentAlert.titulo}
                        </p>
                        {currentAlert.descricao && (
                            <p className="text-xs text-muted-foreground truncate">
                                {currentAlert.descricao}
                            </p>
                        )}
                    </div>

                    {/* Counter + Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Alert counter - clickable to navigate */}
                        {visibleAlerts.length > 1 && (
                            <motion.button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNext();
                                }}
                                whileTap={{ scale: 0.9 }}
                                className="px-2 py-0.5 rounded-full bg-foreground/10 text-xs font-medium text-foreground hover:bg-foreground/20 transition-colors"
                            >
                                {currentIndex + 1}/{visibleAlerts.length}
                            </motion.button>
                        )}

                        {/* Dismiss */}
                        <motion.button
                            onClick={handleDismiss}
                            whileTap={{ scale: 0.8 }}
                            className="p-1 rounded-full hover:bg-foreground/10 transition-colors"
                            aria-label="Fechar alerta"
                        >
                            <X className="h-4 w-4 text-muted-foreground" />
                        </motion.button>
                    </div>

                    {/* Progress bar for auto-rotation */}
                    {visibleAlerts.length > 1 && !isPaused && (
                        <motion.div
                            className="absolute bottom-0 left-0 h-0.5 bg-foreground/20 rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 5, ease: 'linear' }}
                            key={`progress-${currentIndex}`}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}

export default AlertTotem;
