/**
 * WelcomeGreeting - Contextual personalized greeting
 * Shows time-based greeting with user name and contextual info
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, CloudSun, Flame, PartyPopper, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';

interface WelcomeGreetingProps {
    todayEventsCount?: number;
    hasActiveAlert?: boolean;
    streakDays?: number;
}

export default function WelcomeGreeting({
    todayEventsCount = 0,
    hasActiveAlert = false,
    streakDays = 0,
}: WelcomeGreetingProps) {
    const { user, isAuthenticated } = useAuthStore();
    const { selectedBairro } = useAppStore();

    const greeting = useMemo(() => {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 12) {
            return { text: 'Bom dia', icon: Sun, emoji: '☀️' };
        } else if (hour >= 12 && hour < 18) {
            return { text: 'Boa tarde', icon: CloudSun, emoji: '🌤️' };
        } else {
            return { text: 'Boa noite', icon: Moon, emoji: '🌙' };
        }
    }, []);

    const firstName = user?.nome?.split(' ')[0] || '';

    const contextMessage = useMemo(() => {
        if (hasActiveAlert) {
            return null; // Alert banner will show separately
        }
        if (todayEventsCount > 0) {
            return `${todayEventsCount} evento${todayEventsCount > 1 ? 's' : ''} hoje em ${selectedBairro.nome}`;
        }
        return `Veja o que está rolando em ${selectedBairro.nome}`;
    }, [hasActiveAlert, todayEventsCount, selectedBairro]);

    const GreetingIcon = greeting.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between"
        >
            <div className="flex items-center gap-2">
                <motion.div
                    animate={{
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                >
                    <GreetingIcon className="w-5 h-5 text-primary-foreground/80" />
                </motion.div>

                <div>
                    <p className="text-sm font-medium text-primary-foreground">
                        {greeting.text}{firstName ? `, ${firstName}!` : '!'} {greeting.emoji}
                    </p>
                    {contextMessage && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-xs text-primary-foreground/70"
                        >
                            {contextMessage}
                        </motion.p>
                    )}
                </div>
            </div>

            {/* Streak badge */}
            {streakDays > 1 && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
                    className="flex items-center gap-1 px-2 py-1 
                     bg-gradient-to-r from-amber-500 to-orange-500 
                     rounded-full text-white text-xs font-medium shadow-lg"
                >
                    <Flame className="w-3 h-3" />
                    <span>{streakDays}d</span>
                </motion.div>
            )}
        </motion.div>
    );
}
