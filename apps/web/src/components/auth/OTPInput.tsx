import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    KeyRound,
    RotateCw,
    Check,
    AlertCircle,
    MessageCircle,
    Smartphone,
    Sparkles,
    ShieldCheck,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OTPInputProps {
    value: string;
    onChange: (value: string) => void;
    onComplete?: (code: string) => void;  // Auto-verify when 6 digits entered
    onResend?: () => void;
    error?: string;
    expiresAt?: Date;
    disabled?: boolean;
    isResending?: boolean;
    isVerifying?: boolean;  // Shows verifying spinner
    phone?: string;
}

export function OTPInput({
    value,
    onChange,
    onComplete,
    onResend,
    error,
    expiresAt,
    disabled = false,
    isResending = false,
    isVerifying = false,
    phone,
}: OTPInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const [countdown, setCountdown] = useState(0);
    const [shake, setShake] = useState(false);
    const [pulseIndex, setPulseIndex] = useState<number | null>(null);

    const CODE_LENGTH = 6;
    const digits = value.padEnd(CODE_LENGTH, ' ').split('').slice(0, CODE_LENGTH);

    // Countdown timer with visual updates
    useEffect(() => {
        if (expiresAt) {
            const updateCountdown = () => {
                const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
                setCountdown(remaining);
                return remaining;
            };

            updateCountdown();
            const interval = setInterval(() => {
                if (updateCountdown() === 0) {
                    clearInterval(interval);
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [expiresAt]);

    // Shake on error with haptic-like visual feedback
    useEffect(() => {
        if (error) {
            setShake(true);
            const timeout = setTimeout(() => setShake(false), 600);
            return () => clearTimeout(timeout);
        }
    }, [error]);

    // Auto-focus first input on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            inputRefs.current[0]?.focus();
            setFocusedIndex(0);
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    // Auto-trigger onComplete when code is complete
    useEffect(() => {
        if (value.length === CODE_LENGTH && onComplete && !error && !isVerifying) {
            // Small delay to allow UI to update and show complete state
            const timer = setTimeout(() => {
                onComplete(value);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [value, onComplete, error, isVerifying]);

    // Pulse animation when digit is entered
    const triggerPulse = useCallback((index: number) => {
        setPulseIndex(index);
        setTimeout(() => setPulseIndex(null), 300);
    }, []);

    const handleDigitChange = useCallback((index: number, newDigit: string) => {
        // Only accept single digit
        const digit = newDigit.replace(/\D/g, '').slice(-1);

        if (digit) {
            const newDigits = [...digits];
            newDigits[index] = digit;
            const newValue = newDigits.join('').replace(/ /g, '');
            onChange(newValue);
            triggerPulse(index);

            // Move to next input
            if (index < CODE_LENGTH - 1) {
                setTimeout(() => {
                    inputRefs.current[index + 1]?.focus();
                    setFocusedIndex(index + 1);
                }, 50);
            }
        }
    }, [digits, onChange, triggerPulse]);

    const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace') {
            e.preventDefault();
            const newDigits = [...digits];

            if (digits[index] !== ' ') {
                // Clear current digit
                newDigits[index] = ' ';
                onChange(newDigits.join('').replace(/ /g, ''));
            } else if (index > 0) {
                // Move to previous and clear
                newDigits[index - 1] = ' ';
                onChange(newDigits.join('').replace(/ /g, ''));
                inputRefs.current[index - 1]?.focus();
                setFocusedIndex(index - 1);
            }
        }

        if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
            setFocusedIndex(index - 1);
        }
        if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
            setFocusedIndex(index + 1);
        }
    }, [digits, onChange]);

    // Handle paste - auto-fill all digits
    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);

        if (pasted.length > 0) {
            onChange(pasted);

            // Animate each box sequentially
            pasted.split('').forEach((_, i) => {
                setTimeout(() => triggerPulse(i), i * 80);
            });

            const nextIndex = Math.min(pasted.length, CODE_LENGTH - 1);
            setTimeout(() => {
                inputRefs.current[nextIndex]?.focus();
                setFocusedIndex(nextIndex);
            }, pasted.length * 80 + 100);
        }
    }, [onChange, triggerPulse]);

    const formatCountdown = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const isComplete = value.length === CODE_LENGTH;
    const progress = (value.length / CODE_LENGTH) * 100;

    return (
        <div className="space-y-6">
            {/* Header with WhatsApp icon and animation */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-3"
            >
                <motion.div
                    animate={{
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: 'reverse',
                    }}
                    className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/30"
                >
                    <MessageCircle className="h-8 w-8 text-white" />
                </motion.div>

                <div>
                    <h3 className="font-bold text-xl">Verificação WhatsApp</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Enviamos um código de 6 dígitos para
                    </p>
                    {phone && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-primary font-semibold flex items-center justify-center gap-1 mt-1"
                        >
                            <Smartphone className="h-4 w-4" />
                            {phone}
                        </motion.p>
                    )}
                </div>
            </motion.div>

            {/* Progress bar */}
            <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={cn(
                        'absolute inset-y-0 left-0 rounded-full',
                        isComplete
                            ? 'bg-gradient-to-r from-green-400 to-green-600'
                            : 'bg-gradient-to-r from-primary to-primary/70'
                    )}
                />
            </div>

            {/* OTP Boxes */}
            <motion.div
                ref={containerRef}
                animate={shake ? {
                    x: [-12, 12, -12, 12, -6, 6, 0],
                    transition: { duration: 0.5 }
                } : {}}
                className="flex justify-center gap-2 sm:gap-3"
            >
                {digits.map((digit, index) => {
                    const isFilled = digit !== ' ';
                    const isFocused = focusedIndex === index;
                    const isPulsing = pulseIndex === index;

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30, scale: 0.8 }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                scale: isPulsing ? 1.1 : 1,
                            }}
                            transition={{
                                delay: index * 0.08,
                                duration: 0.3,
                                scale: { duration: 0.15 }
                            }}
                            className="relative"
                        >
                            {/* Glow effect when focused */}
                            {isFocused && (
                                <motion.div
                                    layoutId="otp-glow"
                                    className="absolute -inset-1 rounded-2xl bg-primary/20 blur-sm"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                />
                            )}

                            {/* Input box */}
                            <input
                                ref={(el) => { inputRefs.current[index] = el; }}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoComplete="one-time-code"
                                maxLength={1}
                                value={digit === ' ' ? '' : digit}
                                onChange={(e) => handleDigitChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onFocus={() => setFocusedIndex(index)}
                                onBlur={() => setFocusedIndex(null)}
                                onPaste={handlePaste}
                                disabled={disabled}
                                className={cn(
                                    'relative w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-bold',
                                    'rounded-xl sm:rounded-2xl border-2 outline-none',
                                    'transition-all duration-200 ease-out',
                                    'bg-background/50 backdrop-blur-sm',
                                    // States
                                    !isFilled && !isFocused && !error && 'border-border hover:border-muted-foreground/50',
                                    isFocused && !error && 'border-primary shadow-lg shadow-primary/20',
                                    isFilled && !error && 'border-green-400 bg-green-50/50 dark:bg-green-950/30 text-green-700 dark:text-green-300',
                                    error && 'border-red-400 bg-red-50/50 dark:bg-red-950/30 text-red-600',
                                    disabled && 'opacity-50 cursor-not-allowed'
                                )}
                            />

                            {/* Success checkmark overlay */}
                            <AnimatePresence>
                                {isFilled && !error && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-sm"
                                    >
                                        <Check className="h-3 w-3 text-white" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Status Messages */}
            <AnimatePresence mode="wait">
                {isComplete && !error && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                    >
                        {isVerifying ? (
                            <>
                                <Loader2 className="h-5 w-5 text-green-600 dark:text-green-400 animate-spin" />
                                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                    Verificando código...
                                </span>
                            </>
                        ) : (
                            <>
                                <motion.div
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </motion.div>
                                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                    Código completo!
                                </span>
                                <Sparkles className="h-4 w-4 text-green-500 animate-pulse" />
                            </>
                        )}
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                    >
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">
                            {error}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Countdown & Resend */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center space-y-3"
            >
                {countdown > 0 ? (
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Não recebeu o código?
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-sm font-medium">
                                Reenviar em <span className="font-mono text-primary">{formatCountdown(countdown)}</span>
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Não recebeu o código?
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onResend}
                            disabled={isResending || disabled}
                            className="rounded-full px-6 border-primary/50 hover:bg-primary/10"
                        >
                            {isResending ? (
                                <>
                                    <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <RotateCw className="h-4 w-4 mr-2" />
                                    Reenviar código
                                </>
                            )}
                        </Button>
                    </div>
                )}

                <p className="text-xs text-muted-foreground/70">
                    Dica: Cole o código automaticamente quando receber
                </p>
            </motion.div>
        </div>
    );
}

export default OTPInput;
