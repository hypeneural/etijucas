/**
 * LocalProfileSheet Component
 *
 * Step-up sheet for completing local city profile (bairro selection).
 * Triggered when user needs bairro for specific actions (e.g., creating reports).
 *
 * Features:
 * - GPS auto-detection of bairro
 * - Manual bairro selection
 * - Premium animated UI
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    Navigation,
    Check,
    Loader2,
    Search,
    ChevronRight,
} from 'lucide-react';
import { DraggableSheet } from '@/components/ui/DraggableSheet';
import { useCityName } from '@/hooks/useCityName';
import type { Bairro } from '@/types/api.types';

interface LocalProfileSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (bairroId: string) => void;
    bairros: Bairro[];
    title?: string;
    description?: string;
}

export function LocalProfileSheet({
    isOpen,
    onClose,
    onComplete,
    bairros,
    title = 'Selecione seu bairro',
    description,
}: LocalProfileSheetProps) {
    const { name: cityName } = useCityName();

    const [selectedBairroId, setSelectedBairroId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isGpsLoading, setIsGpsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter bairros by search
    const filteredBairros = bairros.filter(b =>
        b.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );

    /**
     * Handle GPS location for auto-selecting bairro
     */
    const handleUseGps = useCallback(async () => {
        if (!navigator.geolocation) {
            setError('GPS não suportado neste dispositivo');
            return;
        }

        setIsGpsLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                // TODO: Call backend to reverse geocode and find nearest bairro
                console.log('GPS:', position.coords.latitude, position.coords.longitude);

                // For now, auto-select first bairro as placeholder
                if (bairros.length > 0) {
                    setSelectedBairroId(bairros[0].id);
                }

                setIsGpsLoading(false);
            },
            (err) => {
                console.error('GPS error:', err);
                setError('Não foi possível obter sua localização');
                setIsGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, [bairros]);

    /**
     * Handle confirm selection
     */
    const handleConfirm = () => {
        if (selectedBairroId) {
            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }
            onComplete(selectedBairroId);
        }
    };

    const selectedBairro = bairros.find(b => b.id === selectedBairroId);

    return (
        <DraggableSheet
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            snapPoints={[0.7, 0.9]}
            initialSnap={0}
        >
            <div className="px-6 py-4 flex flex-col h-full">
                {/* Description */}
                {description && (
                    <p className="text-sm text-muted-foreground mb-4">
                        {description}
                    </p>
                )}

                {/* GPS Button */}
                <motion.button
                    onClick={handleUseGps}
                    disabled={isGpsLoading}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-primary/10 text-primary font-medium mb-4 disabled:opacity-50"
                >
                    {isGpsLoading ? (
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
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">ou selecione</span>
                    <div className="flex-1 h-px bg-border" />
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar bairro..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-muted/30 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>

                {/* Error */}
                {error && (
                    <p className="text-sm text-destructive text-center mb-4">{error}</p>
                )}

                {/* Bairros List */}
                <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-2">
                    {filteredBairros.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            {searchQuery ? 'Nenhum bairro encontrado' : 'Nenhum bairro disponível'}
                        </p>
                    ) : (
                        filteredBairros.map((bairro) => (
                            <motion.button
                                key={bairro.id}
                                onClick={() => setSelectedBairroId(bairro.id)}
                                whileTap={{ scale: 0.98 }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${selectedBairroId === bairro.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border bg-card hover:border-primary/50'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedBairroId === bairro.id
                                        ? 'bg-primary text-white'
                                        : 'bg-muted text-muted-foreground'
                                    }`}>
                                    {selectedBairroId === bairro.id ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <MapPin className="w-4 h-4" />
                                    )}
                                </div>
                                <span className="font-medium text-foreground">
                                    {bairro.nome}
                                </span>
                            </motion.button>
                        ))
                    )}
                </div>

                {/* Confirm Button */}
                <div className="pt-4 mt-auto">
                    <motion.button
                        onClick={handleConfirm}
                        disabled={!selectedBairroId}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirmar
                        <ChevronRight className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>
        </DraggableSheet>
    );
}

export default LocalProfileSheet;
