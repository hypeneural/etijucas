// ======================================================
// InstallBanner - Smart PWA Installation Component
// Android native prompt, iOS tutorial, dismiss options
// ======================================================

import { motion, AnimatePresence } from 'framer-motion';
import {
    Download,
    X,
    Share,
    SquarePlus,
    Smartphone,
    CheckCircle2,
    Clock,
    XCircle,
    MoreVertical
} from 'lucide-react';
import { useInstallPrompt, DismissOption } from '@/hooks/useInstallPrompt';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface InstallBannerProps {
    variant?: 'banner' | 'card';
}

/**
 * Smart Install Banner Component
 * - Android: native install prompt with 1-click
 * - iOS: tutorial modal with steps
 * - Smart timing: shows after 30s
 * - Persist dismissals: 24h, 7d, or forever
 */
export function InstallBanner({ variant = 'banner' }: InstallBannerProps) {
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
            // User declined, dismiss for 24h
            dismiss('later_24h');
        }
    };

    // Handle dismiss options
    const handleDismiss = (option: DismissOption) => {
        dismiss(option);
    };

    // Don't render if shouldn't show
    if (isInstalled || !shouldShowBanner) {
        return <IOSTutorialModal isOpen={isIOSTutorialVisible} onClose={hideIOSTutorial} />;
    }

    // Card variant (for home page or promotional sections)
    if (variant === 'card') {
        return (
            <>
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden"
                    >
                        {/* Background decoration */}
                        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
                        <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/5" />

                        <div className="relative flex items-start gap-3">
                            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Smartphone className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg">Instalar eTijucas</h3>
                                <p className="text-sm text-white/80 mt-0.5">
                                    Acesso mais rápido e funciona offline
                                </p>

                                <div className="flex flex-wrap gap-2 mt-3">
                                    {isIOSSafari ? (
                                        <Button
                                            onClick={showIOSTutorial}
                                            variant="secondary"
                                            className="bg-white text-primary hover:bg-white/90"
                                        >
                                            <Share className="h-4 w-4 mr-2" />
                                            Como instalar
                                        </Button>
                                    ) : canInstallNative ? (
                                        <Button
                                            onClick={handleInstall}
                                            variant="secondary"
                                            className="bg-white text-primary hover:bg-white/90"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Instalar Agora
                                        </Button>
                                    ) : null}

                                    <Button
                                        onClick={() => handleDismiss('later_7d')}
                                        variant="ghost"
                                        className="text-white/80 hover:text-white hover:bg-white/20"
                                    >
                                        Lembrar depois
                                    </Button>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDismiss('later_24h')}
                                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                                aria-label="Fechar"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>

                <IOSTutorialModal isOpen={isIOSTutorialVisible} onClose={hideIOSTutorial} />
            </>
        );
    }

    // Banner variant (top banner, less intrusive)
    return (
        <>
            <AnimatePresence>
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed top-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[420px] px-3 pt-safe-top"
                >
                    <div className="mt-2 bg-card border border-border rounded-2xl p-3 shadow-elevated">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl shrink-0">
                                <Download className="h-5 w-5 text-primary" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm text-foreground">Instalar eTijucas</h3>
                                <p className="text-xs text-muted-foreground truncate">
                                    {isIOSSafari
                                        ? 'Adicione à tela inicial'
                                        : 'Acesso rápido e offline'}
                                </p>
                            </div>

                            {isIOSSafari ? (
                                <Button
                                    onClick={showIOSTutorial}
                                    size="sm"
                                    className="shrink-0"
                                >
                                    Ver como
                                </Button>
                            ) : canInstallNative ? (
                                <Button
                                    onClick={handleInstall}
                                    size="sm"
                                    className="shrink-0"
                                >
                                    Instalar
                                </Button>
                            ) : null}

                            <DismissDropdown onDismiss={handleDismiss} />
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            <IOSTutorialModal isOpen={isIOSTutorialVisible} onClose={hideIOSTutorial} />
        </>
    );
}

/**
 * Dismiss options dropdown
 */
