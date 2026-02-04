/**
 * FiscalizaVivo - Live Fiscaliza Tijucas Card
 * 
 * Shows dynamic KPIs and rotating phrases about citizen reports.
 * Designed to make the feature feel "alive" and encourage participation.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle,
    CheckCircle2,
    TrendingUp,
    MapPin,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FiscalizaVivoPayload } from '@/types/home.types';
import { useHaptic } from '@/hooks/useHaptic';

interface FiscalizaVivoProps {
    data?: FiscalizaVivoPayload;
    isLoading?: boolean;
    className?: string;
}

// Default phrases if API doesn't provide
const defaultPhrases = [
    '🔧 Sua denúncia faz a diferença!',
    '📍 Viu algo? Registre agora.',
    '🏆 Tijucanos resolvendo juntos.',
    '⚡ Tempo médio de resposta: 48h',
];

export function FiscalizaVivo({ data, className }: FiscalizaVivoProps) {
    const navigate = useNavigate();
    const haptic = useHaptic();
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

    const phrases = data?.frases?.length ? data.frases : defaultPhrases;

    // Rotate phrases every 4 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [phrases.length]);

    const handleClick = () => {
        haptic.trigger('light');
        navigate('/denuncias');
    };

    const handleNewReport = (e: React.MouseEvent) => {
        e.stopPropagation();
        haptic.trigger('medium');
        navigate('/denuncias/nova');
    };

    // KPIs
    const total = data?.total || 0;
    const resolvidos = data?.resolvidos || 0;
    const hoje = data?.hoje || 0;
    const taxaResolucao = total > 0 ? Math.round((resolvidos / total) * 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClick}
            className={cn(
                'relative overflow-hidden rounded-2xl cursor-pointer',
                'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30',
                'border border-orange-200/50 dark:border-orange-800/30',
                'p-4',
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20">
                        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Fiscaliza Tijucas</h3>
                        <p className="text-xs text-muted-foreground">Denúncias dos cidadãos</p>
                    </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-3 gap-2 mb-3">
                {/* Total */}
                <div className="flex flex-col items-center p-2 rounded-xl bg-white/50 dark:bg-white/5">
                    <span className="text-lg font-bold text-foreground">{total}</span>
                    <span className="text-[10px] text-muted-foreground">Total</span>
                </div>

                {/* Resolvidos */}
                <div className="flex flex-col items-center p-2 rounded-xl bg-emerald-100/50 dark:bg-emerald-900/20">
                    <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{resolvidos}</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-500">Resolvidos</span>
                </div>

                {/* Hoje */}
                <div className="flex flex-col items-center p-2 rounded-xl bg-blue-100/50 dark:bg-blue-900/20">
                    <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-blue-600" />
                        <span className="text-lg font-bold text-blue-700 dark:text-blue-400">+{hoje}</span>
                    </div>
                    <span className="text-[10px] text-blue-600 dark:text-blue-500">Hoje</span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Taxa de resolução</span>
                    <span className="font-medium text-emerald-600">{taxaResolucao}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${taxaResolucao}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-emerald-500"
                    />
                </div>
            </div>

            {/* Rotating phrase */}
            <div className="relative h-6 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={currentPhraseIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 text-xs text-center text-muted-foreground"
                    >
                        {phrases[currentPhraseIndex]}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* CTA Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNewReport}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 text-white font-medium text-sm shadow-sm"
            >
                <MapPin className="h-4 w-4" />
                Fazer uma denúncia
            </motion.button>

            {/* Decorative sparkle */}
            {hoje > 5 && (
                <motion.div
                    className="absolute top-2 right-2"
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                >
                    <Sparkles className="h-4 w-4 text-amber-400" />
                </motion.div>
            )}
        </motion.div>
    );
}

export default FiscalizaVivo;
