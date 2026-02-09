/**
 * ProfileUpgradeSheet
 *
 * Bottom sheet for step-up profile enrollment.
 * Appears when user tries to access a feature requiring higher profile level.
 * Explains why the info is needed and collects only what's required.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    MapPin,
    Bell,
    Check,
    ChevronRight,
    Loader2,
    Shield,
    Navigation,
    Search,
} from 'lucide-react';
import { DraggableSheet } from '@/components/ui/DraggableSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useCityName } from '@/hooks/useCityName';
import type { ProfileLevel } from '@/hooks/useProfileLevel';
import type { Bairro } from '@/types/api.types';
import { cn } from '@/lib/utils';

interface ProfileUpgradeSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    requiredLevel: ProfileLevel;
    /** Action user was trying to perform (for explanation) */
    actionDescription: string;
    /** Available bairros for selection (level 2) */
    bairros?: Bairro[];
}

/**
 * Level configuration for UI
 */
const LEVEL_CONFIG: Record<ProfileLevel, {
    icon: React.ElementType;
    title: string;
    description: string;
    color: string;
}> = {
    0: {
        icon: User,
        title: 'Visitante',
        description: 'Navegue pelo app',
        color: 'gray',
    },
    1: {
        icon: User,
        title: 'Complete seu perfil',
        description: 'Precisamos saber seu nome',
        color: 'blue',
    },
    2: {
        icon: MapPin,
        title: 'Selecione seu bairro',
        description: 'Para personalizar sua experiência',
        color: 'green',
    },
    3: {
        icon: Bell,
        title: 'Ative as notificações',
        description: 'Para não perder nada importante',
        color: 'purple',
    },
};

