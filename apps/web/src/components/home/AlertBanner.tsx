/**
 * AlertBanner - Sticky animated alert banner for important notifications
 * Shows at the top when there are active city alerts
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ChevronRight, Construction, CloudRain, Calendar, Info } from 'lucide-react';
import { Alert } from '@/types';
import { hapticFeedback } from '@/hooks/useHaptics';

interface AlertBannerProps {
    alerts: Alert[];
    onDismiss?: (alertId: string) => void;
    onTap?: (alert: Alert) => void;
}

const alertIcons: Record<Alert['tipo'], React.ElementType> = {
    obras: Construction,
    interdicao: AlertTriangle,
    evento: Calendar,
    clima: CloudRain,
};

const alertColors: Record<Alert['tipo'], string> = {
    obras: 'from-orange-600 to-amber-500',
    interdicao: 'from-red-600 to-rose-500',
    evento: 'from-blue-600 to-sky-500',
    clima: 'from-slate-600 to-slate-500',
};

export default function AlertBanner({ alerts, onDismiss, onTap }: AlertBannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    const visibleAlerts = alerts.filter(a => !dismissed.has(a.id));
    const currentAlert = visibleAlerts[currentIndex % visibleAlerts.length];

    if (!currentAlert || visibleAlerts.length === 0) {
        return null;
    }

    const Icon = alertIcons[currentAlert.tipo] || Info;
    const colorClass = alertColors[currentAlert.tipo] || 'from-gray-600 to-gray-500';

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        hapticFeedback('light');
        setDismissed(prev => new Set(prev).add(currentAlert.id));
        onDismiss?.(currentAlert.id);
    };

    const handleTap = () => {
        hapticFeedback('selection');
        onTap?.(currentAlert);
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (visibleAlerts.length > 1) {
            setCurrentIndex(prev => (prev + 1) % visibleAlerts.length);
        }
    };

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={currentAlert.id}
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="sticky top-0 z-50"
            >
                {/* Changed from button to div with role="button" to allow nested interactive elements */}
                <motion.div
                    role="button"
                    tabIndex={0}
                    onClick={handleTap}
                    onKeyDown={(e) => e.key === 'Enter' && handleTap()}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full bg-gradient-to-r ${colorClass} 
            p-3 shadow-lg text-white text-left cursor-pointer`}
                >
                    <div className="flex items-center gap-3">
                        {/* Animated icon */}
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: currentAlert.tipo === 'interdicao' ? [0, -5, 5, 0] : 0,
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                repeatDelay: 2,
                            }}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                        </motion.div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                                {currentAlert.titulo}
                            </p>
                            <p className="text-xs opacity-80 truncate">
                                {currentAlert.descricao}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Alert counter */}
                            {visibleAlerts.length > 1 && (
                                <motion.button
                                    onClick={handleNext}
                                    whileTap={{ scale: 0.9 }}
                                    className="text-xs bg-white/20 px-2 py-0.5 rounded-full hover:bg-white/30 transition-colors"
                                >
                                    {currentIndex + 1}/{visibleAlerts.length}
                                </motion.button>
                            )}

                            {/* See more */}
                            <ChevronRight className="w-4 h-4 opacity-60" />

                            {/* Dismiss */}
                            <motion.button
                                onClick={handleDismiss}
                                whileTap={{ scale: 0.8 }}
                                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                                aria-label="Fechar alerta"
                            >
                                <X className="w-4 h-4" />
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
