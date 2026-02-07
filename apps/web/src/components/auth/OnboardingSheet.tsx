/**
 * OnboardingSheet Component
 *
 * Bottom sheet for completing user profile after WhatsApp OTP login.
 * Shows Nome (required) + Bairro (optional with GPS) + Termos de Uso (required).
 *
 * Features:
 * - Premium animated UI
 * - GPS integration for auto-selecting bairro
 * - Haptic feedback on completion
 * - Smooth transitions
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    MapPin,
    Navigation,
    Check,
    ChevronRight,
    Shield,
    Loader2,
} from 'lucide-react';
import { DraggableSheet } from '@/components/ui/DraggableSheet';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppName, useCityName } from '@/hooks/useCityName';
import type { Bairro } from '@/types/api.types';

interface OnboardingSheetProps {
    isOpen: boolean;
    onComplete: () => void;
    bairros: Bairro[];
}

type Step = 'name' | 'bairro' | 'terms';

export function OnboardingSheet({
    isOpen,
    onComplete,
    bairros,
}: OnboardingSheetProps) {
    const { updateUser } = useAuthStore();
    const appName = useAppName();
    const { name: cityName } = useCityName();

    const [currentStep, setCurrentStep] = useState<Step>('name');
    const [nome, setNome] = useState('');
    const [selectedBairroId, setSelectedBairroId] = useState<string | undefined>();
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGpsLoading, setIsGpsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Input validation
    const isNameValid = nome.trim().length >= 2;
    const canProceed =
        currentStep === 'name' ? isNameValid :
            currentStep === 'bairro' ? true : // Bairro is optional
                termsAccepted;

    /**
     * Handle GPS location for auto-selecting bairro
     */
    const handleUseGps = async () => {
        if (!navigator.geolocation) {
            setError('GPS não suportado neste dispositivo');
            return;
        }

        setIsGpsLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                // TODO: Reverse geocode to find nearest bairro
                // For now, just show the first bairro as a placeholder
                // In production, call a backend endpoint to determine bairro from coordinates
                console.log('GPS:', position.coords.latitude, position.coords.longitude);

                // Auto-select first bairro for demo
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
     * Submit profile
     */
    const handleSubmit = async () => {
        if (!isNameValid || !termsAccepted) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await authService.completeProfile({
                nome: nome.trim(),
                bairroId: selectedBairroId,
                termsAccepted: true,
            });

            // Update local state
            updateUser(response.user);

            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }

            onComplete();
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar perfil');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Navigate to next step
     */
    const handleNext = () => {
        if (currentStep === 'name' && isNameValid) {
            setCurrentStep('bairro');
        } else if (currentStep === 'bairro') {
            setCurrentStep('terms');
        } else if (currentStep === 'terms' && termsAccepted) {
            handleSubmit();
        }
    };

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setCurrentStep('name');
            setNome('');
            setSelectedBairroId(undefined);
            setTermsAccepted(false);
            setError(null);
        }
    }, [isOpen]);

    const stepVariants = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
    };

    return (
        <DraggableSheet
            isOpen={isOpen}
            onClose={() => { }} // Prevent closing during onboarding
            title={`Bem-vindo ao ${appName}!`}
            snapPoints={[0.6, 0.9]}
            initialSnap={0}
        >
            <div className="px-6 py-4">
                {/* Progress indicator */}
                <div className="flex gap-2 mb-6">
                    {(['name', 'bairro', 'terms'] as Step[]).map((step, index) => (
                        <div
                            key={step}
                            className={`h-1 flex-1 rounded-full transition-colors ${step === currentStep
                                ? 'bg-primary'
                                : index < ['name', 'bairro', 'terms'].indexOf(currentStep)
                                    ? 'bg-primary/50'
                                    : 'bg-muted'
                                }`}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* Step 1: Name */}
                    {currentStep === 'name' && (
                        <motion.div
                            key="name"
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-4"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold">Como podemos te chamar?</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Seu nome será exibido nas suas publicações
                                    </p>
                                </div>
                            </div>

                            <input
                                type="text"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Seu nome"
                                autoFocus
                                className="w-full px-4 py-3 rounded-xl border border-border bg-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-lg"
                            />

                            {nome.length > 0 && !isNameValid && (
                                <p className="text-sm text-destructive">
                                    Nome deve ter pelo menos 2 caracteres
                                </p>
                            )}
                        </motion.div>
                    )}

                    {/* Step 2: Bairro */}
                    {currentStep === 'bairro' && (
                        <motion.div
                            key="bairro"
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-4"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <MapPin className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold">Qual seu bairro em {cityName}? (opcional)</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Para mostrar notícias e eventos perto de você
                                    </p>
                                </div>
                            </div>

                            {/* GPS Button */}
                            <button
                                onClick={handleUseGps}
                                disabled={isGpsLoading}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all text-primary"
                            >
                                {isGpsLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Navigation className="w-5 h-5" />
                                )}
                                <span className="font-medium">Usar minha localização</span>
                            </button>

                            {/* Bairro list */}
                            <div className="max-h-48 overflow-y-auto space-y-1">
                                {bairros.map((bairro) => (
                                    <button
                                        key={bairro.id}
                                        onClick={() => setSelectedBairroId(bairro.id)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${selectedBairroId === bairro.id
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-muted'
                                            }`}
                                    >
                                        <span>{bairro.nome}</span>
                                        {selectedBairroId === bairro.id && (
                                            <Check className="w-5 h-5" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Terms */}
                    {currentStep === 'terms' && (
                        <motion.div
                            key="terms"
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-4"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold">Termos de Uso</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Quase pronto! Aceite os termos para continuar
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-muted/50 border border-border">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Ao usar o {appName}, você concorda em respeitar outros usuários,
                                    não publicar conteúdo ofensivo e usar o app de forma responsável.
                                    Seus dados são protegidos conforme nossa política de privacidade.
                                </p>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-border hover:border-primary/50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                                />
                                <span className="text-sm">
                                    Li e aceito os <span className="text-primary font-medium">Termos de Uso</span> e a{' '}
                                    <span className="text-primary font-medium">Política de Privacidade</span>
                                </span>
                            </label>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error message */}
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-destructive mt-4 text-center"
                    >
                        {error}
                    </motion.p>
                )}

                {/* Action button */}
                <motion.button
                    onClick={handleNext}
                    disabled={!canProceed || isLoading}
                    className={`w-full mt-6 py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${canProceed
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                    whileTap={canProceed ? { scale: 0.98 } : undefined}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Salvando...
                        </>
                    ) : currentStep === 'terms' ? (
                        <>
                            <Check className="w-5 h-5" />
                            Concluir
                        </>
                    ) : (
                        <>
                            Continuar
                            <ChevronRight className="w-5 h-5" />
                        </>
                    )}
                </motion.button>

                {/* Skip bairro */}
                {currentStep === 'bairro' && (
                    <button
                        onClick={() => setCurrentStep('terms')}
                        className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Pular por agora
                    </button>
                )}
            </div>
        </DraggableSheet>
    );
}

export default OnboardingSheet;