export function ProfileUpgradeSheet({
    isOpen,
    onClose,
    onComplete,
    requiredLevel,
    actionDescription,
    bairros = [],
}: ProfileUpgradeSheetProps) {
    const { updateUser } = useAuthStore();
    const { name: cityName } = useCityName();

    // Form state
    const [nome, setNome] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [selectedBairroId, setSelectedBairroId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [isGpsLoading, setIsGpsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const config = LEVEL_CONFIG[requiredLevel] || LEVEL_CONFIG[1];
    const IconComponent = config.icon;

    // Validation
    const isNameValid = nome.trim().length >= 2;

    // Filter bairros by search
    const filteredBairros = bairros.filter(b =>
        b.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );

    /**
     * Handle GPS for bairro auto-detection
     */
    const handleUseGps = async () => {
        if (!navigator.geolocation) {
            setError('GPS não suportado');
            return;
        }

        setIsGpsLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                console.log('GPS:', position.coords);
                // TODO: Call backend to find nearest bairro
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
    };

    /**
     * Submit level 1 (name + terms)
     */
    const handleSubmitLevel1 = async () => {
        if (!isNameValid || !termsAccepted) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await authService.completeProfile({
                nome: nome.trim(),
                termsAccepted: true,
            });

            // Explicitly set profileCompleted to prevent re-showing onboarding
            updateUser({ ...response.user, profileCompleted: true });

            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }

            onComplete();
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Submit level 2 (bairro)
     */
    const handleSubmitLevel2 = async () => {
        if (!selectedBairroId) return;

        setIsLoading(true);
        setError(null);

        try {
            // TODO: Call API to update bairro
            // For now, simulate success
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }

            onComplete();
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Submit level 3 (push notifications)
     */
    const handleSubmitLevel3 = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Request push permission
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    setError('Permissão de notificação negada');
                    setIsLoading(false);
                    return;
                }
            }

            // TODO: Register push subscription with backend

            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }

            onComplete();
        } catch (err: any) {
            setError(err.message || 'Erro ao ativar');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = () => {
        switch (requiredLevel) {
            case 1:
                handleSubmitLevel1();
                break;
            case 2:
                handleSubmitLevel2();
                break;
            case 3:
                handleSubmitLevel3();
                break;
            default:
                onClose();
        }
    };

    const canSubmit = () => {
        switch (requiredLevel) {
            case 1:
                return isNameValid && termsAccepted;
            case 2:
                return !!selectedBairroId;
            case 3:
                return true;
            default:
                return false;
        }
    };

    return (
        <DraggableSheet
            isOpen={isOpen}
            onClose={onClose}
            title=""
            snapPoints={requiredLevel === 2 ? [0.75, 0.9] : [0.55, 0.75]}
            initialSnap={0}
        >
            <div className="px-6 py-4 flex flex-col h-full">
                {/* Header */}
                <div className="text-center mb-6">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className={cn(
                            'inline-flex p-4 rounded-2xl mb-4',
                            config.color === 'blue' && 'bg-blue-500/10',
                            config.color === 'green' && 'bg-green-500/10',
                            config.color === 'purple' && 'bg-purple-500/10'
                        )}
                    >
                        <IconComponent className={cn(
                            'h-8 w-8',
                            config.color === 'blue' && 'text-blue-600',
                            config.color === 'green' && 'text-green-600',
                            config.color === 'purple' && 'text-purple-600'
                        )} />
                    </motion.div>

                    <h2 className="text-xl font-bold">{config.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Para {actionDescription.toLowerCase()}
                    </p>
                </div>

                {/* Level 1: Name + Terms */}
                {requiredLevel === 1 && (
                    <div className="space-y-4 flex-1">
                        <div>
                            <Input
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Seu nome"
                                className="h-12 text-base rounded-xl"
                                autoFocus
                            />
                        </div>

                        <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/30 cursor-pointer">
                            <Checkbox
                                checked={termsAccepted}
                                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                                className="mt-0.5"
                            />
                            <span className="text-sm text-foreground">
                                Li e aceito os termos de uso
                            </span>
                        </label>
                    </div>
                )}

                {/* Level 2: Bairro Selection */}
                {requiredLevel === 2 && (
                    <div className="space-y-4 flex-1 flex flex-col">
                        {/* GPS Button */}
                        <motion.button
                            onClick={handleUseGps}
                            disabled={isGpsLoading}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 text-green-600 font-medium disabled:opacity-50"
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
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-xs text-muted-foreground">ou selecione</span>
                            <div className="flex-1 h-px bg-border" />
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar bairro..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm"
                            />
                        </div>

                        {/* Bairros List */}
                        <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-2">
                            {filteredBairros.map((bairro) => (
                                <motion.button
                                    key={bairro.id}
                                    onClick={() => setSelectedBairroId(bairro.id)}
                                    whileTap={{ scale: 0.98 }}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
                                        selectedBairroId === bairro.id
                                            ? 'border-green-500 bg-green-500/5'
                                            : 'border-border bg-card'
                                    )}
                                >
                                    <div className={cn(
                                        'w-8 h-8 rounded-lg flex items-center justify-center',
                                        selectedBairroId === bairro.id
                                            ? 'bg-green-500 text-white'
                                            : 'bg-muted text-muted-foreground'
                                    )}>
                                        {selectedBairroId === bairro.id ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            <MapPin className="w-4 h-4" />
                                        )}
                                    </div>
                                    <span className="font-medium">{bairro.nome}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Level 3: Push Notifications */}
                {requiredLevel === 3 && (
                    <div className="space-y-4 flex-1">
                        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                            <div className="flex items-start gap-3">
                                <Bell className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-foreground">
                                        Receba alertas importantes
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Eventos, notícias da cidade, e atualizações do seu bairro.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Shield className="w-4 h-4" />
                            <span>Você pode desativar a qualquer momento</span>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 mt-4">
                        <p className="text-sm text-red-600 dark:text-red-400 text-center">
                            {error}
                        </p>
                    </div>
                )}

                {/* Submit Button */}
                <div className="pt-4 mt-auto">
                    <Button
                        onClick={handleSubmit}
                        disabled={!canSubmit() || isLoading}
                        className="w-full h-12 text-base font-semibold rounded-xl"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Check className="h-5 w-5 mr-2" />
                                {requiredLevel === 3 ? 'Ativar Notificações' : 'Continuar'}
                            </>
                        )}
                    </Button>

                    <button
                        onClick={onClose}
                        className="w-full mt-2 py-2 text-sm text-muted-foreground hover:text-foreground text-center"
                    >
                        Agora não
                    </button>
                </div>
            </div>
        </DraggableSheet>
    );
}

export default ProfileUpgradeSheet;
