import { useEffect, useCallback } from 'react';
import { useTenantNavigate } from '@/hooks';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
    CheckCircle,
    FileCheck,
    Home,
    Share2,
    Copy,
    PartyPopper,
    Sparkles,
    List,
    Map,
    FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface ReportSuccessProps {
    protocolNumber: string;
    onClose: () => void;
}

export function ReportSuccess({ protocolNumber, onClose }: ReportSuccessProps) {
    const { toast } = useToast();
    const navigate = useTenantNavigate();

    // Fire confetti on mount
    const fireConfetti = useCallback(() => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        };

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            // Confetti from both sides
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'],
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'],
            });
        }, 250);

        // Also fire a big burst immediately
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'],
        });

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const cleanup = fireConfetti();
        return cleanup;
    }, [fireConfetti]);

    const handleCopyProtocol = async () => {
        try {
            await navigator.clipboard.writeText(protocolNumber);
            toast({
                title: "Protocolo copiado!",
                description: "Cole onde quiser para guardar.",
            });
        } catch {
            toast({
                title: "Erro ao copiar",
                description: "Tente copiar manualmente.",
                variant: "destructive",
            });
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Observação Enviada - eTijucas',
                    text: `Minha observação foi registrada com sucesso! Código: ${protocolNumber}`,
                });
            } catch (error) {
                console.log('Share cancelled');
            }
        } else {
            handleCopyProtocol();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-green-50 to-background dark:from-green-950/30 dark:to-background flex flex-col items-center justify-center p-6 overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: [0, 0.3, 0],
                            scale: [0, 1.5, 2],
                            x: Math.random() * 100 - 50,
                            y: Math.random() * 100 - 50,
                        }}
                        transition={{
                            duration: 3,
                            delay: i * 0.3,
                            repeat: Infinity,
                            repeatDelay: 2,
                        }}
                        className="absolute rounded-full bg-green-400/20"
                        style={{
                            width: 100 + i * 30,
                            height: 100 + i * 30,
                            left: `${20 + i * 10}%`,
                            top: `${15 + i * 12}%`,
                        }}
                    />
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-sm flex flex-col items-center text-center"
            >
                {/* Success Icon */}
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                        type: 'spring',
                        stiffness: 200,
                        damping: 15,
                        delay: 0.2
                    }}
                    className="relative mb-6"
                >
                    <div className="p-6 rounded-full bg-green-100 dark:bg-green-900/50 shadow-lg shadow-green-500/20">
                        <CheckCircle className="h-20 w-20 text-green-600 dark:text-green-400" />
                    </div>

                    {/* Sparkle decorations */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        className="absolute -top-2 -right-2"
                    >
                        <Sparkles className="h-8 w-8 text-yellow-500" />
                    </motion.div>
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        className="absolute -bottom-1 -left-3"
                    >
                        <PartyPopper className="h-7 w-7 text-pink-500" />
                    </motion.div>
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold text-green-700 dark:text-green-400 mb-2"
                >
                    Observação Enviada!
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-muted-foreground mb-6"
                >
                    Obrigado por ajudar a melhorar nossa cidade!
                </motion.p>

                {/* Protocol Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="w-full"
                >
                    <Card className="p-6 bg-white dark:bg-card border-green-200 dark:border-green-800 shadow-lg">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <FileCheck className="h-5 w-5 text-primary" />
                            <span className="text-sm text-muted-foreground font-medium">
                                Código de acompanhamento
                            </span>
                        </div>

                        <motion.p
                            className="text-2xl font-bold font-mono text-primary mb-4"
                            animate={{ scale: [1, 1.02, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            {protocolNumber}
                        </motion.p>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={handleCopyProtocol}
                            >
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={handleShare}
                            >
                                <Share2 className="h-4 w-4 mr-2" />
                                Compartilhar
                            </Button>
                        </div>
                    </Card>
                </motion.div>

                {/* Info text */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-xs text-muted-foreground mt-4 max-w-xs"
                >
                    Guarde este número para acompanhar o andamento da sua observação.
                    Sua observação está visível para a comunidade.
                </motion.p>

                {/* Action buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="w-full mt-8 space-y-3"
                >
                    <Button
                        size="lg"
                        className="w-full h-14 rounded-2xl text-base font-semibold bg-green-600 hover:bg-green-700"
                        onClick={onClose}
                    >
                        <Home className="h-5 w-5 mr-2" />
                        Início do App
                    </Button>

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            size="lg"
                            className="h-12 rounded-2xl text-sm"
                            onClick={() => navigate('/minhas-observacoes')}
                        >
                            <List className="h-4 w-4 mr-2" />
                            Minhas Observações
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="h-12 rounded-2xl text-sm"
                            onClick={() => navigate('/observacoes/mapa')}
                        >
                            <Map className="h-4 w-4 mr-2" />
                            Mapa
                        </Button>
                    </div>

                    <Button
                        variant="ghost"
                        size="lg"
                        className="w-full h-12 rounded-2xl text-base"
                        onClick={() => navigate('/observacoes')}
                    >
                        <FileText className="h-5 w-5 mr-2" />
                        Todas as Observações
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}
