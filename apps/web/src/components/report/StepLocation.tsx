import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    Navigation,
    AlertTriangle,
    Edit3,
    Loader2,
    Info,
    Settings,
    CheckCircle,
    ChevronRight,
    RefreshCw,
    Search,
    Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { StepHeader } from './HelpTooltip';
import { LocationMap } from './LocationMap';
import { reportService } from '@/services/report.service';
import { haptic as triggerHaptic } from '@/hooks/useHaptic';
import type { ReportDraft, LocationData, LocationState, GeocodeSuggestion } from '@/types/report';

interface StepLocationProps {
    draft: ReportDraft;
    onUpdate: (updates: Partial<ReportDraft>) => void;
    onNext: () => void;
    onBack: () => void;
}

export function StepLocation({ draft, onUpdate, onNext, onBack }: StepLocationProps) {
    const [locationState, setLocationState] = useState<LocationState>({
        status: 'idle',
    });
    const [showManualAdjust, setShowManualAdjust] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<GeocodeSuggestion[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
    const [reverseGeocodeFailed, setReverseGeocodeFailed] = useState(false);

    // Reverse geocode to get address from coordinates
    const reverseGeocode = useCallback(async (lat: number, lon: number): Promise<string | undefined> => {
        try {
            setIsReverseGeocoding(true);
            const result = await reportService.geocodeReverse(lat, lon);
            const resolvedAddress = result?.address || result?.displayName;
            setReverseGeocodeFailed(!resolvedAddress);
            return resolvedAddress || undefined;
        } catch (error) {
            console.warn('[StepLocation] Reverse geocode failed:', error);
            setReverseGeocodeFailed(true);
            return undefined;
        } finally {
            setIsReverseGeocoding(false);
        }
    }, []);

    const requestLocation = useCallback(async () => {
        if (!navigator.geolocation) {
            setLocationState({
                status: 'error',
                errorMessage: 'Seu navegador não suporta geolocalização. Tente usar Chrome, Safari ou Firefox.',
            });
            return;
        }

        setLocationState({ status: 'requesting' });

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                // Get address via reverse geocoding
                const address = await reverseGeocode(lat, lon);
                setReverseGeocodeFailed(!address);

                const locationData: LocationData = {
                    latitude: lat,
                    longitude: lon,
                    accuracy: position.coords.accuracy,
                    address: address || 'Tijucas, SC',
                    source: 'gps',
                    quality: position.coords.accuracy <= 50 ? 'precisa' : 'aproximada',
                };

                onUpdate({ location: locationData });
                setLocationState({ status: 'success' });
                triggerHaptic('success');
            },
            (error) => {
                let errorMessage = 'Não conseguimos acessar sua localização.';

                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage = 'Você não permitiu o acesso à sua localização.';
                    setLocationState({ status: 'denied', errorMessage });
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMessage = 'Não foi possível determinar sua localização. Verifique se o GPS está ativado.';
                    setLocationState({ status: 'error', errorMessage });
                } else if (error.code === error.TIMEOUT) {
                    errorMessage = 'Demorou muito para obter sua localização. Verifique sua conexão e tente novamente.';
                    setLocationState({ status: 'error', errorMessage });
                }
                triggerHaptic('warning');
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 60000,
            }
        );
    }, [onUpdate, reverseGeocode]);

    // AbortController ref for cancelling pending requests
    const abortControllerRef = useRef<AbortController | null>(null);

    // Search for address with bias towards current location
    const handleSearch = useCallback(async (query: string) => {
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setIsSearching(true);
        try {
            // Pass current location for bias if available
            const biasLat = draft.location?.latitude;
            const biasLon = draft.location?.longitude;

            const results = await reportService.geocodeAutocomplete(query, biasLat, biasLon);
            setSearchResults(results);
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.warn('[StepLocation] Search failed:', error);
            }
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [draft.location?.latitude, draft.location?.longitude]);

    // Debounce search with optimal timing (300ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) {
                handleSearch(searchQuery);
            }
        }, 300);
        return () => {
            clearTimeout(timer);
            // Also abort on cleanup
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [searchQuery, handleSearch]);

    // Select address from search results
    const handleSelectAddress = (suggestion: GeocodeSuggestion) => {
        const locationData: LocationData = {
            latitude: suggestion.latitude,
            longitude: suggestion.longitude,
            accuracy: 100, // estimated
            address: suggestion.address || suggestion.displayName,
            source: 'manual',
            quality: 'manual',
        };

        onUpdate({ location: locationData });
        setLocationState({ status: 'success' });
        setReverseGeocodeFailed(false);
        setSearchQuery('');
        setSearchResults([]);
        setShowManualAdjust(false);
        triggerHaptic('selection');
    };

    useEffect(() => {
        if (!draft.location && locationState.status === 'idle') {
            requestLocation();
        }
    }, [draft.location, locationState.status, requestLocation]);

    const handleConfirmLocation = useCallback(() => {
        if (!draft.location) return;
        triggerHaptic('success');
        onNext();
    }, [draft.location, onNext]);

    const canContinue = !!draft.location;

    // Quality badge component
    const QualityBadge = ({ quality }: { quality: string }) => {
        const config = {
            precisa: { color: 'text-green-600 bg-green-100', icon: Target, label: 'Precisa' },
            aproximada: { color: 'text-amber-600 bg-amber-100', icon: MapPin, label: 'Aproximada' },
            manual: { color: 'text-blue-600 bg-blue-100', icon: Edit3, label: 'Informada' },
        }[quality] || { color: 'text-gray-600 bg-gray-100', icon: MapPin, label: 'Desconhecida' };

        const Icon = config.icon;

        return (
            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', config.color)}>
                <Icon className="h-3 w-3" />
                {config.label}
            </span>
        );
    };

    return (
        <div className="space-y-6 pb-48">
            <StepHeader
                title="Onde foi?"
                subtitle="Precisamos saber o local do problema"
                helpTitle="Por que precisamos da localização?"
                helpContent={[
                    "A localização ajuda nossa equipe a encontrar o problema rapidamente.",
                    "Usamos o GPS do seu celular para maior precisão.",
                    "Sua localização não é compartilhada publicamente, apenas com a equipe responsável."
                ]}
            />

            {/* Instructions */}
            <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                        <p className="font-medium mb-1">Como funciona:</p>
                        <p>Usamos o GPS para marcar o local, ou você pode buscar o endereço manualmente.</p>
                    </div>
                </div>
            </Card>

            {/* Location Status */}
            <div className="space-y-4">
                {/* Requesting */}
                {locationState.status === 'requesting' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-12 text-center"
                    >
                        <div className="p-4 rounded-full bg-primary/10 mb-4">
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        </div>
                        <p className="font-medium mb-1">
                            {isReverseGeocoding ? 'Buscando endereço...' : 'Buscando sua localização...'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Se aparecer uma mensagem, toque em "Permitir"
                        </p>
                    </motion.div>
                )}

                {/* Permission Denied */}
                {locationState.status === 'denied' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="p-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                            <div className="flex flex-col items-center text-center">
                                <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
                                    <MapPin className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                                </div>
                                <h3 className="font-semibold text-lg text-amber-800 dark:text-amber-300">
                                    Localização bloqueada
                                </h3>
                                <p className="text-sm text-amber-700 dark:text-amber-400 mt-2 mb-4">
                                    {locationState.errorMessage}
                                </p>

                                <Card className="w-full p-4 bg-white dark:bg-background border-amber-200 dark:border-amber-700 text-left">
                                    <p className="font-medium text-sm mb-3 flex items-center gap-2">
                                        <Settings className="h-4 w-4" />
                                        Como permitir o acesso:
                                    </p>
                                    <ol className="text-sm space-y-2 text-muted-foreground">
                                        <li className="flex items-start gap-2">
                                            <span className="font-bold text-primary">1.</span>
                                            <span>Olhe na barra de endereço do navegador</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="font-bold text-primary">2.</span>
                                            <span>Clique no ícone de cadeado</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="font-bold text-primary">3.</span>
                                            <span>Mude "Localização" para "Permitir"</span>
                                        </li>
                                    </ol>
                                </Card>

                                <div className="flex gap-2 mt-4 w-full">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={requestLocation}
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Tentar GPS
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => setShowManualAdjust(true)}
                                    >
                                        <Search className="h-4 w-4 mr-2" />
                                        Buscar endereço
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Generic Error */}
                {locationState.status === 'error' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
                            <div className="flex flex-col items-center text-center">
                                <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                                    <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="font-semibold text-lg text-red-800 dark:text-red-300">
                                    Erro ao obter localização
                                </h3>
                                <p className="text-sm text-red-700 dark:text-red-400 mt-2 mb-4">
                                    {locationState.errorMessage}
                                </p>

                                <div className="flex gap-2 w-full">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={requestLocation}
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Tentar GPS
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => setShowManualAdjust(true)}
                                    >
                                        <Search className="h-4 w-4 mr-2" />
                                        Buscar endereço
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Success - Location found */}
                {draft.location && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {/* Success message */}
                        <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-green-800 dark:text-green-300">
                                        Localização capturada!
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <QualityBadge quality={draft.location.quality} />
                                        {draft.location.accuracy && draft.location.source === 'gps' && (
                                            <span className="text-xs text-muted-foreground">
                                                ±{Math.round(draft.location.accuracy)}m
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Real Leaflet Map with draggable pin */}
                        <LocationMap
                            latitude={draft.location.latitude}
                            longitude={draft.location.longitude}
                            hasGPS={draft.location.source === 'gps'}
                            onLocationChange={async (lat, lon) => {
                                // Debounced reverse geocode on pin move
                                const address = await reverseGeocode(lat, lon);
                                onUpdate({
                                    location: {
                                        ...draft.location!,
                                        latitude: lat,
                                        longitude: lon,
                                        address: address || draft.location!.address,
                                        source: 'mapa',
                                        quality: 'precisa',
                                    },
                                });
                            }}
                            onCenterGPS={draft.location.source === 'gps' ? requestLocation : undefined}
                            onConfirmLocation={handleConfirmLocation}
                        />

                        {/* Address display */}
                        <Card className="p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    {isReverseGeocoding ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                            <span className="text-muted-foreground">Buscando endereço...</span>
                                        </div>
                                    ) : (
                                        <p className="font-medium">{draft.location.address || 'Localização capturada'}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Coordenadas: {draft.location.latitude.toFixed(4)}, {draft.location.longitude.toFixed(4)}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowManualAdjust(true)}
                                >
                                    <Edit3 className="h-3.5 w-3.5 mr-1" />
                                    Buscar
                                </Button>
                            </div>
                        </Card>

                        {reverseGeocodeFailed && (
                            <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-medium text-amber-800 dark:text-amber-300">
                                            Endereco indisponivel no momento
                                        </p>
                                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                                            Nao conseguimos converter as coordenadas em endereco. Voce pode seguir com o ponto no mapa.
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={handleConfirmLocation}
                                        className="shrink-0"
                                    >
                                        Enviar mesmo assim
                                    </Button>
                                </div>
                            </Card>
                        )}

                        {/* Observation / Reference Point */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Edit3 className="h-4 w-4 text-muted-foreground" />
                                Ponto de referência (opcional)
                            </label>
                            <Input
                                placeholder="Ex: Próximo ao Supermercado X"
                                value={draft.locationNote || ''}
                                onChange={(e) => onUpdate({ locationNote: e.target.value })}
                                className="h-12 rounded-xl"
                                maxLength={100}
                            />
                            <p className="text-xs text-muted-foreground">
                                Ajude a localizar o problema com uma referência
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Idle - Show button to get location */}
                {locationState.status === 'idle' && !draft.location && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center py-8 gap-4"
                    >
                        <Button
                            size="lg"
                            onClick={requestLocation}
                            className="h-12 px-8 rounded-xl"
                        >
                            <Navigation className="h-5 w-5 mr-2" />
                            Usar minha localização
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                            ou
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => setShowManualAdjust(true)}
                        >
                            <Search className="h-4 w-4 mr-2" />
                            Buscar endereço manualmente
                        </Button>
                    </motion.div>
                )}
            </div>

            {/* Manual Address Search Sheet */}
            <AnimatePresence>
                {showManualAdjust && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/40"
                            onClick={() => setShowManualAdjust(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-background p-6 pb-8 max-h-[80vh] overflow-y-auto"
                        >
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-muted" />

                            <h3 className="font-semibold text-lg mt-4">Buscar endereço</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Digite o nome da rua ou local
                            </p>

                            <div className="relative mt-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Ex: Rua Principal, Centro, Tijucas"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-12 rounded-xl"
                                    autoFocus
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {searchResults.map((result, idx) => (
                                        <motion.button
                                            key={result.placeId || idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => handleSelectAddress(result)}
                                            className="w-full text-left p-3 rounded-xl border hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-sm">{result.address}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {result.displayName}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            )}

                            {searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Nenhum resultado encontrado. Tente outro endereço.
                                </p>
                            )}

                            <div className="flex gap-2 mt-6">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowManualAdjust(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={requestLocation}
                                >
                                    <Navigation className="h-4 w-4 mr-2" />
                                    Usar GPS
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Fixed Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 pb-24 bg-background/95 backdrop-blur-lg border-t z-10">
                <div className="flex gap-3 max-w-lg mx-auto">
                    <Button
                        variant="outline"
                        size="lg"
                        className="h-9 rounded-xl flex-1 text-base"
                        onClick={onBack}
                    >
                        Voltar
                    </Button>
                    <Button
                        size="lg"
                        className={cn(
                            "h-9 rounded-xl flex-[2] text-base font-semibold",
                            !canContinue && "opacity-50"
                        )}
                        disabled={!canContinue}
                        onClick={handleConfirmLocation}
                    >
                        {canContinue ? (
                            <>
                                {reverseGeocodeFailed ? 'Enviar mesmo assim' : 'Continuar'}
                                <ChevronRight className="h-5 w-5 ml-2" />
                            </>
                        ) : (
                            'Aguardando localização...'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
