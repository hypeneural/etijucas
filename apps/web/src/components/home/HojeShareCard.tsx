/**
 * HojeShareCard - Shareable Daily Card
 * 
 * Creates a visually appealing card that can be shared
 * on social media showing "Hoje em Tijucas" daily highlights.
 * 
 * Uses html2canvas for image generation when sharing.
 */

import React, { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Share2, Download, Calendar, CloudSun, Users, AlertTriangle, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/hooks/useHaptics';
import { useToast } from '@/hooks/use-toast';
import { useCityName, useAppName } from '@/hooks/useCityName';

interface HojeShareCardProps {
    clima?: {
        temp: number;
        icon: number;
        frase: string;
    };
    eventos?: number;
    denuncias?: number;
    forumPosts?: number;
    usuarios?: number;
    className?: string;
}

// Weather emoji based on code
function getWeatherEmoji(code: number): string {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 49) return '🌫️';
    if (code <= 69) return '🌧️';
    if (code <= 79) return '🌨️';
    if (code <= 99) return '⛈️';
    return '☀️';
}

export function HojeShareCard({
    clima,
    eventos = 0,
    denuncias = 0,
    forumPosts = 0,
    usuarios = 0,
    className,
}: HojeShareCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();
    const { name: cityName } = useCityName();
    const appName = useAppName();

    const today = new Date();
    const dateStr = format(today, "EEEE, d 'de' MMMM", { locale: ptBR });

    const handleShare = useCallback(async () => {
        hapticFeedback('medium');

        if (!cardRef.current) return;

        setIsGenerating(true);

        try {
            // Dynamic import for code splitting
            const html2canvas = (await import('html2canvas')).default;

            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
            });

            const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((b) => resolve(b!), 'image/png', 0.9);
            });

            // Try native share first
            if (navigator.share && navigator.canShare) {
                const file = new File([blob], `hoje-em-${cityName.toLowerCase()}.png`, { type: 'image/png' });
                const shareData = {
                    title: `Hoje em ${cityName}`,
                    text: `📍 ${dateStr}\n🌡️ ${clima?.temp}°C\n📅 ${eventos} eventos\n\nVeja mais em ${appName.toLowerCase()}.com.br`,
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
            a.download = `hoje-em-${cityName.toLowerCase()}.png`;
            a.click();
            URL.revokeObjectURL(url);

            toast({
                title: 'Imagem salva!',
                description: 'Compartilhe nas suas redes sociais 📱',
            });
            hapticFeedback('success');
        } catch (error) {
            console.error('Share error:', error);
            toast({
                title: 'Erro ao gerar imagem',
                description: 'Tente novamente',
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(false);
        }
    }, [clima, dateStr, eventos, toast]);

    return (
        <div className={cn('px-4', className)}>
            {/* Shareable Card */}
            <motion.div
                ref={cardRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-4 text-white shadow-lg"
            >
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <svg width="100%" height="100%">
                        <pattern id="sharePattern" width="40" height="40" patternUnits="userSpaceOnUse">
                            <circle cx="20" cy="20" r="1.5" fill="white" />
                        </pattern>
                        <rect width="100%" height="100%" fill="url(#sharePattern)" />
                    </svg>
                </div>

                {/* Header */}
                <div className="relative flex items-center justify-between mb-3">
                    <div>
                        <h3 className="text-lg font-bold">Hoje em {cityName}</h3>
                        <p className="text-xs text-white/80 capitalize">{dateStr}</p>
                    </div>
                    <div className="flex items-center gap-1 text-2xl font-bold">
                        <span>{getWeatherEmoji(clima?.icon || 0)}</span>
                        <span>{clima?.temp || 25}°</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="relative grid grid-cols-4 gap-2 mb-3">
                    <div className="flex flex-col items-center p-2 rounded-xl bg-white/10">
                        <Calendar className="h-4 w-4 mb-1" />
                        <span className="text-lg font-bold">{eventos}</span>
                        <span className="text-[9px] text-white/70">eventos</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-xl bg-white/10">
                        <AlertTriangle className="h-4 w-4 mb-1" />
                        <span className="text-lg font-bold">{denuncias}</span>
                        <span className="text-[9px] text-white/70">denúncias</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-xl bg-white/10">
                        <MessageCircle className="h-4 w-4 mb-1" />
                        <span className="text-lg font-bold">{forumPosts}</span>
                        <span className="text-[9px] text-white/70">posts</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-xl bg-white/10">
                        <Users className="h-4 w-4 mb-1" />
                        <span className="text-lg font-bold">{usuarios}</span>
                        <span className="text-[9px] text-white/70">cidadãos</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative text-center">
                    <p className="text-xs text-white/60">{appName.toLowerCase()}.com.br</p>
                </div>
            </motion.div>

            {/* Share Button */}
            <motion.button
                onClick={handleShare}
                disabled={isGenerating}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    'mt-3 w-full flex items-center justify-center gap-2',
                    'py-2.5 rounded-xl font-medium text-sm',
                    'bg-primary/10 text-primary hover:bg-primary/20',
                    'transition-colors min-h-[44px]',
                    isGenerating && 'opacity-50 cursor-wait'
                )}
            >
                {isGenerating ? (
                    <>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        >
                            <Download className="h-4 w-4" />
                        </motion.div>
                        Gerando imagem...
                    </>
                ) : (
                    <>
                        <Share2 className="h-4 w-4" />
                        Compartilhar o dia
                    </>
                )}
            </motion.button>
        </div>
    );
}

export default HojeShareCard;
