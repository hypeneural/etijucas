/**
 * QuickAccessGridVivo - Enhanced Quick Access with Live Badges
 *
 * Version of QuickAccessGrid that displays live badges from the
 * home aggregator API, showing real-time counts and highlights.
 *
 * Features:
 * - Filters items based on enabled modules for current city
 * - Uses city-prefixed routes when in multi-city mode
 */

import React, { useMemo } from 'react';
import { useTenantNavigate } from '@/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    MapPin,
    Church,
    Phone,
    FileText,
    Trash2,
    CloudSun,
    MessageCircle,
    AlertTriangle,
    LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuickAccessItem, QuickAccessPayload } from '@/types/home.types';
import { useHaptic } from '@/hooks/useHaptic';
import { useTenantStore } from '@/store/useTenantStore';
import { useCityRoute } from '@/hooks/useCityRoute';

interface QuickAccessGridVivoProps {
    data?: QuickAccessPayload;
    isLoading?: boolean;
    className?: string;
}

// Icon mapping from string to component
const iconMap: Record<string, LucideIcon> = {
    calendar: Calendar,
    'map-pin': MapPin,
    church: Church,
    phone: Phone,
    trash: Trash2,
    'cloud-sun': CloudSun,
    'message-circle': MessageCircle,
    'alert-triangle': AlertTriangle,
};

// Color mapping for badges
const badgeColors: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-600',
    green: 'bg-emerald-500/20 text-emerald-600',
    orange: 'bg-orange-500/20 text-orange-600',
    red: 'bg-red-500/20 text-red-600',
};

// Legacy fallback for payloads that still do not provide module_key.
const legacyItemToModuleMap: Record<string, string> = {
    eventos: 'events',
    turismo: 'tourism',
    missas: 'masses',
    telefones: 'phones',
    coleta: 'trash',
    fiscaliza: 'reports',
    tempo: 'weather',
    forum: 'forum',
};

// Default items (fallback when no API data)
const defaultItems: QuickAccessItem[] = [
    { id: 'eventos', label: 'Eventos', icon: 'calendar', route: '/agenda', module_key: 'events', badge: null },
    { id: 'turismo', label: 'Turismo', icon: 'map-pin', route: '/pontos-turisticos', module_key: 'tourism', badge: null },
    { id: 'missas', label: 'Missas', icon: 'church', route: '/missas', module_key: 'masses', badge: null },
    { id: 'telefones', label: 'Telefones', icon: 'phone', route: '/telefones', module_key: 'phones', badge: null },
    { id: 'coleta', label: 'Coleta', icon: 'trash', route: '/coleta-lixo', module_key: 'trash', badge: null },
    { id: 'fiscaliza', label: 'Observa', icon: 'alert-triangle', route: '/observacoes', module_key: 'reports', badge: null },
    { id: 'tempo', label: 'Tempo', icon: 'cloud-sun', route: '/previsao', module_key: 'weather', badge: null },
    { id: 'forum', label: 'Forum', icon: 'message-circle', route: '/forum', module_key: 'forum', badge: null },
];

// Base color styles per item
const itemColors: Record<string, string> = {
    eventos: 'bg-secondary/10 text-secondary',
    turismo: 'bg-green-100 text-green-600',
    missas: 'bg-primary/10 text-primary',
    telefones: 'bg-accent/10 text-accent',
    coleta: 'bg-emerald-100 text-emerald-600',
    fiscaliza: 'bg-orange-100 text-orange-600',
    tempo: 'bg-blue-100 text-blue-600',
    forum: 'bg-purple-100 text-purple-600',
};

const isLegacyGateFallbackEnabled = String(import.meta.env.VITE_TENANT_LEGACY_GATE_FALLBACK ?? '0') === '1';

export function resolveQuickAccessModuleKey(item: QuickAccessItem): string | null {
    if (item.module_key) {
        return item.module_key;
    }

    if (!isLegacyGateFallbackEnabled) {
        return null;
    }

    return legacyItemToModuleMap[item.id] ?? null;
}

export function QuickAccessGridVivo({ data, className }: QuickAccessGridVivoProps) {
    const navigate = useTenantNavigate();
    const haptic = useHaptic();
    const isModuleEnabled = useTenantStore((state) => state.isModuleEnabled);
    const { buildRoute } = useCityRoute();

    // Filter items based on enabled modules
    const items = useMemo(() => {
        const sourceItems = data?.items || defaultItems;

        return sourceItems.filter((item) => {
            const moduleKey = resolveQuickAccessModuleKey(item);

            // If no mapping, show the item (backwards compatibility)
            if (!moduleKey) {
                return true;
            }

            return isModuleEnabled(moduleKey);
        });
    }, [data?.items, isModuleEnabled]);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        show: {
            opacity: 1,
            scale: 1,
            transition: {
                type: 'spring' as const,
                stiffness: 300,
                damping: 24,
            },
        },
    };

    const handleClick = (item: QuickAccessItem) => {
        haptic.light();
        navigate(buildRoute(item.route));
    };

    return (
        <div className={cn('px-4 py-4', className)}>
            <h2 className="text-lg font-bold text-foreground mb-3">Servicos</h2>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-3"
            >
                {items.map((item) => {
                    const Icon = iconMap[item.icon] || FileText;
                    const colorClass = itemColors[item.id] || 'bg-muted text-muted-foreground';
                    const badgeColorClass = badgeColors[item.badge_color ?? ''] || badgeColors.blue;

                    return (
                        <motion.button
                            key={item.id}
                            variants={itemVariants}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleClick(item)}
                            className={cn(
                                'relative bento-card flex items-center gap-3 text-left',
                                item.highlight && 'ring-2 ring-primary/50'
                            )}
                        >
                            <div className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                                colorClass
                            )}>
                                <Icon className="w-5 h-5" />
                            </div>

                            <span className="text-sm font-medium text-foreground leading-tight">
                                {item.id === 'fiscaliza' || item.label === 'Fiscaliza' ? 'Observa' : item.label}
                            </span>

                            <AnimatePresence>
                                {item.badge && (
                                    <motion.span
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className={cn(
                                            'absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                                            badgeColorClass
                                        )}
                                    >
                                        {item.badge}
                                    </motion.span>
                                )}
                            </AnimatePresence>

                            {item.highlight && (
                                <motion.div
                                    className="absolute inset-0 rounded-xl bg-primary/10"
                                    animate={{ opacity: [0.3, 0, 0.3] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </motion.div>
        </div>
    );
}

export default QuickAccessGridVivo;
