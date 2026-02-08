/**
 * CitySwitcher
 *
 * Quick city selection component for multi-tenancy.
 * Shows current city with ability to switch to saved cities.
 * Can detect nearby city via GPS.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    ChevronDown,
    Navigation,
    Loader2,
    Check,
    X,
    Globe,
} from 'lucide-react';
import { useTenantStore } from '@/store/useTenantStore';
import { apiClient } from '@/api/client';
import { cn } from '@/lib/utils';
import type { City } from '@/types/api.types';

interface CitySwitcherProps {
    /** Compact mode for header */
    compact?: boolean;
    /** Show GPS detection button */
    showGps?: boolean;
    /** Callback after city change */
    onCityChange?: (city: City) => void;
    className?: string;
}

export function CitySwitcher({
    compact = false,
    showGps = true,
    onCityChange,
    className,
}: CitySwitcherProps) {
    const { city: currentCity, setCity, availableCities } = useTenantStore();

    // State
    const [isOpen, setIsOpen] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [cities, setCities] = useState<City[]>([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);

    // Load available cities
    useEffect(() => {
        if (availableCities?.length) {
            setCities(availableCities);
        } else if (isOpen && cities.length === 0) {
            loadCities();
        }
    }, [isOpen, availableCities]);

    const loadCities = async () => {
        setIsLoadingCities(true);
        try {
            const response = await apiClient.get<{ data: City[] }>('/v1/cities');
            setCities(response.data || []);
        } catch (error) {
            console.error('Failed to load cities:', error);
        } finally {
            setIsLoadingCities(false);
        }
    };

    /**
     * Detect city via GPS (offline-first)
     * Uses cached cities with Haversine distance first, falls back to API
     */
    const handleDetectCity = async () => {
        if (!navigator.geolocation) {
            return;
        }

        setIsDetecting(true);

        try {
            // Try offline detection first
            const { detectCityOffline } = await import('@/services/city-detection.service');
            const offlineResult = await detectCityOffline();

            if (offlineResult) {
                // Found city offline!
                const detectedCity: City = {
                    id: offlineResult.city.id,
                    nome: offlineResult.city.name,
                    slug: offlineResult.city.slug,
                    uf: offlineResult.city.uf,
                };
                handleSelectCity(detectedCity);
                return;
            }
        } catch (offlineErr) {
            console.warn('Offline detection failed, trying API:', offlineErr);
        }

        // Fallback to API
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const response = await apiClient.get<{ data: City }>(
                        `/v1/cities/detect?lat=${position.coords.latitude}&lng=${position.coords.longitude}`
                    );

                    if (response.data) {
                        handleSelectCity(response.data);
                    }
                } catch (error) {
                    console.error('City detection failed:', error);
                } finally {
                    setIsDetecting(false);
                }
            },
            (error) => {
                console.error('GPS error:', error);
                setIsDetecting(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    /**
     * Select a city
     */
    const handleSelectCity = (city: City) => {
        setCity(city);
        setIsOpen(false);
        onCityChange?.(city);

        if ('vibrate' in navigator) {
            navigator.vibrate(30);
        }
    };

    // Compact mode for headers
    if (compact) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-lg',
                    'hover:bg-muted/50 transition-colors',
                    className
                )}
            >
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                    {currentCity?.nome || 'Selecionar'}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
        );
    }

    return (
        <>
            {/* Trigger Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                whileTap={{ scale: 0.98 }}
                className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl',
                    'bg-card border border-border w-full',
                    'hover:border-primary/30 transition-colors',
                    className
                )}
            >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                    <p className="text-xs text-muted-foreground">Você está em</p>
                    <p className="font-semibold">{currentCity?.nome || 'Selecione uma cidade'}</p>
                </div>
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </motion.button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 z-40"
                        />

                        {/* Sheet */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl"
                        >
                            {/* Handle */}
                            <div className="flex justify-center py-3">
                                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 pb-4">
                                <h2 className="text-lg font-bold">Selecionar cidade</h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-lg hover:bg-muted"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* GPS Button */}
                            {showGps && (
                                <div className="px-6 pb-4">
                                    <motion.button
                                        onClick={handleDetectCity}
                                        disabled={isDetecting}
                                        whileTap={{ scale: 0.98 }}
                                        className={cn(
                                            'w-full flex items-center justify-center gap-2 px-4 py-3',
                                            'rounded-xl bg-primary/10 text-primary font-medium',
                                            'disabled:opacity-50'
                                        )}
                                    >
                                        {isDetecting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Detectando...
                                            </>
                                        ) : (
                                            <>
                                                <Navigation className="w-5 h-5" />
                                                Detectar minha cidade
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            )}

                            {/* Cities List */}
                            <div className="px-6 pb-safe max-h-[40vh] overflow-y-auto">
                                {isLoadingCities ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <div className="space-y-2 pb-4">
                                        {cities.map((city) => {
                                            const isSelected = currentCity?.id === city.id;

                                            return (
                                                <motion.button
                                                    key={city.id}
                                                    onClick={() => handleSelectCity(city)}
                                                    whileTap={{ scale: 0.98 }}
                                                    className={cn(
                                                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
                                                        'border transition-all',
                                                        isSelected
                                                            ? 'border-primary bg-primary/5'
                                                            : 'border-border bg-card hover:border-primary/30'
                                                    )}
                                                >
                                                    <div className={cn(
                                                        'w-8 h-8 rounded-lg flex items-center justify-center',
                                                        isSelected
                                                            ? 'bg-primary text-white'
                                                            : 'bg-muted text-muted-foreground'
                                                    )}>
                                                        {isSelected ? (
                                                            <Check className="w-4 h-4" />
                                                        ) : (
                                                            <Globe className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <p className="font-medium">{city.nome}</p>
                                                        {city.state && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {city.state.nome}
                                                            </p>
                                                        )}
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

export default CitySwitcher;
