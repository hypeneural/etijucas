/**
 * WeatherHomeCard - Card compacto para a Home
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useWeatherHome } from '@/services/weather.service';
import { getWeatherInfo, getWindDirection } from '@/types/weather';
import { cn } from '@/lib/utils';

export function WeatherHomeCard() {
    const navigate = useNavigate();
    const { data, isLoading, error } = useWeatherHome({ hours: 6 });

    if (isLoading) {
        return <WeatherHomeCardSkeleton />;
    }

    if (error || !data?.current) {
        return (
            <Card
                className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 cursor-pointer"
                onClick={() => navigate('/previsao')}
            >
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Icon icon="mdi:weather-cloudy-alert" className="h-8 w-8" />
                    <span className="text-sm">Previsão indisponível</span>
                </div>
            </Card>
        );
    }

    const { current, today, next_hours, marine_preview } = data;
    const weatherInfo = getWeatherInfo(current.weather_code);
    const isNight = checkIsNight(today?.sunrise, today?.sunset);

    // Calculate rain in next hours
    const rainNextHours = next_hours?.some(h => h.rain_prob_pct > 50);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Card
                className={cn(
                    "relative overflow-hidden cursor-pointer transition-all hover:shadow-lg active:scale-[0.98]",
                    "bg-gradient-to-br",
                    isNight
                        ? "from-indigo-900 via-purple-900 to-slate-900 text-white"
                        : "from-sky-400 via-blue-500 to-indigo-600 text-white"
                )}
                onClick={() => navigate('/previsao')}
            >
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                </div>

                <div className="relative p-4 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <motion.div
                                animate={{
                                    rotate: current.weather_code === 0 ? [0, 10, -10, 0] : 0,
                                    scale: [1, 1.05, 1]
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <Icon
                                    icon={isNight && weatherInfo.iconNight ? weatherInfo.iconNight : weatherInfo.icon}
                                    className="h-12 w-12 drop-shadow-lg"
                                />
                            </motion.div>
                            <div>
                                <div className="text-4xl font-bold tracking-tight">
                                    {Math.round(current.temp_c)}°
                                </div>
                                <div className="text-sm text-white/80">
                                    Sensação {Math.round(current.feels_like_c)}°
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium">{current.description}</div>
                            {today && (
                                <div className="text-xs text-white/70 mt-1">
                                    ↑{Math.round(today.max_c)}° ↓{Math.round(today.min_c)}°
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        {/* Wind */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2">
                            <Icon icon="mdi:weather-windy" className="h-5 w-5 mx-auto mb-1 text-white/80" />
                            <div className="text-sm font-semibold">{Math.round(current.wind_kmh)} km/h</div>
                            <div className="text-xs text-white/60">{getWindDirection(current.wind_dir_deg)}</div>
                        </div>

                        {/* Rain */}
                        <div className={cn(
                            "backdrop-blur-sm rounded-xl p-2",
                            rainNextHours ? "bg-blue-400/30" : "bg-white/10"
                        )}>
                            <Icon icon="mdi:water" className="h-5 w-5 mx-auto mb-1 text-white/80" />
                            <div className="text-sm font-semibold">{today?.rain_prob_max_pct ?? 0}%</div>
                            <div className="text-xs text-white/60">chuva</div>
                        </div>

                        {/* Marine */}
                        {marine_preview && (
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2">
                                <Icon icon="mdi:waves" className="h-5 w-5 mx-auto mb-1 text-white/80" />
                                <div className="text-sm font-semibold">{marine_preview.wave_m.toFixed(1)}m</div>
                                <div className="text-xs text-white/60">
                                    {marine_preview.sea_temp_c ? `${Math.round(marine_preview.sea_temp_c)}°` : 'mar'}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Next Hours Preview */}
                    {next_hours && next_hours.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {next_hours.slice(0, 6).map((hour, idx) => {
                                const hourInfo = getWeatherInfo(hour.weather_code);
                                const time = new Date(hour.t);
                                return (
                                    <div
                                        key={idx}
                                        className="flex-shrink-0 text-center bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1.5"
                                    >
                                        <div className="text-xs text-white/70">
                                            {time.getHours()}h
                                        </div>
                                        <Icon
                                            icon={hourInfo.icon}
                                            className="h-4 w-4 mx-auto my-0.5"
                                        />
                                        <div className="text-xs font-medium">
                                            {Math.round(hour.temp_c)}°
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Footer hint */}
                    <div className="flex items-center justify-center gap-1 text-xs text-white/50">
                        <span>Toque para ver mais</span>
                        <Icon icon="mdi:chevron-right" className="h-4 w-4" />
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

function WeatherHomeCardSkeleton() {
    return (
        <Card className="p-4 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div>
                        <Skeleton className="h-10 w-16" />
                        <Skeleton className="h-4 w-24 mt-1" />
                    </div>
                </div>
                <div className="text-right">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-4 w-16 mt-1" />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
            </div>
        </Card>
    );
}

function checkIsNight(sunrise?: string, sunset?: string): boolean {
    if (!sunrise || !sunset) {
        const hour = new Date().getHours();
        return hour < 6 || hour >= 18;
    }

    const now = new Date();
    const sunriseTime = new Date(sunrise);
    const sunsetTime = new Date(sunset);

    return now < sunriseTime || now > sunsetTime;
}

export default WeatherHomeCard;
