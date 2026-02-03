import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { StepHeader } from './HelpTooltip';
import type { ReportDraft, LocationData, LocationState } from '@/types/report';

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
                const locationData: LocationData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    address: undefined,
                    reference: draft.location?.reference,
                };

                locationData.address = `Tijucas, SC`;

                onUpdate({ location: locationData });
                setLocationState({ status: 'success' });
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
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 60000,
            }
        );
    }, [draft.location?.reference, onUpdate]);

    useEffect(() => {
        if (!draft.location && locationState.status === 'idle') {
            requestLocation();
        }
    }, [draft.location, locationState.status, requestLocation]);

    const handleReferenceChange = (reference: string) => {
        if (draft.location) {
            onUpdate({
                location: {
                    ...draft.location,
                    reference,
                },
            });
        }
    };

    const canContinue = !!draft.location;

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
                        <p>Vamos usar a localização do seu celular para marcar onde está o problema.
                            Você pode adicionar um ponto de referência para facilitar.</p>
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
                        <p className="font-medium mb-1">Buscando sua localização...</p>
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
                                        <li className="flex items-start gap-2">
                                            <span className="font-bold text-primary">4.</span>
                                            <span>Toque no botão abaixo para tentar novamente</span>
                                        </li>
                                    </ol>
                                </Card>

                                <Button
                                    variant="outline"
                                    className="mt-4 w-full"
                                    onClick={requestLocation}
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Tentar novamente
                                </Button>
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

                                <Card className="w-full p-4 bg-white dark:bg-background border-red-200 dark:border-red-700 text-left">
                                    <p className="font-medium text-sm mb-3">O que você pode fazer:</p>
                                    <ul className="text-sm space-y-2 text-muted-foreground">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                            <span>Verifique se o GPS do celular está ligado</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                            <span>Saia de ambientes fechados para melhor sinal</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                            <span>Verifique sua conexão com a internet</span>
                                        </li>
                                    </ul>
                                </Card>

                                <Button
                                    variant="outline"
                                    className="mt-4 w-full"
                                    onClick={requestLocation}
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Tentar novamente
                                </Button>
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
                                <div>
                                    <p className="font-medium text-green-800 dark:text-green-300">
                                        Localização capturada!
                                    </p>
                                    <p className="text-sm text-green-700 dark:text-green-400">
                                        Precisão: aproximadamente {Math.round(draft.location.accuracy)} metros
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Map placeholder */}
                        <Card className="overflow-hidden">
                            <div className="relative h-40 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="p-3 rounded-full bg-primary shadow-lg"
                                    >
                                        <MapPin className="h-6 w-6 text-primary-foreground" />
                                    </motion.div>
                                </div>
                                <div className="absolute inset-0 opacity-30">
                                    <div className="h-full w-full" style={{
                                        backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
                                        backgroundSize: '20px 20px'
                                    }} />
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium">{draft.location.address || 'Localização capturada'}</p>
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
                                        Ajustar
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* Reference input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                Ponto de referência (opcional)
                            </label>
                            <Input
                                placeholder="Ex: em frente ao mercado, perto da escola..."
                                value={draft.location.reference || ''}
                                onChange={(e) => handleReferenceChange(e.target.value)}
                                className="h-12 rounded-xl"
                            />
                            <p className="text-xs text-muted-foreground">
                                Adicione informações que ajudem a encontrar o local mais facilmente
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Idle - Show button to get location */}
                {locationState.status === 'idle' && !draft.location && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center py-8"
                    >
                        <Button
                            size="lg"
                            onClick={requestLocation}
                            className="h-14 px-8 rounded-2xl"
                        >
                            <Navigation className="h-5 w-5 mr-2" />
                            Usar minha localização
                        </Button>
                        <p className="text-xs text-muted-foreground mt-3 text-center">
                            Vamos pedir permissão para acessar seu GPS
                        </p>
                    </motion.div>
                )}
            </div>

            {/* Manual Adjust Sheet */}
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
                            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-background p-6 pb-8 h-[70vh]"
                        >
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-muted" />

                            <h3 className="font-semibold text-lg mt-4">Ajustar localização</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Em breve você poderá ajustar o pino no mapa
                            </p>

                            <div className="mt-4 flex-1 rounded-2xl bg-muted/50 h-64 flex items-center justify-center relative">
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <MapPin className="h-8 w-8 text-primary" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Mapa interativo (em desenvolvimento)
                                </p>
                            </div>

                            <Button
                                className="w-full mt-4"
                                onClick={() => setShowManualAdjust(false)}
                            >
                                Confirmar local
                            </Button>
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
                        className="h-14 rounded-2xl flex-1 text-base"
                        onClick={onBack}
                    >
                        Voltar
                    </Button>
                    <Button
                        size="lg"
                        className={cn(
                            "h-14 rounded-2xl flex-[2] text-base font-semibold",
                            !canContinue && "opacity-50"
                        )}
                        disabled={!canContinue}
                        onClick={onNext}
                    >
                        {canContinue ? (
                            <>
                                Continuar
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
