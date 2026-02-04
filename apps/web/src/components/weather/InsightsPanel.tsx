/**
 * InsightsPanel - Painel de insights "leigos" para clima
 * Mostra insights com ícones, badges de severidade e animações
 */

import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { WeatherInsight, InsightSeverity } from '@/types/weather';

interface InsightsPanelProps {
    insights: WeatherInsight[];
    className?: string;
}

// Cores e estilos por severidade
const severityStyles: Record<InsightSeverity, { bg: string; border: string; text: string; iconBg: string }> = {
    success: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        border: 'border-emerald-200 dark:border-emerald-700',
        text: 'text-emerald-700 dark:text-emerald-300',
        iconBg: 'bg-emerald-100 dark:bg-emerald-800',
    },
    info: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-700',
        text: 'text-blue-700 dark:text-blue-300',
        iconBg: 'bg-blue-100 dark:bg-blue-800',
    },
    warning: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-700',
        text: 'text-amber-700 dark:text-amber-300',
        iconBg: 'bg-amber-100 dark:bg-amber-800',
    },
    danger: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-700',
        text: 'text-red-700 dark:text-red-300',
        iconBg: 'bg-red-100 dark:bg-red-800',
    },
};

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1 },
};

export function InsightsPanel({ insights, className }: InsightsPanelProps) {
    if (!insights.length) {
        return (
            <div className={cn("text-center py-8 text-muted-foreground", className)}>
                <Icon icon="mdi:weather-sunny" className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum insight disponível</p>
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className={cn("space-y-3", className)}
        >
            {insights.map((insight, idx) => (
                <InsightCard key={`${insight.type}-${idx}`} insight={insight} />
            ))}
        </motion.div>
    );
}

function InsightCard({ insight }: { insight: WeatherInsight }) {
    const styles = severityStyles[insight.severity];

    return (
        <motion.div variants={itemVariants}>
            <Card className={cn(
                "p-4 border-l-4 transition-all duration-200 hover:shadow-md",
                styles.bg,
                styles.border
            )}>
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn(
                        "flex-shrink-0 p-2 rounded-full",
                        styles.iconBg
                    )}>
                        <Icon icon={insight.icon} className={cn("h-5 w-5", styles.text)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className={cn("font-semibold text-sm", styles.text)}>
                                {insight.title}
                            </h4>
                            {insight.badge && (
                                <span className={cn(
                                    "text-xs px-2 py-0.5 rounded-full font-medium",
                                    styles.iconBg,
                                    styles.text
                                )}>
                                    {insight.badge}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            {insight.message}
                        </p>
                        {insight.detail && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {insight.detail}
                            </p>
                        )}
                    </div>

                    {/* Score (for beach) */}
                    {insight.meta?.score !== undefined && (
                        <div className="flex-shrink-0 text-center">
                            <div className={cn(
                                "text-2xl font-bold",
                                insight.meta.score >= 7 ? "text-emerald-500" :
                                    insight.meta.score >= 5 ? "text-amber-500" : "text-red-500"
                            )}>
                                {insight.meta.score}
                            </div>
                            <div className="text-xs text-muted-foreground">/10</div>
                        </div>
                    )}
                </div>
            </Card>
        </motion.div>
    );
}

// ======================================================
// Compact Insight Chip (for inline use)
// ======================================================

export function InsightChip({ insight }: { insight: WeatherInsight }) {
    const styles = severityStyles[insight.severity];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm",
                styles.bg,
                styles.border,
                "border"
            )}
        >
            <Icon icon={insight.icon} className={cn("h-4 w-4", styles.text)} />
            <span className={styles.text}>{insight.title}</span>
            {insight.badge && (
                <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full font-medium",
                    styles.iconBg,
                    styles.text
                )}>
                    {insight.badge}
                </span>
            )}
        </motion.div>
    );
}

// ======================================================
// Featured Insight (Hero style for beach score)
// ======================================================

export function BeachScoreCard({ insight }: { insight: WeatherInsight }) {
    const score = insight.meta?.score ?? 0;
    const positives = insight.meta?.positives ?? [];
    const negatives = insight.meta?.negatives ?? [];

    const scoreColor = score >= 7 ? 'from-emerald-400 to-emerald-600' :
        score >= 5 ? 'from-amber-400 to-amber-600' :
            'from-red-400 to-red-600';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <Card className="overflow-hidden">
                <div className={cn(
                    "bg-gradient-to-r p-6 text-white",
                    scoreColor
                )}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Icon icon="mdi:beach" className="h-6 w-6" />
                                Dá praia?
                            </h3>
                            <p className="text-white/90 mt-1">{insight.message}</p>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl font-bold">{score}</div>
                            <div className="text-sm text-white/80">/10</div>
                        </div>
                    </div>
                </div>

                <div className="p-4 space-y-3">
                    {positives.length > 0 && (
                        <div>
                            <h4 className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                                ✓ Pontos positivos
                            </h4>
                            <div className="flex flex-wrap gap-1">
                                {positives.map((p, i) => (
                                    <span key={i} className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {negatives.length > 0 && (
                        <div>
                            <h4 className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                                ✗ Atenção
                            </h4>
                            <div className="flex flex-wrap gap-1">
                                {negatives.map((n, i) => (
                                    <span key={i} className="text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded-full">
                                        {n}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </motion.div>
    );
}

// ======================================================
// Sea Condition Badge
// ======================================================

export function SeaConditionBadge({ condition, waveHeight, period }: {
    condition: 'calm' | 'moderate' | 'rough';
    waveHeight: number;
    period: number;
}) {
    const config = {
        calm: { emoji: '✅', label: 'Mar Calmo', bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300' },
        moderate: { emoji: '⚠️', label: 'Mar Moderado', bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300' },
        rough: { emoji: '⛔', label: 'Mar Agitado', bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300' },
    }[condition];

    return (
        <div className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-xl",
            config.bg
        )}>
            <span className="text-xl">{config.emoji}</span>
            <div>
                <div className={cn("font-semibold text-sm", config.text)}>{config.label}</div>
                <div className="text-xs text-muted-foreground">
                    {waveHeight.toFixed(1)}m • {period}s
                </div>
            </div>
        </div>
    );
}

export default InsightsPanel;
