import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WizardProgress } from '@/components/report/WizardProgress';
import { StepCategory } from '@/components/report/StepCategory';
import { StepLocation } from '@/components/report/StepLocation';
import { StepCamera } from '@/components/report/StepCamera';
import { StepReview } from '@/components/report/StepReview';
import { ReportSuccess } from '@/components/report/ReportSuccess';
import { LoginRequired } from '@/components/auth/LoginRequired';
import { useCreateReport } from '@/hooks/useMyReports';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import {
    type ReportDraft,
    type WizardStep,
    type CreateReportPayload,
    initialReportDraft,
    generateIdempotencyKey,
    REPORT_DRAFT_KEY
} from '@/types/report';

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

    const [draft, setDraft] = useState<ReportDraft>(() => ({
        ...initialReportDraft,
        idempotencyKey: generateIdempotencyKey(),
    }));
    const [direction, setDirection] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [protocolNumber, setProtocolNumber] = useState<string | null>(null);

    const { createReport, isCreating, error: createError } = useCreateReport();

    // Load draft from localStorage on mount
    useEffect(() => {
        try {
            const savedDraft = localStorage.getItem(REPORT_DRAFT_KEY);
            if (savedDraft) {
                const parsed = JSON.parse(savedDraft);
                setDraft({
                    ...parsed,
                    createdAt: new Date(parsed.createdAt),
                    updatedAt: new Date(parsed.updatedAt),
                    images: [],
                    // Keep existing idempotency key or generate new
                    idempotencyKey: parsed.idempotencyKey || generateIdempotencyKey(),
                });
            }
        } catch (error) {
            console.error('Error loading draft:', error);
        }
    }, []);

    const saveDraft = useCallback((newDraft: ReportDraft) => {
        try {
            const draftToSave = {
                ...newDraft,
                images: [],
                updatedAt: new Date(),
            };
            localStorage.setItem(REPORT_DRAFT_KEY, JSON.stringify(draftToSave));
        } catch (error) {
            console.error('Error saving draft:', error);
        }
    }, []);

    const updateDraft = useCallback((updates: Partial<ReportDraft>) => {
        setDraft(prev => {
            const newDraft = { ...prev, ...updates, updatedAt: new Date() };
            saveDraft(newDraft);
            return newDraft;
        });
    }, [saveDraft]);

    const goToStep = useCallback((step: WizardStep) => {
        setDirection(step > draft.currentStep ? 1 : -1);
        updateDraft({ currentStep: step });
    }, [draft.currentStep, updateDraft]);

    const nextStep = useCallback(() => {
        if (draft.currentStep < 4) {
            setDirection(1);
            updateDraft({ currentStep: (draft.currentStep + 1) as WizardStep });
        }
    }, [draft.currentStep, updateDraft]);

    const prevStep = useCallback(() => {
        if (draft.currentStep > 1) {
            setDirection(-1);
            updateDraft({ currentStep: (draft.currentStep - 1) as WizardStep });
        }
    }, [draft.currentStep, updateDraft]);

    const clearDraft = useCallback(() => {
        draft.images.forEach(img => URL.revokeObjectURL(img.previewUrl));
        localStorage.removeItem(REPORT_DRAFT_KEY);
        setDraft({
            ...initialReportDraft,
            idempotencyKey: generateIdempotencyKey(),
        });
    }, [draft.images]);

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
                        className="h-full overflow-y-auto px-4 pt-4"
                    >
                        {draft.currentStep === 1 && (
                            <StepCategory
                                draft={draft}
                                onUpdate={updateDraft}
                                onNext={nextStep}
                            />
                        )}
                        {draft.currentStep === 2 && (
                            <StepLocation
                                draft={draft}
                                onUpdate={updateDraft}
                                onNext={nextStep}
                                onBack={prevStep}
                            />
                        )}
                        {draft.currentStep === 3 && (
                            <StepCamera
                                draft={draft}
                                onUpdate={updateDraft}
                                onNext={nextStep}
                                onBack={prevStep}
                            />
                        )}
                        {draft.currentStep === 4 && (
                            <StepReview
                                draft={draft}
                                onUpdate={updateDraft}
                                onBack={prevStep}
                                onGoToStep={goToStep}
                                onSubmit={handleSubmit}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
