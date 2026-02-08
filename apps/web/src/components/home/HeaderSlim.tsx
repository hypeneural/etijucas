/**
 * HeaderSlim - Compact Header with Weather Inline
 * 
 * A slimmer version of HeroHeader that:
 * - Takes less vertical space
 * - Shows weather temp inline
 * - Has notification badge connected to real data
 * - Collapses smoothly on scroll
 */

import React, { useState } from 'react';
import { useTenantNavigate } from '@/hooks';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Bell, ChevronDown, User, CloudSun, MapPin } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useBairros } from '@/hooks';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppName } from '@/hooks/useCityName';
import { WeatherMiniPayload } from '@/types/home.types';
import { cn } from '@/lib/utils';
import { useWeatherBundle } from '@/services/weather.service';

interface HeaderSlimProps {
    scrollRef: React.RefObject<HTMLDivElement>;
    weather?: WeatherMiniPayload;
    notificationCount?: number;
    hasActiveAlert?: boolean;
}

// Weather icon based on code
function WeatherIcon({ code, className }: { code: number; className?: string }) {
    const color = code >= 61 ? 'text-blue-200' : 'text-amber-300';
    return <CloudSun className={cn(color, className)} />;
}

export default function HeaderSlim({
    scrollRef,
    weather,
    notificationCount = 0,
    hasActiveAlert = false,
}: HeaderSlimProps) {
    const navigate = useTenantNavigate();
    const { selectedBairro, setSelectedBairro } = useAppStore();
    const { user, isAuthenticated } = useAuthStore();
    const [bairroSheetOpen, setBairroSheetOpen] = useState(false);
    const { data: bairros = [] } = useBairros();
    const appName = useAppName();
    const { data: weatherBundle } = useWeatherBundle({
        sections: ['current'],
        days: 1,
        units: 'metric',
    });

    const bundleCurrent = weatherBundle?.data?.current;
    const weatherFromBundle = (() => {
        if (!bundleCurrent || typeof bundleCurrent !== 'object' || Array.isArray(bundleCurrent)) {
            return null;
        }

        const payload = bundleCurrent as Record<string, unknown>;
        const temp = Number(payload.temperature_2m);
        const icon = Number(payload.weather_code);

        if (!Number.isFinite(temp)) {
            return null;
        }

        return {
            temp: Math.round(temp),
            icon: Number.isFinite(icon) ? icon : 0,
        };
    })();

    const inlineWeather = weatherFromBundle
        ? {
            temp: weatherFromBundle.temp,
            icon: weatherFromBundle.icon,
            frase: '',
            uv: 'moderate',
        }
        : weather;

    const { scrollY } = useScroll({
        container: scrollRef,
    });

    // Slim header: 80px -> 60px on scroll
    const headerHeight = useTransform(scrollY, [0, 60], [80, 60]);
    const weatherOpacity = useTransform(scrollY, [0, 40], [1, 0]);
    const bairroOpacity = useTransform(scrollY, [0, 30], [1, 0]);

    const handleProfileClick = () => {
        if (isAuthenticated) {
            navigate('/perfil');
        } else {
            navigate('/login');
        }
    };

    const handleNotificationClick = () => {
        navigate('/notificacoes');
    };

    return (
        <motion.header
            style={{ height: headerHeight }}
            className="relative overflow-hidden bg-gradient-to-r from-primary to-primary-dark"
        >
            {/* Subtle wave background */}
            <div className="absolute inset-0 overflow-hidden opacity-20">
                <svg
                    className="absolute w-[200%] h-full animate-wave"
                    viewBox="0 0 1200 100"
                    preserveAspectRatio="none"
                >
                    <path
                        d="M0,50 C300,80 600,20 900,50 C1050,70 1200,50 1200,50 L1200,100 L0,100 Z"
                        fill="currentColor"
                        className="text-primary-foreground"
                    />
                </svg>
            </div>

            {/* Content */}
            <div className="relative z-10 flex items-center justify-between h-full px-4 pt-safe-top">
                {/* Left: Logo + Weather */}
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-bold text-primary-foreground">
                        {appName}
                    </h1>

                    {/* Weather inline */}
                    {inlineWeather && (
                        <motion.div
                            style={{ opacity: weatherOpacity }}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/10"
                        >
                            <WeatherIcon code={inlineWeather.icon} className="w-4 h-4" />
                            <span className="text-sm font-medium text-primary-foreground">
                                {inlineWeather.temp}°
                            </span>
                        </motion.div>
                    )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    {/* Bairro selector - compact */}
                    <Sheet open={bairroSheetOpen} onOpenChange={setBairroSheetOpen}>
                        <SheetTrigger asChild>
                            <motion.button
                                style={{ opacity: bairroOpacity }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 text-primary-foreground text-xs font-medium"
                            >
                                <MapPin className="w-3 h-3" />
                                <span className="max-w-[60px] truncate">{selectedBairro?.nome ?? 'Bairro'}</span>
                                <ChevronDown className="w-3 h-3" />
                            </motion.button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="rounded-t-3xl">
                            <SheetHeader>
                                <SheetTitle>Selecione seu bairro</SheetTitle>
                            </SheetHeader>
                            <div className="grid grid-cols-2 gap-2 mt-4 pb-8">
                                {bairros.map((bairro) => (
                                    <motion.button
                                        key={bairro.id}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            setSelectedBairro(bairro);
                                            setBairroSheetOpen(false);
                                        }}
                                        className={cn(
                                            'p-3 rounded-xl text-left font-medium transition-colors',
                                            selectedBairro?.id === bairro.id
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-foreground hover:bg-muted/80'
                                        )}
                                    >
                                        {bairro.nome}
                                    </motion.button>
                                ))}
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Notifications */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleNotificationClick}
                        className="relative p-2 rounded-full bg-white/10"
                    >
                        <Bell className="w-5 h-5 text-primary-foreground" />
                        {notificationCount > 0 && (
                            <Badge
                                variant="destructive"
                                className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center text-[10px]"
                            >
                                {notificationCount > 9 ? '9+' : notificationCount}
                            </Badge>
                        )}
                        {/* Alert pulse indicator */}
                        {hasActiveAlert && notificationCount === 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse" />
                        )}
                    </motion.button>

                    {/* Profile */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleProfileClick}
                        className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden"
                    >
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.nome} className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-4 h-4 text-primary-foreground" />
                        )}
                    </motion.button>
                </div>
            </div>
        </motion.header>
    );
}
