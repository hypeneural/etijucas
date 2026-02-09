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
    cityName: string;
    uf: string;
    citySlug: string;
    className?: string;
}

// Tier names based on goal
function getTierName(goal: number): string {
    if (goal <= 100) return 'Primeiros Observadores';
    if (goal <= 500) return 'Cidade Acordando';
    if (goal <= 1000) return 'Comunidade Ativa';
    if (goal <= 2500) return 'Movimento Local';
    if (goal <= 5000) return 'Força da Cidade';
    if (goal <= 10000) return 'Cidade em Ação';
    if (goal <= 20000) return 'Cidade Conectada';
    return 'Expansão';
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
    cityName,
    uf,
    citySlug,
    className,
}: MetaShareCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    const progress = Math.min((total / goal) * 100, 100);
    const remaining = Math.max(goal - total, 0);
    const tierName = goalName || getTierName(goal);
    const tierColor = getTierColor(goal);

    const shareUrl = `https://observada.com.br/${uf.toLowerCase()}/${citySlug}`;

    const handleShare = useCallback(async () => {
        hapticFeedback('medium');

        if (!cardRef.current) return;

        setIsGenerating(true);

        try {
            const html2canvas = (await import('html2canvas')).default;

            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: null,
                scale: 1.5, // Optimized for size
                useCORS: true,
            });

            const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85); // JPG 0.85 quality
            });

            const fileName = `meta-observadores-${citySlug}.jpg`;

            if (navigator.share && navigator.canShare) {
                const file = new File([blob], fileName, { type: 'image/jpeg' });
                const shareData = {
                    title: `Meta de Observadores — ${cityName}/${uf}`,
                    text: `🎯 Meta de Observadores — ${cityName}/${uf}\n\nJá somos ${total.toLocaleString('pt-BR')} Observadores.\nFaltam ${remaining.toLocaleString('pt-BR')} para chegar em ${goal.toLocaleString('pt-BR')}.\n\nVem fortalecer a cidade 👇\n${shareUrl}`,
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
            a.download = fileName;
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
    }, [total, goal, remaining, toast, citySlug, cityName, uf, shareUrl]);

    const handleInvite = useCallback(() => {
        hapticFeedback('medium');

        const inviteText = `👁️ Estou no Observada como Observador de ${cityName}/${uf}.\n\nAjude a cidade a crescer: entra por aqui 👇\n${shareUrl}`;

        if (navigator.share) {
            navigator.share({
                title: `Observada — ${cityName}/${uf}`,
                text: inviteText,
                url: shareUrl,
            });
        } else {
            navigator.clipboard.writeText(inviteText);
            toast({
                title: 'Link copiado!',
                description: 'Cole e envie para seus amigos',
            });
        }
    }, [total, toast, cityName, uf, shareUrl]);

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
                        <h3 className="text-lg font-bold">Meta de Observadores</h3>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium">
                        <Sparkles className="h-3 w-3" />
                        Fase: {tierName}
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
                    <div className="flex justify-between items-center mt-2 text-xs text-white/80">
                        <div className="flex flex-col gap-0.5">
                            <span>✅ {verified} verificados</span>
                            <span>⚡ +{newToday} hoje</span>
                        </div>

                        {/* Chip for Remaining */}
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/20 text-white font-medium text-xs">
                            <Target className="h-3 w-3" />
                            Restam {remaining}
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="relative text-center text-white/90">
                    <p className="text-sm font-medium">Convide 1 amigo para virar Observador de {cityName}!</p>
                    <p className="mt-1 text-[11px] text-white/70">
                        Mais Observadores = mais melhorias na cidade.
                    </p>
                </div>

                {/* Footer */}
                <div className="relative flex items-center justify-center gap-1 mt-3 text-[10px] text-white/50 font-medium">
                    <Users className="h-3 w-3" />
                    observada.com.br/{uf.toLowerCase()}/{citySlug}
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
                    Convidar Observador
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