function DismissDropdown({ onDismiss }: { onDismiss: (option: DismissOption) => void }) {
    return (
        <div className="relative group">
            <button
                onClick={() => onDismiss('later_24h')}
                className="p-1.5 hover:bg-muted rounded-full transition-colors shrink-0"
                aria-label="Fechar"
            >
                <X className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Tooltip on hover */}
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50">
                <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-popover border border-border rounded-xl p-2 shadow-lg min-w-[160px]"
                >
                    <button
                        onClick={() => onDismiss('later_24h')}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                    >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        Lembrar em 24h
                    </button>
                    <button
                        onClick={() => onDismiss('later_7d')}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                    >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        Lembrar em 7 dias
                    </button>
                    <button
                        onClick={() => onDismiss('never')}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                    >
                        <XCircle className="h-4 w-4" />
                        Não mostrar mais
                    </button>
                </motion.div>
            </div>
        </div>
    );
}

/**
 * iOS Tutorial Modal
 */
function IOSTutorialModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-[360px] max-h-[85vh] overflow-y-auto rounded-2xl p-5">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-primary" />
                        Instalar eTijucas no iPhone
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <p className="text-sm text-muted-foreground">
                        Siga os passos abaixo para adicionar o app à sua tela inicial:
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
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0">
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
                </div>

                <div className="flex gap-2">
                    <Button onClick={onClose} className="flex-1">
                        Entendi
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Install Menu Item - For "Mais" screen
 */
export function InstallMenuItem() {
    const {
        isInstalled,
        canInstallNative,
        isIOSSafari,
        promptInstall,
        showIOSTutorial,
        isIOSTutorialVisible,
        hideIOSTutorial,
    } = useInstallPrompt();

    // Don't show if already installed
    if (isInstalled) return null;

    const handleClick = async () => {
        console.log('[InstallMenuItem] Click - canInstallNative:', canInstallNative, 'isIOSSafari:', isIOSSafari);

        if (canInstallNative) {
            const result = await promptInstall();
            console.log('[InstallMenuItem] promptInstall result:', result);
        } else if (isIOSSafari) {
            showIOSTutorial();
        } else {
            // Fallback: show desktop tutorial
            showIOSTutorial();
        }
    };

    // Debug logging
    console.log('[InstallMenuItem] State:', {
        isInstalled,
        canInstallNative,
        isIOSSafari,
    });

    return (
        <>
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleClick}
                className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 hover:border-primary/40 transition-colors"
            >
                <div className="p-2 rounded-lg bg-primary/10">
                    <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">Instalar app</p>
                    <p className="text-xs text-muted-foreground">
                        {isIOSSafari
                            ? 'Adicionar à tela inicial'
                            : canInstallNative
                                ? 'Acesso rápido e offline'
                                : 'Instalar no navegador'}
                    </p>
                </div>
                <Download className="h-5 w-5 text-primary" />
            </motion.button>

            <IOSTutorialModal isOpen={isIOSTutorialVisible} onClose={hideIOSTutorial} />
            <ChromeDesktopTutorialModal
                isOpen={!canInstallNative && !isIOSSafari && isIOSTutorialVisible}
                onClose={hideIOSTutorial}
            />
        </>
    );
}

/**
 * Chrome Desktop Tutorial Modal
 */
function ChromeDesktopTutorialModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const steps = [
        {
            icon: <MoreVertical className="h-6 w-6" />,
            title: 'Clique no menu (⋮)',
            description: 'No canto superior direito do Chrome',
        },
        {
            icon: <Download className="h-6 w-6" />,
            title: '"Instalar eTijucas..."',
            description: 'Procure essa opção no menu',
        },
        {
            icon: <CheckCircle2 className="h-6 w-6" />,
            title: 'Confirme a instalação',
            description: 'Clique em "Instalar" na janela que aparecer',
        },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-[360px] max-h-[85vh] overflow-y-auto rounded-2xl p-5">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-primary" />
                        Instalar eTijucas
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <p className="text-sm text-muted-foreground">
                        Siga os passos abaixo para instalar o app no Chrome:
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
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0">
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
                </div>

                <div className="flex gap-2">
                    <Button onClick={onClose} className="flex-1">
                        Entendi
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

