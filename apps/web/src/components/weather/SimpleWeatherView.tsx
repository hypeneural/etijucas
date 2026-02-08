/**
 * SimpleWeatherView - Modo "leigo" da previsão
 * Responde perguntas humanas: "Vai chover?", "Dá praia?", "Mar tá como?"
 */

import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { InsightsPanel, BeachScoreCard, SeaConditionBadge } from './InsightsPanel';
import { useWeatherInsights } from '@/services/weather.service';
import type { WeatherInsight } from '@/types/weather';

interface SimpleWeatherViewProps {
    className?: string;
    insights?: WeatherInsight[];
    isLoading?: boolean;
    hasError?: boolean;
}

// Agrupa insights por categoria
function groupInsights(insights: WeatherInsight[]) {
    const beach = insights.find(i => i.type === 'beach');
    const sea = insights.find(i => i.type === 'sea');
    const rain = insights.filter(i => i.type === 'rain' || i.type === 'rain_window');
    const wind = insights.filter(i => i.type === 'wind');
    const temperature = insights.filter(i => i.type === 'temperature');
    const uv = insights.filter(i => i.type === 'uv');
    const warnings = insights.filter(i => i.type === 'warning');

    return { beach, sea, rain, wind, temperature, uv, warnings };
}

export function SimpleWeatherView({
    className,
    insights: providedInsights,
    isLoading: providedLoading,
    hasError: providedError,
}: SimpleWeatherViewProps) {
    const {
        data,
        isLoading: hookLoading,
        error: hookError,
    } = useWeatherInsights({
        enabled: providedInsights === undefined,
    });

    const insights = providedInsights ?? data?.insights ?? [];
    const isLoading = providedLoading ?? hookLoading;
    const hasError = providedError ?? Boolean(hookError);

    if (isLoading) {
        return <SimpleWeatherSkeleton />;
    }

    if (hasError || insights.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Icon icon="mdi:weather-cloudy-alert" className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Não foi possível carregar insights</p>
            </div>
        );
    }

    const { beach, sea, rain, wind, temperature, uv, warnings } = groupInsights(insights);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn("space-y-4", className)}
        >
            {/* Beach Score - Hero Card */}
            {beach && <BeachScoreCard insight={beach} />}

            {/* Question Cards */}
            <div className="grid gap-3">
                {/* Vai chover? */}
                {rain.length > 0 && (
                    <QuestionCard
                        question="Vai chover hoje?"
                        icon="mdi:weather-pouring"
                        insights={rain}
                    />
                )}

                {/* Mar tá como? */}
                {sea && (
                    <QuestionCard
                        question="Mar tá como?"
                        icon="mdi:waves"
                        insights={[sea]}
                        extra={
                            sea.meta?.condition && (
                                <SeaConditionBadge
                                    condition={sea.meta.condition as 'calm' | 'moderate' | 'rough'}
                                    waveHeight={sea.meta.wave_m ?? 0}
                                    period={sea.meta.period_s ?? 0}
                                />
                            )
                        }
                    />
                )}

                {/* Vai ventar forte? */}
                {wind.length > 0 && (
                    <QuestionCard
                        question="Vai ventar forte?"
                        icon="mdi:weather-windy"
                        insights={wind}
                    />
                )}

                {/* Vai esfriar? */}
                {temperature.length > 0 && (
                    <QuestionCard
                        question="Vai esfriar/esquentar?"
                        icon="mdi:thermometer"
                        insights={temperature}
                    />
                )}

                {/* UV */}
                {uv.length > 0 && (
                    <QuestionCard
                        question="Sol forte?"
                        icon="mdi:white-balance-sunny"
                        insights={uv}
                    />
                )}
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
                <div className="mt-4">
                    <InsightsPanel insights={warnings} />
                </div>
            )}
        </motion.div>
    );
}

// ======================================================
// Question Card Component
// ======================================================

interface QuestionCardProps {
    question: string;
    icon: string;
    insights: WeatherInsight[];
    extra?: React.ReactNode;
}

function QuestionCard({ question, icon, insights, extra }: QuestionCardProps) {
    const mainInsight = insights[0];
    if (!mainInsight) return null;

    const severityColor = {
        success: 'text-emerald-500',
        info: 'text-blue-500',
        warning: 'text-amber-500',
        danger: 'text-red-500',
    }[mainInsight.severity];

    const borderColor = {
        success: 'border-emerald-200 dark:border-emerald-700',
        info: 'border-blue-200 dark:border-blue-700',
        warning: 'border-amber-200 dark:border-amber-700',
        danger: 'border-red-200 dark:border-red-700',
    }[mainInsight.severity];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <Card className={cn("p-4 border-l-4", borderColor)}>
                <div className="flex items-start gap-3">
                    <Icon icon={icon} className={cn("h-6 w-6 flex-shrink-0 mt-0.5", severityColor)} />
                    <div className="flex-1">
                        <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                            {question}
                        </h3>
                        <p className={cn("text-lg font-medium", severityColor)}>
                            {mainInsight.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {mainInsight.message}
                        </p>
                        {mainInsight.detail && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {mainInsight.detail}
                            </p>
                        )}
                        {extra && <div className="mt-3">{extra}</div>}
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

// ======================================================
// Skeleton Loading
// ======================================================

function SimpleWeatherSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-40 rounded-xl" />
            <div className="grid gap-3">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
            </div>
        </div>
    );
}

export default SimpleWeatherView;
