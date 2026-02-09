/**
 * MetaShareCard - Community Goal Share Card
 * 
 * Shareable card showing the community's progress towards the next
 * milestone with a CTA to invite friends.
 * 
 * Features:
 * - Visual progress ring/bar
 * - Milestone celebration
 * - "Convide 1 amigo" CTA
 * - html2canvas for image generation
 */

import React, { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Share2, Download, Users, Target, Sparkles, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/hooks/useHaptics';
import { useToast } from '@/hooks/use-toast';

interface MetaShareCardProps {
    total: number;
    goal: number;
    goalName?: string;
    verified?: number;
    newToday?: number;
    className?: string;
}

// Tier names based on goal
function getTierName(goal: number): string {
    if (goal <= 100) return 'Início';
    if (goal <= 500) return 'Crescendo';
    if (goal <= 1000) return 'Comunidade';
    if (goal <= 2500) return 'Movimento';
    if (goal <= 5000) return 'Força';
    if (goal <= 10000) return 'Revolução';
    return 'Cidade Conectada';
}

// Tier colors
function getTierColor(goal: number): string {
    if (goal <= 100) return 'from-blue-500 to-cyan-500';
    if (goal <= 500) return 'from-green-500 to-emerald-500';
    if (goal <= 1000) return 'from-yellow-500 to-amber-500';
    if (goal <= 2500) return 'from-orange-500 to-red-500';
    if (goal <= 5000) return 'from-purple-500 to-pink-500';
    return 'from-primary to-primary/80';
}

export function MetaShareCard({
    total,
    goal,
    goalName,
    verified = 0,
    newToday = 0,
    className,
}: MetaShareCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    const progress = Math.min((total / goal) * 100, 100);
    const remaining = Math.max(goal - total, 0);
    const tierName = goalName || getTierName(goal);
    const tierColor = getTierColor(goal);

    const handleShare = useCallback(async () => {
        hapticFeedback('medium');

        if (!cardRef.current) return;

        setIsGenerating(true);

        try {
            const html2canvas = (await import('html2canvas')).default;

            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
            });

            const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((b) => resolve(b!), 'image/png', 0.9);
            });

            if (navigator.share && navigator.canShare) {
                const file = new File([blob], 'meta-cidadaos.png', { type: 'image/png' });
                const shareData = {
                    title: 'Meta Cidadãos',
                    text: `🎯 Somos ${total.toLocaleString('pt-BR')} cidadãos! Faltam ${remaining} para a meta de ${goal.toLocaleString('pt-BR')}.\n\nJunte-se a nós em observada.com.br`,
                    files: [file],
                };

                if (navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                    hapticFeedback('success');
                    return;
                }
            }

            // Fallback: download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'meta-cidadaos.png';
            a.click();
            URL.revokeObjectURL(url);

            toast({
                title: 'Imagem salva!',
                description: 'Compartilhe e convide amigos 🎯',
            });
            hapticFeedback('success');
        } catch (error) {
            console.error('Share error:', error);
            toast({
                title: 'Erro ao gerar',
                description: 'Tente novamente',
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(false);
        }
    }, [total, goal, remaining, toast]);

    const handleInvite = useCallback(() => {
        hapticFeedback('medium');

        const inviteText = `🏙️ Junte-se a ${total.toLocaleString('pt-BR')} cidadãos no Observada!\n\nA cidade na palma da mão: eventos, denúncias, fórum e muito mais.\n\nobservada.com.br`;

        if (navigator.share) {
            navigator.share({
                title: 'eTijucas - Convite',
                text: inviteText,
                url: 'https://observada.com.br',
            });
        } else {
            navigator.clipboard.writeText(inviteText + '\nhttps://observada.com.br');
            toast({
                title: 'Link copiado!',
                description: 'Cole e envie para seus amigos',
            });
        }
    }, [total, toast]);

    return (
        <div className={cn('px-4', className)}>
            {/* Shareable Card */}
            <motion.div
                ref={cardRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                    'relative overflow-hidden rounded-2xl p-4 text-white shadow-lg',
                    'bg-gradient-to-br',
                    tierColor
                )}
            >
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <svg width="100%" height="100%">
                        <pattern id="metaPattern" width="30" height="30" patternUnits="userSpaceOnUse">
                            <circle cx="15" cy="15" r="1" fill="white" />
                        </pattern>
                        <rect width="100%" height="100%" fill="url(#metaPattern)" />
                    </svg>
                </div>

                {/* Header */}
                <div className="relative flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        <h3 className="text-lg font-bold">Meta Cidadãos</h3>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium">
                        <Sparkles className="h-3 w-3" />
                        {tierName}
                    </div>
                </div>

                {/* Progress Display */}
                <div className="relative mb-4">
                    <div className="flex items-end justify-between mb-2">
                        <motion.span
                            className="text-4xl font-bold"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {total.toLocaleString('pt-BR')}
                        </motion.span>
                        <span className="text-lg text-white/70">
                            / {goal.toLocaleString('pt-BR')}
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-3 w-full rounded-full bg-white/20 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full rounded-full bg-white"
                        />
                    </div>

                    {/* Stats row */}
                    <div className="flex justify-between mt-2 text-xs text-white/80">
                        <span>✅ {verified} verificados</span>
                        <span>📈 +{newToday} hoje</span>
                        <span>🎯 Faltam {remaining}</span>
                    </div>
                </div>

                {/* CTA */}
                <div className="relative text-center text-sm text-white/90">
                    <p>Convide 1 amigo e ajude a bater a meta!</p>
                </div>

                {/* Footer */}
                <div className="relative flex items-center justify-center gap-1 mt-2 text-[10px] text-white/50">
                    <Users className="h-3 w-3" />
                    observada.com.br
                </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-3">
                <motion.button
                    onClick={handleInvite}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm bg-primary text-primary-foreground min-h-[44px]"
                >
                    <UserPlus className="h-4 w-4" />
                    Convidar amigo
                </motion.button>

                <motion.button
                    onClick={handleShare}
                    disabled={isGenerating}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                        'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm',
                        'bg-muted text-foreground hover:bg-muted/80 min-h-[44px]',
                        isGenerating && 'opacity-50 cursor-wait'
                    )}
                >
                    {isGenerating ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        >
                            <Download className="h-4 w-4" />
                        </motion.div>
                    ) : (
                        <Share2 className="h-4 w-4" />
                    )}
                </motion.button>
            </div>
        </div>
    );
}

export default MetaShareCard;
