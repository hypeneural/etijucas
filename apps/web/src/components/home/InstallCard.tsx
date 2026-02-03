// ======================================================
// InstallCard - Inline PWA Installation Component
// Compact card that appears in the HomeScreen content
// ======================================================

import { motion, AnimatePresence } from 'framer-motion';
import {
    Download,
    X,
    Share,
    SquarePlus,
    Smartphone,
    CheckCircle2,
    Sparkles,
} from 'lucide-react';
import { useInstallPrompt, DismissOption } from '@/hooks/useInstallPrompt';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

/**
 * Inline Install Card for HomeScreen
 * Shows as a compact card within the page content
 */
export function InstallCard() {
    const {
        shouldShowBanner,
        canInstallNative,
        isIOSSafari,
        promptInstall,
        dismiss,
        showIOSTutorial,
        hideIOSTutorial,
        isIOSTutorialVisible,
        isInstalled,
    } = useInstallPrompt();

    // Handle native install (Android)
    const handleInstall = async () => {
        const installed = await promptInstall();
        if (!installed) {
            dismiss('later_24h');
        }
    };

    // Handle dismiss
    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        dismiss('later_7d');
    };

    // Don't render if shouldn't show
    if (isInstalled || !shouldShowBanner) {
        return <IOSTutorialSheet isOpen={isIOSTutorialVisible} onClose={hideIOSTutorial} />;
    }

    return (
        <>
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary to-primary/80 p-4 shadow-lg"
                >
                    {/* Background decoration */}
                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
                    <div className="absolute -left-3 -bottom-3 w-16 h-16 rounded-full bg-white/5" />

                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute right-2 top-2 p-1.5 hover:bg-white/20 rounded-full transition-colors z-10"
                        aria-label="Fechar"
                    >
                        <X className="h-4 w-4 text-white/80" />
                    </button>

                    <div className="relative flex items-center gap-3">
                        {/* Icon */}
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shrink-0">
                            <Smartphone className="h-6 w-6 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-white text-base">Instalar app</h3>
                                <Sparkles className="h-4 w-4 text-yellow-300" />
                            </div>
                            <p className="text-sm text-white/80 mt-0.5">
                                Acesso rápido e funciona offline
                            </p>
                        </div>

                        {/* Action button */}
                        {isIOSSafari ? (
                            <Button
                                onClick={showIOSTutorial}
                                size="sm"
                                variant="secondary"
                                className="bg-white text-primary hover:bg-white/90 shrink-0 font-medium"
                            >
                                <Share className="h-4 w-4 mr-1.5" />
                                Como
                            </Button>
                        ) : canInstallNative ? (
                            <Button
                                onClick={handleInstall}
                                size="sm"
                                variant="secondary"
                                className="bg-white text-primary hover:bg-white/90 shrink-0 font-medium"
                            >
                                <Download className="h-4 w-4 mr-1.5" />
                                Instalar
                            </Button>
                        ) : null}
                    </div>
                </motion.div>
            </AnimatePresence>

            <IOSTutorialSheet isOpen={isIOSTutorialVisible} onClose={hideIOSTutorial} />
        </>
    );
}

/**
 * iOS Tutorial Sheet (Bottom Sheet instead of Dialog)
 */
function IOSTutorialSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const steps = [
        {
            icon: <Share className="h-6 w-6" />,
            title: 'Toque em Compartilhar',
            description: 'Na barra do Safari (quadrado com seta)',
        },
        {
            icon: <SquarePlus className="h-6 w-6" />,
            title: 'Adicionar à Tela de Início',
            description: 'Role e toque nessa opção',
        },
        {
            icon: <CheckCircle2 className="h-6 w-6" />,
            title: 'Confirme tocando em "Adicionar"',
            description: 'Pronto! O app aparecerá na tela inicial',
        },
    ];

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="bottom" className="rounded-t-3xl pb-8">
                <SheetHeader className="pb-4">
                    <SheetTitle className="flex items-center gap-2 justify-center">
                        <Smartphone className="h-5 w-5 text-primary" />
                        Instalar eTijucas
                    </SheetTitle>
                </SheetHeader>

                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                        Siga os passos abaixo para adicionar o app:
                    </p>

                    <div className="space-y-3">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl"
                            >
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0 font-semibold">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-primary">{step.icon}</span>
                                        <span className="font-medium text-sm">{step.title}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {step.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <Button onClick={onClose} className="w-full mt-4">
                        Entendi
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

export default InstallCard;
