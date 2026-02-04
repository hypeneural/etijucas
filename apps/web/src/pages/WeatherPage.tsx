/**
 * WeatherPage - Página completa de Previsão do Tempo
 * Modo Simples: Perguntas humanas ("Vai chover?", "Dá praia?")
 * Modo Detalhado: 3 abas (Hoje, 10 Dias, Mar)
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useWeatherForecast, useMarineForecast } from '@/services/weather.service';
import { getWeatherInfo, getWindDirection, type WeatherHourPoint, type WeatherDayPoint, type MarineHourPoint } from '@/types/weather';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SimpleWeatherView } from '@/components/weather/SimpleWeatherView';
import { PresetChips } from '@/components/weather/PresetChips';
import { TempRainChart, WindChart, WeatherExplainers } from '@/components/weather/WeatherCharts';
import { SeaConditionHero, ExplainableMetric, CoastalPrecisionBanner } from '@/components/weather/MarineExplainer';
import { OfflineBanner, CacheStatusBadge, StaleDataWarning } from '@/components/weather/OfflineIndicator';
import { useNetworkStatus } from '@/hooks/useOfflineWeather';
import { haptic } from '@/hooks/useHaptic';

type ViewMode = 'simple' | 'detailed';

// Persistir preferência no localStorage
const STORAGE_KEY = 'weather-view-mode';

function getStoredMode(): ViewMode {
    if (typeof window === 'undefined') return 'simple';
    return (localStorage.getItem(STORAGE_KEY) as ViewMode) || 'simple';
}

function storeMode(mode: ViewMode) {
    localStorage.setItem(STORAGE_KEY, mode);
}

export default function WeatherPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('hoje');
    const [viewMode, setViewMode] = useState<ViewMode>(getStoredMode);

    // Persist mode preference
    useEffect(() => {
        storeMode(viewMode);
    }, [viewMode]);

    const { data: forecast, isLoading: loadingForecast, refetch: refetchForecast } = useWeatherForecast({ hours: 48, days: 10 });
    const { data: marine, isLoading: loadingMarine, refetch: refetchMarine } = useMarineForecast({ hours: 48, days: 8 });

    const isLoading = loadingForecast || loadingMarine;

    // Handlers with haptic feedback
    const handleRefresh = useCallback(async () => {
        haptic('light');
        await Promise.all([refetchForecast(), refetchMarine()]);
    }, [refetchForecast, refetchMarine]);

    const handleModeChange = useCallback((mode: ViewMode) => {
        haptic('selection');
        setViewMode(mode);
    }, []);

    const handleTabChange = useCallback((tab: string) => {
        haptic('selection');
        setActiveTab(tab);
    }, []);

    // Network status for offline indicator
    const { isOffline } = useNetworkStatus();

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Offline Banner */}
            <OfflineBanner />
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between px-4 py-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="rounded-full"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <div className="text-center">
                        <h1 className="text-lg font-semibold">Previsão do Tempo</h1>
                        <p className="text-xs text-muted-foreground">
                            {forecast?.location?.name ?? 'Tijucas/SC'}
                        </p>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="rounded-full"
                    >
                        <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
                    </Button>
                </div>

                {/* Current conditions banner */}
                {forecast?.current && (
                    <CurrentConditionsBanner current={forecast.current} />
                )}
            </header>

            {/* Main content with tabs */}
            <main className="pb-20">
                {/* Mode Toggle */}
                <div className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 max-w-[280px] mx-auto">
                        <motion.button
                            onClick={() => handleModeChange('simple')}
                            className={cn(
                                "flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all relative",
                                viewMode === 'simple'
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {viewMode === 'simple' && (
                                <motion.div
                                    layoutId="modeIndicator"
                                    className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg shadow"
                                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center justify-center gap-1">
                                <Icon icon="mdi:lightbulb-outline" className="h-4 w-4" />
                                Simples
                            </span>
                        </motion.button>
                        <motion.button
                            onClick={() => handleModeChange('detailed')}
                            className={cn(
                                "flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all relative",
                                viewMode === 'detailed'
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {viewMode === 'detailed' && (
                                <motion.div
                                    layoutId="modeIndicator"
                                    className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg shadow"
                                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center justify-center gap-1">
                                <Icon icon="mdi:chart-line" className="h-4 w-4" />
                                Detalhado
                            </span>
                        </motion.button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {viewMode === 'simple' ? (
                        <motion.div
                            key="simple"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="px-4 pt-2"
                        >
                            {/* Preset Chips */}
                            <PresetChips className="mb-4" />

                            {/* Simple View with Insights */}
                            <SimpleWeatherView />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="detailed"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Tabs for detailed view */}
                            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                <div className="sticky top-[120px] z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl px-4 py-2 border-b border-gray-200/50 dark:border-gray-700/50">
                                    <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                                        <TabsTrigger
                                            value="hoje"
                                            className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow"
                                        >
                                            <Icon icon="mdi:clock-outline" className="h-4 w-4 mr-1" />
                                            Hoje
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="dias"
                                            className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow"
                                        >
                                            <Icon icon="mdi:calendar" className="h-4 w-4 mr-1" />
                                            10 Dias
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="mar"
                                            className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow"
                                        >
                                            <Icon icon="mdi:waves" className="h-4 w-4 mr-1" />
                                            Mar
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <AnimatePresence mode="wait">
                                    <TabsContent value="hoje" className="mt-0 px-4 pt-4">
                                        {loadingForecast ? (
                                            <HourlyLoadingSkeleton />
                                        ) : forecast?.hourly ? (
                                            <div className="space-y-4">
                                                {/* Interactive Temperature & Rain Chart */}
                                                <TempRainChart hours={forecast.hourly} />

                                                {/* Interactive Wind Chart */}
                                                <WindChart hours={forecast.hourly} />

                                                {/* Explainer Chips */}
                                                <WeatherExplainers />

                                                {/* Hourly Timeline (existing) */}
                                                <HourlyForecast hours={forecast.hourly} />
                                            </div>
                                        ) : (
                                            <EmptyState message="Dados não disponíveis" />
                                        )}
                                    </TabsContent>

                                    <TabsContent value="dias" className="mt-0 px-4 pt-4">
                                        {loadingForecast ? (
                                            <DailyLoadingSkeleton />
                                        ) : forecast?.daily ? (
                                            <DailyForecast days={forecast.daily} />
                                        ) : (
                                            <EmptyState message="Dados não disponíveis" />
                                        )}
                                    </TabsContent>

                                    <TabsContent value="mar" className="mt-0 px-4 pt-4">
                                        {loadingMarine ? (
                                            <MarineLoadingSkeleton />
                                        ) : marine?.hourly ? (
                                            <MarineForecast hours={marine.hourly} />
                                        ) : (
                                            <EmptyState message="Dados do mar indisponíveis" />
                                        )}
                                    </TabsContent>
                                </AnimatePresence>
                            </Tabs>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Cache info */}
                {forecast?.cache && (
                    <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                        <p>
                            Atualizado{' '}
                            {formatDistanceToNow(new Date(forecast.cache.fetched_at), {
                                addSuffix: true,
                                locale: ptBR
                            })}
                            {forecast.cache.stale && (
                                <span className="ml-1 text-amber-500">(dados antigos)</span>
                            )}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}

// ======================================================
// Current Conditions Banner
// ======================================================

function CurrentConditionsBanner({ current }: { current: NonNullable<ReturnType<typeof useWeatherForecast>['data']>['current'] }) {
    if (!current) return null;

    const weatherInfo = getWeatherInfo(current.weather_code);

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-white"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Icon icon={weatherInfo.icon} className="h-10 w-10" />
                    <div>
                        <div className="text-3xl font-bold">{Math.round(current.temp_c)}°C</div>
                        <div className="text-sm text-white/80">{current.description}</div>
                    </div>
                </div>
                <div className="text-right text-sm space-y-1">
                    <div className="flex items-center gap-1 justify-end">
                        <Icon icon="mdi:thermometer" className="h-4 w-4" />
                        <span>Sensação {Math.round(current.feels_like_c)}°</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                        <Icon icon="mdi:weather-windy" className="h-4 w-4" />
                        <span>{Math.round(current.wind_kmh)} km/h {getWindDirection(current.wind_dir_deg)}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ======================================================
// Hourly Forecast Tab
// ======================================================

function HourlyForecast({ hours }: { hours: WeatherHourPoint[] }) {
    const now = new Date();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
        >
            {/* Horizontal scroll for next 12 hours */}
            <Card className="p-4 bg-gradient-to-r from-sky-100 to-blue-100 dark:from-gray-800 dark:to-gray-700">
                <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Próximas horas</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {hours.slice(0, 12).map((hour, idx) => {
                        const time = new Date(hour.t);
                        const isNow = idx === 0;
                        const weatherInfo = getWeatherInfo(hour.weather_code);

                        return (
                            <motion.div
                                key={hour.t}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={cn(
                                    "flex-shrink-0 text-center p-3 rounded-xl min-w-[70px]",
                                    isNow
                                        ? "bg-blue-500 text-white shadow-lg"
                                        : "bg-white/80 dark:bg-gray-600/50"
                                )}
                            >
                                <div className="text-xs font-medium mb-1">
                                    {isNow ? 'Agora' : `${time.getHours()}h`}
                                </div>
                                <Icon icon={weatherInfo.icon} className="h-6 w-6 mx-auto my-1" />
                                <div className="text-lg font-bold">{Math.round(hour.temp_c)}°</div>
                                {hour.rain_prob_pct > 0 && (
                                    <div className={cn(
                                        "text-xs mt-1",
                                        isNow ? "text-white/80" : "text-blue-500"
                                    )}>
                                        💧 {hour.rain_prob_pct}%
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </Card>

            {/* Detailed list */}
            <div className="space-y-2">
                {hours.slice(0, 24).map((hour, idx) => {
                    const time = new Date(hour.t);
                    const weatherInfo = getWeatherInfo(hour.weather_code);

                    return (
                        <motion.div
                            key={hour.t}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.02 }}
                        >
                            <Card className="p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 text-center">
                                            <div className="text-sm font-medium">{time.getHours()}:00</div>
                                        </div>
                                        <Icon icon={weatherInfo.icon} className="h-6 w-6" style={{ color: weatherInfo.color }} />
                                        <div className="text-2xl font-bold">{Math.round(hour.temp_c)}°</div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        {hour.rain_prob_pct > 0 && (
                                            <div className="flex items-center gap-1 text-blue-500">
                                                <Icon icon="mdi:water" className="h-4 w-4" />
                                                {hour.rain_prob_pct}%
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <Icon icon="mdi:weather-windy" className="h-4 w-4" />
                                            {Math.round(hour.wind_kmh)}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}

// ======================================================
// Daily Forecast Tab
// ======================================================

function DailyForecast({ days }: { days: WeatherDayPoint[] }) {
    const today = new Date().toISOString().split('T')[0];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
        >
            {days.map((day, idx) => {
                const isToday = day.date === today;
                const date = new Date(day.date + 'T12:00:00');
                const weatherInfo = getWeatherInfo(day.weather_code);

                const dayName = isToday
                    ? 'Hoje'
                    : date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');

                const dateStr = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });

                return (
                    <motion.div
                        key={day.date}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                    >
                        <Card className={cn(
                            "p-4",
                            isToday && "border-2 border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        )}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-[100px]">
                                    <div>
                                        <div className={cn(
                                            "text-sm font-semibold capitalize",
                                            isToday && "text-blue-600 dark:text-blue-400"
                                        )}>
                                            {dayName}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{dateStr}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Icon icon={weatherInfo.icon} className="h-8 w-8" style={{ color: weatherInfo.color }} />
                                    <span className="text-xs text-muted-foreground hidden sm:block">
                                        {day.description}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    {day.rain_prob_max_pct !== undefined && day.rain_prob_max_pct > 0 && (
                                        <div className="flex items-center gap-1 text-blue-500 text-sm">
                                            <Icon icon="mdi:water" className="h-4 w-4" />
                                            {day.rain_prob_max_pct}%
                                        </div>
                                    )}
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-orange-500">
                                            {Math.round(day.max_c)}°
                                        </span>
                                        <span className="text-muted-foreground mx-1">/</span>
                                        <span className="text-lg font-bold text-blue-500">
                                            {Math.round(day.min_c)}°
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}

// ======================================================
// Marine Forecast Tab (Didactic Version)
// ======================================================

function MarineForecast({ hours }: { hours: MarineHourPoint[] }) {
    const current = hours[0];
    if (!current) return <EmptyState message="Dados do mar indisponíveis" />;

    // Classify sea condition
    const getConditionColor = (waveM: number) => {
        if (waveM >= 1.5) return 'text-red-500';
        if (waveM >= 0.8) return 'text-amber-500';
        return 'text-emerald-500';
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
        >
            {/* Sea Condition Hero Card */}
            <SeaConditionHero
                waveHeight={current.wave_m}
                wavePeriod={current.wave_period_s}
                seaTemp={current.sea_temp_c}
            />

            {/* Coastal Precision Warning */}
            <CoastalPrecisionBanner />

            {/* Detailed Metrics with Explanations */}
            <Card className="p-4">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Icon icon="mdi:information-outline" className="h-4 w-4 text-muted-foreground" />
                    Toque para entender cada métrica
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <ExplainableMetric
                        metricKey="wave_height"
                        value={current.wave_m.toFixed(1)}
                        unit="m"
                        size="lg"
                    />
                    <ExplainableMetric
                        metricKey="wave_period"
                        value={current.wave_period_s.toFixed(0)}
                        unit="s"
                        size="lg"
                    />
                    <ExplainableMetric
                        metricKey="wave_direction"
                        value={getWindDirection(current.wave_dir_deg)}
                        size="lg"
                    />
                    {current.sea_temp_c !== undefined && (
                        <ExplainableMetric
                            metricKey="sea_temp"
                            value={Math.round(current.sea_temp_c)}
                            unit="°C"
                            size="lg"
                        />
                    )}
                </div>
            </Card>

            {/* Swell info with explanation */}
            {current.swell_m !== undefined && current.swell_m > 0 && (
                <Card className="p-4">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Icon icon="mdi:wave" className="h-4 w-4 text-blue-500" />
                        Swell (Ondulação de alto mar)
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        <ExplainableMetric
                            metricKey="swell"
                            value={current.swell_m.toFixed(1)}
                            unit="m"
                            size="md"
                        />
                        <div className="text-center">
                            <div className="text-lg font-bold">{current.swell_period_s?.toFixed(0) ?? '-'}s</div>
                            <div className="text-xs text-muted-foreground">Período</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold">{getWindDirection(current.swell_dir_deg ?? 0)}</div>
                            <div className="text-xs text-muted-foreground">Direção</div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Current info */}
            {current.current_ms !== undefined && current.current_ms > 0 && (
                <Card className="p-4">
                    <ExplainableMetric
                        metricKey="current"
                        value={current.current_ms.toFixed(2)}
                        unit=" m/s"
                        size="lg"
                    />
                </Card>
            )}

            {/* Hourly marine forecast */}
            <Card className="p-4">
                <h3 className="text-sm font-medium mb-3">Previsão por hora</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {hours.slice(0, 12).map((hour, idx) => {
                        const time = new Date(hour.t);
                        const conditionColor = getConditionColor(hour.wave_m);

                        return (
                            <motion.div
                                key={hour.t}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex-shrink-0 text-center p-3 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 min-w-[70px]"
                            >
                                <div className="text-xs font-medium mb-1">{time.getHours()}h</div>
                                <Icon icon="mdi:waves" className={cn("h-5 w-5 mx-auto", conditionColor)} />
                                <div className={cn("text-sm font-bold mt-1", conditionColor)}>
                                    {hour.wave_m.toFixed(1)}m
                                </div>
                                <div className="text-xs text-muted-foreground">{hour.wave_period_s.toFixed(0)}s</div>
                            </motion.div>
                        );
                    })}
                </div>
            </Card>
        </motion.div>
    );
}

// ======================================================
// Loading Skeletons
// ======================================================

function HourlyLoadingSkeleton() {
    return (
        <div className="space-y-3">
            <Skeleton className="h-32 rounded-xl" />
            <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
            </div>
        </div>
    );
}

function DailyLoadingSkeleton() {
    return (
        <div className="space-y-2">
            {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
        </div>
    );
}

function MarineLoadingSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="text-center py-12">
            <Icon icon="mdi:weather-cloudy-alert" className="h-16 w-16 mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">{message}</p>
        </div>
    );
}
