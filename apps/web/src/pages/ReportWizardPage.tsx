import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WizardProgress } from '@/components/report/WizardProgress';
import { StepCategory } from '@/components/report/StepCategory';
import { StepLocation } from '@/components/report/StepLocation';
import { StepCamera } from '@/components/report/StepCamera';
import { StepReview } from '@/components/report/StepReview';
import { ReportSuccess } from '@/components/report/ReportSuccess';
import { LoginRequired } from '@/components/auth/LoginRequired';
import { useCreateReport } from '@/hooks/useMyReports';
import { useReportDraft } from '@/hooks/useReportDraft';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import type { CreateReportPayload } from '@/types/report';

const STEP_LABELS = [
    'Categoria',
    'Localização',
    'Fotos',
    'Revisão'
];

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? '100%' : '-100%',
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction < 0 ? '100%' : '-100%',
        opacity: 0,
    }),
};

export default function ReportWizardPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();

    // Auth gate - require login to create reports
    if (!isAuthenticated) {
        return (
            <LoginRequired
                title="Cadastre-se ou entre"
                message="Para enviar uma denúncia, você precisa estar cadastrado no aplicativo."
                returnUrl="/denuncia/nova"
            />
        );
    }

    // Draft management via IndexedDB hook
    const {
        draft,
        isLoading: isDraftLoading,
        updateDraft,
        nextStep,
        prevStep,
        clearDraft,
    } = useReportDraft();

    const [direction, setDirection] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [protocolNumber, setProtocolNumber] = useState<string | null>(null);

    const { createReport, isCreating, error: createError } = useCreateReport();

    // Wrapper for step navigation with direction tracking
    const goToStep = useCallback((step: 1 | 2 | 3 | 4) => {
        setDirection(step > draft.currentStep ? 1 : -1);
        updateDraft({ currentStep: step });
    }, [draft.currentStep, updateDraft]);

    const handleNextStep = useCallback(() => {
        setDirection(1);
        nextStep();
    }, [nextStep]);

    const handlePrevStep = useCallback(() => {
        setDirection(-1);
        prevStep();
    }, [prevStep]);

    const handleSubmit = useCallback(async () => {
        // Validate required fields
        if (!draft.categoryId) {
            toast.error('Selecione uma categoria para a denúncia');
            return;
        }
        if (!draft.title || draft.title.trim().length < 5) {
            toast.error('O título deve ter pelo menos 5 caracteres');
            return;
        }
        if (!draft.description || draft.description.trim().length < 10) {
            toast.error('A descrição deve ter pelo menos 10 caracteres');
            return;
        }

        try {
            // Build payload
            const payload: CreateReportPayload = {
                categoryId: draft.categoryId,
                title: draft.title.trim(),
                description: draft.description.trim(),
                images: draft.images.map(img => img.file),
            };

            // Add location data if available
            if (draft.location) {
                payload.addressText = draft.location.address;
                payload.addressSource = draft.location.source;
                payload.locationQuality = draft.location.quality;
                payload.latitude = draft.location.latitude;
                payload.longitude = draft.location.longitude;
                // Cap accuracy at 10000 (backend max)
                payload.locationAccuracyM = draft.location.accuracy
                    ? Math.min(Math.round(draft.location.accuracy), 10000)
                    : undefined;
            }

            // Submit to API
            const result = await createReport({
                payload,
                idempotencyKey: draft.idempotencyKey,
            });

            // Set protocol and show success
            setProtocolNumber(result.protocol);
            setShowSuccess(true);

            // Clear draft after successful submit
            clearDraft();

            toast.success('Denúncia enviada com sucesso!');
        } catch (error) {
            console.error('Error submitting report:', error);
            toast.error('Erro ao enviar denúncia. Tente novamente.');
        }
    }, [draft, createReport, clearDraft]);

    const handleClose = () => {
        if (draft.categoryId || draft.location || draft.images.length > 0) {
            if (window.confirm('Tem certeza que deseja sair? Seu rascunho será salvo.')) {
                navigate(-1);
            }
        } else {
            navigate(-1);
        }
    };

    const handleSuccessClose = () => {
        navigate('/');
    };

    // Show loading while draft is being loaded from IndexedDB
    if (isDraftLoading) {
        return (
            <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Show success page
    if (showSuccess && protocolNumber) {
        return <ReportSuccess protocolNumber={protocolNumber} onClose={handleSuccessClose} />;
    }

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
            {/* Header */}
            <header className="shrink-0 bg-background/95 backdrop-blur-lg border-b safe-top">
                <div className="flex items-center justify-between px-4 py-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        className="rounded-full"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="font-semibold text-lg">Enviar Denúncia</h1>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        className="rounded-full"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Progress */}
                <div className="px-4 pb-4">
                    <WizardProgress
                        currentStep={draft.currentStep}
                        totalSteps={4}
                        labels={STEP_LABELS}
                    />
                </div>
            </header>

            {/* Content - scrollable area */}
            <main className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={draft.currentStep}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: 'spring', stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 },
                        }}
                        className="h-full overflow-y-auto px-4 pt-4 pb-32"
                    >
                        {draft.currentStep === 1 && (
                            <StepCategory
                                draft={draft}
                                onUpdate={updateDraft}
                                onNext={handleNextStep}
                            />
                        )}
                        {draft.currentStep === 2 && (
                            <StepLocation
                                draft={draft}
                                onUpdate={updateDraft}
                                onNext={handleNextStep}
                                onBack={handlePrevStep}
                            />
                        )}
                        {draft.currentStep === 3 && (
                            <StepCamera
                                draft={draft}
                                onUpdate={updateDraft}
                                onNext={handleNextStep}
                                onBack={handlePrevStep}
                            />
                        )}
                        {draft.currentStep === 4 && (
                            <StepReview
                                draft={draft}
                                onUpdate={updateDraft}
                                onBack={handlePrevStep}
                                onGoToStep={goToStep}
                                onSubmit={handleSubmit}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Bottom Tab Bar (Fixed) */}
            <div className="fixed bottom-0 left-0 right-0 z-[60]">
                <BottomTabBar
                    activeTab="reportar"
                    onTabChange={(tab: string) => navigate(`/?tab=${tab}`)}
                />
            </div>
        </div >
    );
}
