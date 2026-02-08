/**
 * CityGate - Intercepts app access when no city context is available
 *
 * Shows a city selection screen before TenantBootstrap if:
 * - URL doesn't contain /uf/cidade pattern
 * - No last_city_slug in localStorage
 *
 * Flow:
 * 1. Check URL for city pattern
 * 2. Check localStorage for last_city_slug
 * 3. If neither: show city selection
 * 4. If found: redirect to /{uf}/{cidade} path
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Navigation, Loader2, Search, ChevronRight } from 'lucide-react';
import { apiClient } from '@/api/client';

// API endpoints for city operations
const CITY_ENDPOINTS = {
    cities: '/cities',
    detect: '/cities/detect',
};

// Storage key for last used city
const LAST_CITY_KEY = 'etijucas_last_city';

interface City {
    id: string;
    name: string;
    uf: string;
    slug: string;
}

interface CityGateProps {
    children: React.ReactNode;
    onCitySelected?: (city: City) => void;
}

/**
 * Check if current URL has a valid city pattern (/uf/cidade)
 */
function extractCityFromUrl(): { uf: string; cidade: string } | null {
    const match = window.location.pathname.match(/^\/([a-z]{2})\/([a-z0-9-]+)/i);
    if (!match) return null;
    return { uf: match[1].toLowerCase(), cidade: match[2].toLowerCase() };
}

/**
 * Get last used city from localStorage
 */
function getLastCity(): { uf: string; cidade: string } | null {
    try {
        const stored = localStorage.getItem(LAST_CITY_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch {
        // Ignore parse errors
    }
    return null;
}

/**
 * Save last used city to localStorage
 */
export function saveLastCity(uf: string, cidade: string): void {
    try {
        localStorage.setItem(LAST_CITY_KEY, JSON.stringify({ uf, cidade }));
    } catch {
        // Ignore storage errors
    }
}

export function CityGate({ children, onCitySelected }: CityGateProps) {
    const [needsCitySelection, setNeedsCitySelection] = useState<boolean | null>(null);
    const [cities, setCities] = useState<City[]>([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Check if we need city selection on mount
    useEffect(() => {
        const urlCity = extractCityFromUrl();
        if (urlCity) {
            // URL has city, save it and proceed
            saveLastCity(urlCity.uf, urlCity.cidade);
            setNeedsCitySelection(false);
            return;
        }

        const lastCity = getLastCity();
        if (lastCity) {
            // Redirect to last used city
            const targetPath = `/${lastCity.uf}/${lastCity.cidade}${window.location.search}`;
            window.location.replace(targetPath);
            return;
        }

        // No city found, show selection
        setNeedsCitySelection(true);
        loadCities();
    }, []);

    const loadCities = async () => {
        setIsLoadingCities(true);
        setError(null);
        try {
            const response = await apiClient.get<{ data: City[] }>(CITY_ENDPOINTS.cities);
            setCities(response.data || []);
        } catch (err: any) {
            setError('Erro ao carregar cidades');
            console.error('Failed to load cities:', err);
        } finally {
            setIsLoadingCities(false);
        }
    };

    const handleSelectCity = useCallback((city: City) => {
        const uf = city.uf.toLowerCase();
        const slug = city.slug.split('-')[0]; // Remove UF suffix from slug
        saveLastCity(uf, slug);
        onCitySelected?.(city);

        // Redirect to city path
        const targetPath = `/${uf}/${slug}${window.location.search}`;
        window.location.replace(targetPath);
    }, [onCitySelected]);

    const handleDetectLocation = useCallback(async () => {
        if (!navigator.geolocation) {
            setError('GPS não suportado neste dispositivo');
            return;
        }

        setIsDetectingLocation(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const response = await apiClient.get<{ data: City | null }>(
                        `${CITY_ENDPOINTS.detect}?lat=${latitude}&lon=${longitude}`
                    );

                    if (response.data) {
                        handleSelectCity(response.data);
                    } else {
                        setError('Nenhuma cidade encontrada próxima. Escolha manualmente.');
                    }
                } catch (err) {
                    setError('Erro ao detectar cidade');
                } finally {
                    setIsDetectingLocation(false);
                }
            },
            (err) => {
                console.error('Geolocation error:', err);
                setError('Não foi possível obter sua localização');
                setIsDetectingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, [handleSelectCity]);

    // Filter cities by search query
    const filteredCities = cities.filter(city =>
        city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.uf.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Still checking
    if (needsCitySelection === null) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // City found in URL or redirecting
    if (!needsCitySelection) {
        return <>{children}</>;
    }

    // Show city selection UI
    return (
        <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 px-6 pt-12 pb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                    Bem-vindo!
                </h1>
                <p className="text-muted-foreground">
                    Escolha sua cidade para continuar
                </p>
            </div>

            {/* GPS Button */}
            <div className="px-6 mb-6">
                <button
                    onClick={handleDetectLocation}
                    disabled={isDetectingLocation}
                    className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                    {isDetectingLocation ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Detectando...
                        </>
                    ) : (
                        <>
                            <Navigation className="w-5 h-5" />
                            Usar minha localização
                        </>
                    )}
                </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 px-6 mb-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-muted-foreground">ou escolha</span>
                <div className="flex-1 h-px bg-border" />
            </div>

            {/* Search */}
            <div className="px-6 mb-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar cidade..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="px-6 mb-4">
                    <p className="text-sm text-destructive text-center">{error}</p>
                </div>
            )}

            {/* Cities List */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
                {isLoadingCities ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : filteredCities.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                        {searchQuery ? 'Nenhuma cidade encontrada' : 'Nenhuma cidade disponível'}
                    </p>
                ) : (
                    <div className="space-y-2">
                        {filteredCities.map((city) => (
                            <button
                                key={city.id}
                                onClick={() => handleSelectCity(city)}
                                className="w-full flex items-center justify-between px-4 py-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <MapPin className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-foreground">{city.name}</p>
                                        <p className="text-sm text-muted-foreground">{city.uf}</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CityGate;
