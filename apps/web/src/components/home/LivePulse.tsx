/**
 * LivePulse - Animated indicator showing real-time connection
 * Pulses to show the app is live and connected
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface LivePulseProps {
    label?: string;
    size?: 'sm' | 'md';
    showLabel?: boolean;
}

export default function LivePulse({
    label = 'Ao vivo',
    size = 'sm',
    showLabel = true,
}: LivePulseProps) {
    const { isOnline } = useNetworkStatus();

    const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
    const pulseSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

    if (!isOnline) {
        return (
            <div className="flex items-center gap-1.5">
                <div className={`${dotSize} rounded-full bg-amber-500`} />
                {showLabel && (
                    <span className="text-xs text-primary-foreground/70">Offline</span>
                )}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1.5">
            <div className="relative">
                {/* Pulse ring */}
                <motion.div
                    className={`absolute ${pulseSize} rounded-full bg-green-500/50`}
                    animate={{
                        scale: [1, 1.8, 1],
                        opacity: [0.7, 0, 0.7],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeOut',
                    }}
                    style={{
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)'
                    }}
                />

                {/* Solid dot */}
                <motion.div
                    className={`relative ${dotSize} rounded-full bg-green-500`}
                    animate={{
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            </div>

            {showLabel && (
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-primary-foreground/70 font-medium"
                >
                    {label}
                </motion.span>
            )}
        </div>
    );
}

/**
 * LiveBadge - Compact badge version for cards
 */
export function LiveBadge() {
    const { isOnline } = useNetworkStatus();

    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
        ${isOnline
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}
        >
            <motion.div
                className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-amber-500'}`}
                animate={isOnline ? {
                    scale: [1, 1.3, 1],
                    opacity: [1, 0.7, 1],
                } : {}}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                }}
            />
            <span>{isOnline ? 'Ao vivo' : 'Offline'}</span>
        </motion.div>
    );
}
