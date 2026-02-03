import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface OfflineIndicatorProps {
    className?: string;
}

export function OfflineIndicator({ className = '' }: OfflineIndicatorProps) {
    const { isOnline, wasOffline, effectiveType } = useNetworkStatus();

    const isSlowConnection = effectiveType === 'slow-2g' || effectiveType === '2g';

    // Show indicator if offline, just came back online, or on slow connection
    const showIndicator = !isOnline || wasOffline || isSlowConnection;

    if (!showIndicator) return null;

    return (
        <AnimatePresence>
            {showIndicator && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className={`fixed top-0 inset-x-0 z-50 safe-top ${className}`}
                >
                    <div className="mx-auto max-w-[420px]">
                        {!isOnline && (
                            <div className="glass mx-3 mt-3 px-4 py-3 rounded-xl flex items-center gap-3 bg-yellow-500/90 text-white shadow-lg">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
                                    <WifiOff className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold">Você está offline</p>
                                    <p className="text-xs opacity-90">
                                        Alguns recursos podem estar limitados
                                    </p>
                                </div>
                            </div>
                        )}

                        {isOnline && wasOffline && (
                            <div className="glass mx-3 mt-3 px-4 py-3 rounded-xl flex items-center gap-3 bg-green-500/90 text-white shadow-lg">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                </motion.div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold">Conexão restaurada</p>
                                    <p className="text-xs opacity-90">
                                        Sincronizando dados...
                                    </p>
                                </div>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            </div>
                        )}

                        {isOnline && !wasOffline && isSlowConnection && (
                            <div className="glass mx-3 mt-3 px-4 py-2 rounded-xl flex items-center gap-3 bg-orange-500/90 text-white shadow-lg">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20">
                                    <WifiOff className="w-3 h-3" />
                                </div>
                                <p className="text-xs font-medium">
                                    Conexão lenta detectada
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default OfflineIndicator;
