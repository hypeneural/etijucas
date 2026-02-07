/**
 * CitySelector Component
 * 
 * Allows users to select their city during onboarding or switch cities.
 * Includes GPS-based city detection as a convenience feature.
 * 
 * Usage:
 * ```tsx
 * <CitySelector 
 *   onSelect={(city) => console.log('Selected:', city)} 
 *   autoDetect={true}
 * />
 * ```
 */

import { useState, useEffect } from 'react';
import { useTenantStore, resolveCityFromUrl } from '../store/useTenantStore';

interface City {
    id: string;
    name: string;
    slug: string;
    uf: string;
    fullName: string;
}

interface CitySelectorProps {
    onSelect: (city: City) => void;
    autoDetect?: boolean;
    showCurrentCity?: boolean;
    className?: string;
}

export function CitySelector({
    onSelect,
    autoDetect = false,
    showCurrentCity = true,
    className = '',
}: CitySelectorProps) {
    const [cities, setCities] = useState<City[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetecting, setIsDetecting] = useState(false);
    const [detectedCity, setDetectedCity] = useState<City | null>(null);
    const [error, setError] = useState<string | null>(null);

    const currentCity = useTenantStore((s) => s.city);

    // Fetch available cities on mount
    useEffect(() => {
        fetchCities();

        if (autoDetect) {
            detectCityByGPS();
        }
    }, [autoDetect]);

    async function fetchCities() {
        try {
            const baseUrl = import.meta.env.VITE_API_URL || '/api';
            const response = await fetch(`${baseUrl}/v1/cities`);

            if (!response.ok) throw new Error('Failed to fetch cities');

            const { data } = await response.json();
            setCities(data);
        } catch (err) {
            setError('Erro ao carregar cidades');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    async function detectCityByGPS() {
        if (!navigator.geolocation) {
            console.log('Geolocation not available');
            return;
        }

        setIsDetecting(true);

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 10000,
                    enableHighAccuracy: false,
                });
            });

            const { latitude, longitude } = position.coords;

            // Call backend to resolve city from coordinates
            const baseUrl = import.meta.env.VITE_API_URL || '/api';
            const response = await fetch(
                `${baseUrl}/v1/cities/detect?lat=${latitude}&lon=${longitude}`
            );

            if (response.ok) {
                const { data } = await response.json();
                if (data) {
                    setDetectedCity(data);
                }
            }
        } catch (err) {
            // GPS detection failed silently - user can select manually
            console.log('GPS detection failed:', err);
        } finally {
            setIsDetecting(false);
        }
    }

    function handleSelect(city: City) {
        onSelect(city);
    }

    if (isLoading) {
        return (
            <div className={`city-selector ${className}`}>
                <div className="loading-spinner" />
                <p>Carregando cidades...</p>
            </div>
        );
    }

    return (
        <div className={`city-selector ${className}`}>
            {showCurrentCity && currentCity && (
                <div className="current-city">
                    <span className="label">Cidade atual:</span>
                    <span className="value">{currentCity.name}/{currentCity.uf}</span>
                </div>
            )}

            {isDetecting && (
                <div className="detecting">
                    <div className="loading-spinner small" />
                    <span>Detectando sua localização...</span>
                </div>
            )}

            {detectedCity && !isDetecting && (
                <div className="detected-city">
                    <p>📍 Detectamos que você está em <strong>{detectedCity.name}</strong></p>
                    <button
                        onClick={() => handleSelect(detectedCity)}
                        className="btn-primary"
                    >
                        Usar esta cidade
                    </button>
                </div>
            )}

            {error && <p className="error">{error}</p>}

            <div className="city-list">
                <h3>Selecione sua cidade</h3>
                <div className="cities-grid">
                    {cities.map((city) => (
                        <button
                            key={city.id}
                            onClick={() => handleSelect(city)}
                            className={`city-card ${currentCity?.id === city.id ? 'active' : ''}`}
                        >
                            <span className="city-name">{city.name}</span>
                            <span className="city-uf">{city.uf}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Hook for GPS-based city detection
 */
export function useGPSCityDetection() {
    const [isDetecting, setIsDetecting] = useState(false);
    const [detectedCity, setDetectedCity] = useState<City | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function detect() {
        if (!navigator.geolocation) {
            setError('Geolocalização não disponível');
            return null;
        }

        setIsDetecting(true);
        setError(null);

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 10000,
                    enableHighAccuracy: false,
                });
            });

            const { latitude, longitude } = position.coords;

            const baseUrl = import.meta.env.VITE_API_URL || '/api';
            const response = await fetch(
                `${baseUrl}/v1/cities/detect?lat=${latitude}&lon=${longitude}`
            );

            if (response.ok) {
                const { data } = await response.json();
                setDetectedCity(data);
                return data;
            }

            return null;
        } catch (err) {
            setError('Não foi possível detectar sua localização');
            return null;
        } finally {
            setIsDetecting(false);
        }
    }

    return { detect, isDetecting, detectedCity, error };
}

export default CitySelector;
