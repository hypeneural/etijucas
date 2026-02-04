/**
 * WeatherPage - Página completa de Previsão do Tempo
 * 3 abas: Hoje (hora a hora), 10 Dias, Mar
 */

import { useState } from 'react';
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

export default function WeatherPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('hoje');

    const { data: forecast, isLoading: loadingForecast, refetch: refetchForecast } = useWeatherForecast({ hours: 48, days: 10 });
    const { data: marine, isLoading: loadingMarine, refetch: refetchMarine } = useMarineForecast({ hours: 48, days: 10 });

    const isLoading = loadingForecast || loadingMarine;

    const handleRefresh = () => {
        refetchForecast();
        refetchMarine();
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                                <HourlyForecast hours={forecast.hourly} />
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
// Marine Forecast Tab
// ======================================================

function MarineForecast({ hours }: { hours: MarineHourPoint[] }) {
    // Group by day
    const grouped: Record<string, MarineHourPoint[]> = {};
    hours.forEach(hour => {
        const date = hour.t.split('T')[0];
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(hour);
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
        >
            {/* Current marine conditions */}
            {hours[0] && (
                <Card className="p-4 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                    <h3 className="text-sm font-medium mb-3 text-cyan-800 dark:text-cyan-300">Condições Atuais do Mar</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                            <Icon icon="mdi:waves" className="h-8 w-8 mx-auto text-cyan-600" />
                            <div className="text-2xl font-bold mt-1">{hours[0].wave_m.toFixed(1)}m</div>
                            <div className="text-xs text-muted-foreground">Altura das ondas</div>
                        </div>
                        <div className="text-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                            <Icon icon="mdi:timer-outline" className="h-8 w-8 mx-auto text-cyan-600" />
                            <div className="text-2xl font-bold mt-1">{hours[0].wave_period_s.toFixed(0)}s</div>
                            <div className="text-xs text-muted-foreground">Período</div>
                        </div>
                        {hours[0].sea_temp_c && (
                            <div className="text-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                                <Icon icon="mdi:thermometer" className="h-8 w-8 mx-auto text-cyan-600" />
                                <div className="text-2xl font-bold mt-1">{Math.round(hours[0].sea_temp_c)}°C</div>
                                <div className="text-xs text-muted-foreground">Temp. do mar</div>
                            </div>
                        )}
                        {hours[0].current_ms !== undefined && hours[0].current_ms > 0 && (
                            <div className="text-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                                <Icon icon="mdi:current-ac" className="h-8 w-8 mx-auto text-cyan-600" />
                                <div className="text-2xl font-bold mt-1">{hours[0].current_ms.toFixed(1)} m/s</div>
                                <div className="text-xs text-muted-foreground">Corrente</div>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Swell info */}
            {hours[0]?.swell_m !== undefined && hours[0].swell_m > 0 && (
                <Card className="p-4">
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Icon icon="mdi:wave" className="h-4 w-4 text-blue-500" />
                        Swell (Ondulação)
                    </h3>
                    <div className="flex items-center justify-between">
                        <span>Altura: <strong>{hours[0].swell_m.toFixed(1)}m</strong></span>
                        <span>Período: <strong>{hours[0].swell_period_s?.toFixed(0) ?? '-'}s</strong></span>
                        <span>Direção: <strong>{getWindDirection(hours[0].swell_dir_deg ?? 0)}</strong></span>
                    </div>
                </Card>
            )}

            {/* Hourly marine forecast */}
            <Card className="p-4">
                <h3 className="text-sm font-medium mb-3">Previsão por hora</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {hours.slice(0, 12).map((hour, idx) => {
                        const time = new Date(hour.t);

                        return (
                            <div
                                key={hour.t}
                                className="flex-shrink-0 text-center p-3 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 min-w-[70px]"
                            >
                                <div className="text-xs font-medium mb-1">{time.getHours()}h</div>
                                <Icon icon="mdi:waves" className="h-5 w-5 mx-auto text-cyan-600" />
                                <div className="text-sm font-bold mt-1">{hour.wave_m.toFixed(1)}m</div>
                                <div className="text-xs text-muted-foreground">{hour.wave_period_s.toFixed(0)}s</div>
                            </div>
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
