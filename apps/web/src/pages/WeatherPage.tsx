/**
 * WeatherPage - full weather screen
 * Simple mode: direct answers
 * Detailed mode: tabs for hourly, daily and marine
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTenantNavigate } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SimpleWeatherView } from '@/components/weather/SimpleWeatherView';
import { PresetChips } from '@/components/weather/PresetChips';
import { TempRainChart, WeatherExplainers, WindChart } from '@/components/weather/WeatherCharts';
import { CacheStatusBadge, OfflineBanner, StaleDataWarning } from '@/components/weather/OfflineIndicator';
import { CoastalPrecisionBanner, ExplainableMetric, SeaConditionHero } from '@/components/weather/MarineExplainer';
import { useWeatherBundle } from '@/services/weather.service';
import { mapBundleInsights, mapBundleToForecast, mapBundleToMarine } from '@/services/weather-bundle.mapper';
import { cn } from '@/lib/utils';
import { extractHourFromLocalIso, getNowInTimeZone, toLocalDateDisplay } from '@/lib/timezone';
import { getWeatherInfo, getWindDirection, type MarineHourPoint, type WeatherCurrent, type WeatherDayPoint, type WeatherHourPoint } from '@/types/weather';
import { haptic } from '@/hooks/useHaptic';

type ViewMode = 'simple' | 'detailed';

const STORAGE_KEY = 'weather-view-mode';

function getStoredMode(): ViewMode {
    if (typeof window === 'undefined') {
        return 'simple';
    }

    return (localStorage.getItem(STORAGE_KEY) as ViewMode) || 'simple';
}

function storeMode(mode: ViewMode) {
    localStorage.setItem(STORAGE_KEY, mode);
}

export default function WeatherPage() {
    const navigate = useTenantNavigate();
    const [activeTab, setActiveTab] = useState('hoje');
    const [viewMode, setViewMode] = useState<ViewMode>(getStoredMode);

    useEffect(() => {
        storeMode(viewMode);
    }, [viewMode]);

    const {
        data: forecastBundle,
        isLoading: loadingForecast,
        refetch: refetchForecast,
        cacheStatus: forecastCacheStatus,
    } = useWeatherBundle({
        sections: ['current', 'hourly', 'daily', 'insights'],
        days: 10,
        units: 'metric',
    });

    const forecast = useMemo(
        () => mapBundleToForecast(forecastBundle, { hoursLimit: 48, daysLimit: 10 }),
        [forecastBundle]
    );
    const insights = useMemo(() => mapBundleInsights(forecastBundle), [forecastBundle]);
    const timezone = forecastBundle?.location.timezone ?? 'America/Sao_Paulo';
    const isCoastal = forecastBundle?.location.is_coastal ?? false;
    const shouldLoadMarine = isCoastal && viewMode === 'detailed' && activeTab === 'mar';

    const {
        data: marineBundle,
        isLoading: loadingMarine,
        refetch: refetchMarine,
    } = useWeatherBundle(
        {
            sections: ['marine'],
            days: 8,
            units: 'metric',
        },
        { enabled: shouldLoadMarine }
    );

    const marine = useMemo(
        () => mapBundleToMarine(marineBundle, { hoursLimit: 48, daysLimit: 8 }),
        [marineBundle]
    );

    useEffect(() => {
        if (activeTab === 'mar' && !isCoastal) {
            setActiveTab('hoje');
        }
    }, [activeTab, isCoastal]);

    const isLoading = loadingForecast || (shouldLoadMarine && loadingMarine);

    const handleRefresh = useCallback(async () => {
        haptic('light');

        if (shouldLoadMarine) {
            await Promise.all([refetchForecast(), refetchMarine()]);
            return;
        }

        await refetchForecast();
    }, [refetchForecast, refetchMarine, shouldLoadMarine]);

    const handleModeChange = useCallback((mode: ViewMode) => {
        haptic('selection');
        setViewMode(mode);
    }, []);

    const handleTabChange = useCallback((tab: string) => {
        haptic('selection');
        setActiveTab(tab);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <OfflineBanner />

            <header className="sticky top-0 z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/80">
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
                        <h1 className="text-lg font-semibold">Previsao do Tempo</h1>
                        <p className="text-xs text-muted-foreground">
                            {forecast?.location?.name ?? 'Cidade'}
                        </p>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="rounded-full"
                    >
                        <RefreshCw className={cn('h-5 w-5', isLoading && 'animate-spin')} />
                    </Button>
                </div>

                {forecast?.current && <CurrentConditionsBanner current={forecast.current} />}
            </header>

            <main className="pb-20">
                <div className="px-4 py-3">
                    <div className="mb-2 flex items-center justify-end">
                        <CacheStatusBadge cacheStatus={forecastCacheStatus} />
                    </div>
                    <StaleDataWarning cacheStatus={forecastCacheStatus} onRefresh={handleRefresh} className="mb-3" />

                    <div className="mx-auto flex max-w-[280px] items-center justify-center gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                        <motion.button
                            onClick={() => handleModeChange('simple')}
                            className={cn(
                                'relative flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                                viewMode === 'simple' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {viewMode === 'simple' && (
                                <motion.div
                                    layoutId="modeIndicator"
                                    className="absolute inset-0 rounded-lg bg-white shadow dark:bg-gray-700"
                                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
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
                                'relative flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                                viewMode === 'detailed' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {viewMode === 'detailed' && (
                                <motion.div
                                    layoutId="modeIndicator"
                                    className="absolute inset-0 rounded-lg bg-white shadow dark:bg-gray-700"
                                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
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
                            <PresetChips className="mb-4" />
                            <SimpleWeatherView
                                insights={insights}
                                isLoading={loadingForecast}
                                hasError={Boolean(forecastBundle?.errors?.insights)}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="detailed"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                <div className="sticky top-[120px] z-40 border-b border-gray-200/50 bg-white/80 px-4 py-2 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/80">
                                    <TabsList className={cn(
                                        'grid w-full rounded-xl bg-gray-100 p-1 dark:bg-gray-800',
                                        isCoastal ? 'grid-cols-3' : 'grid-cols-2'
                                    )}>
                                        <TabsTrigger
                                            value="hoje"
                                            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow dark:data-[state=active]:bg-gray-700"
                                        >
                                            <Icon icon="mdi:clock-outline" className="mr-1 h-4 w-4" />
                                            Hoje
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="dias"
                                            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow dark:data-[state=active]:bg-gray-700"
                                        >
                                            <Icon icon="mdi:calendar" className="mr-1 h-4 w-4" />
                                            10 Dias
                                        </TabsTrigger>
                                        {isCoastal && (
                                            <TabsTrigger
                                                value="mar"
                                                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow dark:data-[state=active]:bg-gray-700"
                                            >
                                                <Icon icon="mdi:waves" className="mr-1 h-4 w-4" />
                                                Mar
                                            </TabsTrigger>
                                        )}
                                    </TabsList>
                                </div>

                                <AnimatePresence mode="wait">
                                    <TabsContent value="hoje" className="mt-0 px-4 pt-4">
                                        {loadingForecast ? (
                                            <HourlyLoadingSkeleton />
                                        ) : forecast?.hourly && forecast.hourly.length > 0 ? (
                                            <div className="space-y-4">
                                                <TempRainChart hours={forecast.hourly} />
                                                <WindChart hours={forecast.hourly} />
                                                <WeatherExplainers />
                                                <HourlyForecast hours={forecast.hourly} />
                                            </div>
                                        ) : (
                                            <EmptyState message="Dados nao disponiveis" />
                                        )}
                                    </TabsContent>

                                    <TabsContent value="dias" className="mt-0 px-4 pt-4">
                                        {loadingForecast ? (
                                            <DailyLoadingSkeleton />
                                        ) : forecast?.daily && forecast.daily.length > 0 ? (
                                            <DailyForecast days={forecast.daily} timezone={timezone} />
                                        ) : (
                                            <EmptyState message="Dados nao disponiveis" />
                                        )}
                                    </TabsContent>

                                    {isCoastal && (
                                        <TabsContent value="mar" className="mt-0 px-4 pt-4">
                                            {loadingMarine ? (
                                                <MarineLoadingSkeleton />
                                            ) : marine?.hourly && marine.hourly.length > 0 ? (
                                                <MarineForecast hours={marine.hourly} />
                                            ) : (
                                                <EmptyState message="Dados do mar indisponiveis" />
                                            )}
                                        </TabsContent>
                                    )}
                                </AnimatePresence>
                            </Tabs>
                        </motion.div>
                    )}
                </AnimatePresence>

                {forecastBundle?.cache && (
                    <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                        <p>
                            Atualizado{' '}
                            {formatDistanceToNow(new Date(forecastBundle.cache.generated_at_utc), {
                                addSuffix: true,
                                locale: ptBR,
                            })}
                            {forecastBundle.cache.degraded && (
                                <span className="ml-1 text-amber-500">(degradado)</span>
                            )}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}

function CurrentConditionsBanner({ current }: { current: WeatherCurrent }) {
    const weatherInfo = getWeatherInfo(current.weather_code);

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-4 py-3 text-white"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Icon icon={weatherInfo.icon} className="h-10 w-10" />
                    <div>
                        <div className="text-3xl font-bold">{Math.round(current.temp_c)}C</div>
                        <div className="text-sm text-white/80">{current.description}</div>
                    </div>
                </div>
                <div className="space-y-1 text-right text-sm">
                    <div className="flex items-center justify-end gap-1">
                        <Icon icon="mdi:thermometer" className="h-4 w-4" />
                        <span>Sensacao {Math.round(current.feels_like_c)}C</span>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                        <Icon icon="mdi:weather-windy" className="h-4 w-4" />
                        <span>{Math.round(current.wind_kmh)} km/h {getWindDirection(current.wind_dir_deg)}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function HourlyForecast({ hours }: { hours: WeatherHourPoint[] }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
        >
            <Card className="bg-gradient-to-r from-sky-100 to-blue-100 p-4 dark:from-gray-800 dark:to-gray-700">
                <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Proximas horas</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {hours.slice(0, 12).map((hour, index) => {
                        const isNow = index === 0;
                        const weatherInfo = getWeatherInfo(hour.weather_code);

                        return (
                            <motion.div
                                key={hour.t}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={cn(
                                    'min-w-[70px] flex-shrink-0 rounded-xl p-3 text-center',
                                    isNow ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/80 dark:bg-gray-600/50'
                                )}
                            >
                                <div className="mb-1 text-xs font-medium">
                                    {isNow ? 'Agora' : `${extractHourFromLocalIso(hour.t)}h`}
                                </div>
                                <Icon icon={weatherInfo.icon} className="mx-auto my-1 h-6 w-6" />
                                <div className="text-lg font-bold">{Math.round(hour.temp_c)}C</div>
                                {hour.rain_prob_pct > 0 && (
                                    <div className={cn('mt-1 text-xs', isNow ? 'text-white/80' : 'text-blue-500')}>
                                        {hour.rain_prob_pct}%
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </Card>

            <div className="space-y-2">
                {hours.slice(0, 24).map((hour, index) => {
                    const weatherInfo = getWeatherInfo(hour.weather_code);

                    return (
                        <motion.div
                            key={hour.t}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                        >
                            <Card className="p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 text-center">
                                            <div className="text-sm font-medium">{extractHourFromLocalIso(hour.t)}:00</div>
                                        </div>
                                        <Icon icon={weatherInfo.icon} className="h-6 w-6" style={{ color: weatherInfo.color }} />
                                        <div className="text-2xl font-bold">{Math.round(hour.temp_c)}C</div>
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

function DailyForecast({ days, timezone }: { days: WeatherDayPoint[]; timezone: string }) {
    const today = getNowInTimeZone(timezone).date;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
        >
            {days.map((day, index) => {
                const isToday = day.date === today;
                const weatherInfo = getWeatherInfo(day.weather_code);
                const dayName = isToday
                    ? 'Hoje'
                    : toLocalDateDisplay(day.date, timezone, { weekday: 'short' }).replace('.', '');
                const dateStr = toLocalDateDisplay(day.date, timezone, { day: 'numeric', month: 'short' });

                return (
                    <motion.div
                        key={day.date}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card className={cn('p-4', isToday && 'border-2 border-blue-400 bg-blue-50 dark:bg-blue-900/20')}>
                            <div className="flex items-center justify-between">
                                <div className="min-w-[100px]">
                                    <div className={cn('text-sm font-semibold capitalize', isToday && 'text-blue-600 dark:text-blue-400')}>
                                        {dayName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{dateStr}</div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Icon icon={weatherInfo.icon} className="h-8 w-8" style={{ color: weatherInfo.color }} />
                                    <span className="hidden text-xs text-muted-foreground sm:block">
                                        {day.description}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    {day.rain_prob_max_pct !== undefined && day.rain_prob_max_pct > 0 && (
                                        <div className="flex items-center gap-1 text-sm text-blue-500">
                                            <Icon icon="mdi:water" className="h-4 w-4" />
                                            {day.rain_prob_max_pct}%
                                        </div>
                                    )}
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-orange-500">
                                            {Math.round(day.max_c)}C
                                        </span>
                                        <span className="mx-1 text-muted-foreground">/</span>
                                        <span className="text-lg font-bold text-blue-500">
                                            {Math.round(day.min_c)}C
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

function MarineForecast({ hours }: { hours: MarineHourPoint[] }) {
    const current = hours[0];
    if (!current) {
        return <EmptyState message="Dados do mar indisponiveis" />;
    }

    const getConditionColor = (wave: number) => {
        if (wave >= 1.5) return 'text-red-500';
        if (wave >= 0.8) return 'text-amber-500';
        return 'text-emerald-500';
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
        >
            <SeaConditionHero
                waveHeight={current.wave_m}
                wavePeriod={current.wave_period_s}
                seaTemp={current.sea_temp_c}
            />

            <CoastalPrecisionBanner />

            <Card className="p-4">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-medium">
                    <Icon icon="mdi:information-outline" className="h-4 w-4 text-muted-foreground" />
                    Toque para entender cada metrica
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <ExplainableMetric metricKey="wave_height" value={current.wave_m.toFixed(1)} unit="m" size="lg" />
                    <ExplainableMetric metricKey="wave_period" value={current.wave_period_s.toFixed(0)} unit="s" size="lg" />
                    <ExplainableMetric metricKey="wave_direction" value={getWindDirection(current.wave_dir_deg)} size="lg" />
                    {current.sea_temp_c !== undefined && (
                        <ExplainableMetric
                            metricKey="sea_temp"
                            value={Math.round(current.sea_temp_c)}
                            unit="C"
                            size="lg"
                        />
                    )}
                </div>
            </Card>

            {current.swell_m !== undefined && current.swell_m > 0 && (
                <Card className="p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                        <Icon icon="mdi:wave" className="h-4 w-4 text-blue-500" />
                        Swell
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        <ExplainableMetric metricKey="swell" value={current.swell_m.toFixed(1)} unit="m" size="md" />
                        <div className="text-center">
                            <div className="text-lg font-bold">{current.swell_period_s?.toFixed(0) ?? '-'}s</div>
                            <div className="text-xs text-muted-foreground">Periodo</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold">{getWindDirection(current.swell_dir_deg ?? 0)}</div>
                            <div className="text-xs text-muted-foreground">Direcao</div>
                        </div>
                    </div>
                </Card>
            )}

            {current.current_ms !== undefined && current.current_ms > 0 && (
                <Card className="p-4">
                    <ExplainableMetric metricKey="current" value={current.current_ms.toFixed(2)} unit=" m/s" size="lg" />
                </Card>
            )}

            <Card className="p-4">
                <h3 className="mb-3 text-sm font-medium">Previsao por hora</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {hours.slice(0, 12).map((hour, index) => {
                        const color = getConditionColor(hour.wave_m);

                        return (
                            <motion.div
                                key={hour.t}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="min-w-[70px] flex-shrink-0 rounded-xl bg-cyan-50 p-3 text-center dark:bg-cyan-900/20"
                            >
                                <div className="mb-1 text-xs font-medium">{extractHourFromLocalIso(hour.t)}h</div>
                                <Icon icon="mdi:waves" className={cn('mx-auto h-5 w-5', color)} />
                                <div className={cn('mt-1 text-sm font-bold', color)}>
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

function HourlyLoadingSkeleton() {
    return (
        <div className="space-y-3">
            <Skeleton className="h-32 rounded-xl" />
            <div className="space-y-2">
                {[...Array(6)].map((_, index) => (
                    <Skeleton key={index} className="h-16 rounded-xl" />
                ))}
            </div>
        </div>
    );
}

function DailyLoadingSkeleton() {
    return (
        <div className="space-y-2">
            {[...Array(7)].map((_, index) => (
                <Skeleton key={index} className="h-20 rounded-xl" />
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
        <div className="py-12 text-center">
            <Icon icon="mdi:weather-cloudy-alert" className="mx-auto h-16 w-16 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">{message}</p>
        </div>
    );
}
