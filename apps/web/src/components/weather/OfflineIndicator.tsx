/**
 * OfflineIndicator - Visual indicators for offline/updating states
 * Mobile-first, non-intrusive, informative
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { useNetworkStatus, formatCacheAge } from '@/hooks/useOfflineWeather';
import type { CacheStatus } from '@/services/weather-cache.service';

// ======================================================
// Offline Banner (shows when offline)
// ======================================================

export function OfflineBanner({ className }: { className?: string }) {
    const { isOffline } = useNetworkStatus();

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={cn(
                        "fixed top-0 left-0 right-0 z-[100]",
                        "bg-amber-500 text-white px-4 py-2",
                        "flex items-center justify-center gap-2 text-sm font-medium",
                        "safe-area-top",
                        className
                    )}
                >
                    <Icon icon="mdi:wifi-off" className="h-4 w-4" />
                    <span>Você está offline</span>
                    <span className="text-amber-200">• Dados em cache</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ======================================================
// Cache Status Badge (inline indicator)
// ======================================================

interface CacheStatusBadgeProps {
    cacheStatus: CacheStatus;
    compact?: boolean;
    className?: string;
}

export function CacheStatusBadge({ cacheStatus, compact = false, className }: CacheStatusBadgeProps) {
    const { isOnline } = useNetworkStatus();

    // Determine what to show
    if (cacheStatus.isUpdating) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                    "flex items-center gap-1.5 text-xs",
                    "text-blue-600 dark:text-blue-400",
                    className
                )}
            >
                <Icon icon="mdi:loading" className="h-3.5 w-3.5 animate-spin" />
                {!compact && <span>Atualizando...</span>}
            </motion.div>
        );
    }

    if (!isOnline) {
        return (
            <div className={cn(
                "flex items-center gap-1.5 text-xs",
                "text-amber-600 dark:text-amber-400",
                className
            )}>
                <Icon icon="mdi:wifi-off" className="h-3.5 w-3.5" />
                {!compact && <span>Offline</span>}
            </div>
        );
    }

    if (cacheStatus.isStale) {
        return (
            <div className={cn(
                "flex items-center gap-1.5 text-xs",
                "text-amber-600 dark:text-amber-400",
                className
            )}>
                <Icon icon="mdi:clock-alert-outline" className="h-3.5 w-3.5" />
                {!compact && <span>Dados antigos</span>}
            </div>
        );
    }

    if (cacheStatus.cachedAt) {
        const age = formatCacheAge(cacheStatus.cachedAt);
        return (
            <div className={cn(
                "flex items-center gap-1.5 text-xs text-muted-foreground",
                className
            )}>
                <Icon icon="mdi:check-circle-outline" className="h-3.5 w-3.5 text-green-500" />
                {!compact && <span>Atualizado {age}</span>}
            </div>
        );
    }

    return null;
}

// ======================================================
// Updating Overlay (subtle overlay during refresh)
// ======================================================

interface UpdatingOverlayProps {
    isUpdating: boolean;
    children: React.ReactNode;
    className?: string;
}

export function UpdatingOverlay({ isUpdating, children, className }: UpdatingOverlayProps) {
    return (
        <div className={cn("relative", className)}>
            {children}

            <AnimatePresence>
                {isUpdating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-white/30 dark:bg-black/30 backdrop-blur-[1px] rounded-xl flex items-center justify-center pointer-events-none"
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
                            <Icon icon="mdi:loading" className="h-5 w-5 text-primary animate-spin" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ======================================================
// Stale Data Warning (expandable info)
// ======================================================

interface StaleDataWarningProps {
    cacheStatus: CacheStatus;
    onRefresh?: () => void;
    className?: string;
}

export function StaleDataWarning({ cacheStatus, onRefresh, className }: StaleDataWarningProps) {
    const { isOnline } = useNetworkStatus();

    if (!cacheStatus.isStale && isOnline) return null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
                "p-3 rounded-xl text-sm",
                !isOnline
                    ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                    : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800",
                className
            )}
        >
            <div className="flex items-start gap-3">
                <Icon
                    icon={!isOnline ? "mdi:wifi-off" : "mdi:clock-alert-outline"}
                    className={cn(
                        "h-5 w-5 mt-0.5",
                        !isOnline ? "text-amber-500" : "text-blue-500"
                    )}
                />
                <div className="flex-1">
                    <p className={cn(
                        "font-medium mb-1",
                        !isOnline ? "text-amber-800 dark:text-amber-200" : "text-blue-800 dark:text-blue-200"
                    )}>
                        {!isOnline
                            ? "Você está offline"
                            : "Dados podem estar desatualizados"
                        }
                    </p>
                    <p className="text-muted-foreground">
                        {cacheStatus.cachedAt && (
                            <>Última atualização: {formatCacheAge(cacheStatus.cachedAt)}</>
                        )}
                    </p>
                </div>
                {isOnline && onRefresh && (
                    <button
                        onClick={onRefresh}
                        className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors"
                    >
                        Atualizar
                    </button>
                )}
            </div>
        </motion.div>
    );
}

// ======================================================
// Connection Status Dot (minimal indicator)
// ======================================================

export function ConnectionStatusDot({ className }: { className?: string }) {
    const { isOnline } = useNetworkStatus();

    return (
        <div className={cn("relative", className)}>
            <div className={cn(
                "w-2 h-2 rounded-full",
                isOnline ? "bg-green-500" : "bg-amber-500"
            )} />
            {isOnline && (
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-50" />
            )}
        </div>
    );
}

export default {
    OfflineBanner,
    CacheStatusBadge,
    UpdatingOverlay,
    StaleDataWarning,
    ConnectionStatusDot,
};
