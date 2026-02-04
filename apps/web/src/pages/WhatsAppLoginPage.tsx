/**
 * WhatsAppLoginPage
 *
 * Passwordless login via WhatsApp OTP.
 * Flow: Phone Input → OTP Verification → Success/Onboarding
 *
 * Features:
 * - Premium animated UI
 * - Clipboard detection with visibilitychange
 * - Magic link support via ?sid= query param
 * - Auto-submit on 6-digit paste
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageCircle,
    Loader2,
    MapPin,
    Users,
    ArrowRight,
    Sparkles,
    Check,
    Clipboard,
    RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PhoneInput } from '@/components/auth';
import { authService, cleanPhone, validatePhone } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useClipboardOTP } from '@/hooks/useClipboardOTP';
import { cn } from '@/lib/utils';

type Step = 'phone' | 'otp' | 'success';

export default function WhatsAppLoginPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const setAuth = useAuthStore((state) => state.setAuth);

    // Flow state
    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [sid, setSid] = useState<string | null>(null);
    const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [expiresIn, setExpiresIn] = useState(300);
    const [cooldown, setCooldown] = useState(0);

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // OTP input refs
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Clipboard hook
    const { detectedCode, showPasteChip, readClipboard, clearDetectedCode } = useClipboardOTP();

    const isPhoneValid = validatePhone(cleanPhone(phone));

    // Handle magic link ?sid= on mount
    useEffect(() => {
        const sidParam = searchParams.get('sid');
        if (sidParam) {
            handleMagicLink(sidParam);
        }
    }, [searchParams]);

    // Auto-fill OTP from clipboard detection
    useEffect(() => {
        if (detectedCode && step === 'otp') {
            setCode(detectedCode);
            // Auto-submit after a brief delay
            setTimeout(() => {
                handleVerifyOtp(detectedCode);
            }, 300);
        }
    }, [detectedCode]);

    // Countdown timer for cooldown
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => {
            setCooldown((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    // Countdown timer for expiration
    useEffect(() => {
        if (step !== 'otp' || expiresIn <= 0) return;
        const timer = setInterval(() => {
            setExpiresIn((prev) => {
                if (prev <= 1) {
                    setError('Código expirado. Solicite novo código.');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [step, expiresIn]);

    /**
     * Handle magic link from WhatsApp
     */
    const handleMagicLink = async (sidParam: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await authService.getOtpSession(sidParam);
            setSid(sidParam);
            setMaskedPhone(response.maskedPhone);
            setExpiresIn(response.expiresIn);
            setCooldown(response.cooldown);
            setStep('otp');
        } catch (err: any) {
            if (err.status === 410) {
                setError('Link expirado. Digite seu telefone para receber novo código.');
            } else {
                setError('Link inválido.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Request OTP
     */
    const handleRequestOtp = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!isPhoneValid) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await authService.requestOtpLogin(phone);
            setSid(response.sid);
            setExpiresIn(response.expiresIn);
            setCooldown(response.cooldown);
            setStep('otp');
        } catch (err: any) {
            if (err.data?.code === 'RATE_LIMITED') {
                setError(`Aguarde ${err.data.retryAfter}s para solicitar novo código.`);
                setCooldown(err.data.retryAfter);
            } else {
                setError(err.message || 'Erro ao enviar código');
            }
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Verify OTP
     */
    const handleVerifyOtp = async (codeToVerify?: string) => {
        const finalCode = codeToVerify || code;
        if (finalCode.length !== 6 || !sid) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await authService.verifyOtpLogin(sid, finalCode);

            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate([50, 50, 100]);
            }

            setAuth(response.user, response.token, response.refreshToken);
            setStep('success');
            clearDetectedCode();

            // Navigate after success animation
            setTimeout(() => {
                if (response.next_step === 'onboarding') {
                    // Will be handled by App.tsx checking needsOnboarding
                    navigate('/', { replace: true });
                } else {
                    navigate('/', { replace: true });
                }
            }, 1500);
        } catch (err: any) {
            const errorCode = err.data?.code;
            if (errorCode === 'OTP_INVALID') {
                setError('Código incorreto. Tente novamente.');
                setCode('');
                otpRefs.current[0]?.focus();
            } else if (errorCode === 'OTP_EXPIRED' || errorCode === 'SID_EXPIRED') {
                setError('Código expirado. Solicite novo código.');
                setStep('phone');
            } else {
                setError(err.message || 'Erro ao verificar código');
            }
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handle OTP input change
     */
    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newCode = code.split('');
        newCode[index] = value.slice(-1);
        const joined = newCode.join('').slice(0, 6);
        setCode(joined);

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }

        // Auto-submit on complete
        if (joined.length === 6) {
            handleVerifyOtp(joined);
        }
    };

    /**
     * Handle paste in OTP
     */
    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setCode(pasted);
            handleVerifyOtp(pasted);
        }
    };

    /**
     * Handle clipboard chip click
     */
    const handlePasteChipClick = async () => {
        const code = await readClipboard();
        if (code) {
            setCode(code);
            handleVerifyOtp(code);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-500/5 via-background to-green-600/10">
            {/* Header with logo animation */}
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="pt-12 pb-8 px-6 text-center"
            >
                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
                    className="inline-flex p-4 rounded-3xl bg-gradient-to-br from-green-500 to-green-600 shadow-xl shadow-green-500/30 mb-4"
                >
                    <MessageCircle className="h-12 w-12 text-white" />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent"
                >
                    eTijucas
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-muted-foreground mt-1"
                >
                    {step === 'phone' && 'Login rápido via WhatsApp'}
                    {step === 'otp' && 'Digite o código recebido'}
                    {step === 'success' && 'Bem-vindo!'}
                </motion.p>
            </motion.div>

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex-1 px-6"
            >
                <Card className="p-6 shadow-xl border-0 bg-background/80 backdrop-blur-xl">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Phone Input */}
                        {step === 'phone' && (
                            <motion.form
                                key="phone"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleRequestOtp}
                                className="space-y-6"
                            >
                                <div className="text-center mb-4">
                                    <h2 className="text-xl font-semibold">Seu número WhatsApp</h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Enviaremos um código de 6 dígitos
                                    </p>
                                </div>

                                <PhoneInput
                                    value={phone}
                                    onChange={setPhone}
                                    error={undefined}
                                    autoFocus
                                />

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                                    >
                                        <p className="text-sm text-red-600 dark:text-red-400 text-center">
                                            {error}
                                        </p>
                                    </motion.div>
                                )}

                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={!isPhoneValid || isLoading || cooldown > 0}
                                    className={cn(
                                        'w-full h-14 text-lg font-semibold rounded-2xl',
                                        'bg-gradient-to-r from-green-500 to-green-600',
                                        'shadow-lg shadow-green-500/30',
                                        isPhoneValid && 'hover:shadow-xl hover:shadow-green-500/40'
                                    )}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                            Enviando...
                                        </>
                                    ) : cooldown > 0 ? (
                                        <>
                                            <RefreshCw className="h-5 w-5 mr-2" />
                                            Aguarde {cooldown}s
                                        </>
                                    ) : (
                                        <>
                                            <MessageCircle className="h-5 w-5 mr-2" />
                                            Receber código via WhatsApp
                                        </>
                                    )}
                                </Button>
                            </motion.form>
                        )}

                        {/* Step 2: OTP Verification */}
                        {step === 'otp' && (
                            <motion.div
                                key="otp"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-4">
                                    <h2 className="text-xl font-semibold">Verifique seu WhatsApp</h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Código enviado para {maskedPhone || `(${phone.slice(0, 2)}) *****-${phone.slice(-4)}`}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Expira em {formatTime(expiresIn)}
                                    </p>
                                </div>

                                {/* Paste chip */}
                                {showPasteChip && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        onClick={handlePasteChipClick}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-600 hover:bg-green-500/20 transition-all"
                                    >
                                        <Clipboard className="h-4 w-4" />
                                        <span className="font-medium">Colar código do WhatsApp</span>
                                    </motion.button>
                                )}

                                {/* OTP Input boxes */}
                                <div
                                    className="flex justify-center gap-3"
                                    onPaste={handleOtpPaste}
                                >
                                    {[0, 1, 2, 3, 4, 5].map((index) => (
                                        <input
                                            key={index}
                                            ref={(el) => (otpRefs.current[index] = el)}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={code[index] || ''}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Backspace' && !code[index] && index > 0) {
                                                    otpRefs.current[index - 1]?.focus();
                                                }
                                            }}
                                            className={cn(
                                                'w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all',
                                                'focus:border-green-500 focus:ring-2 focus:ring-green-500/20',
                                                code[index] ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 'border-border bg-muted/50'
                                            )}
                                        />
                                    ))}
                                </div>

                                {/* Instructions */}
                                <div className="text-center space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                        1. Vá ao WhatsApp e toque em <span className="font-medium text-green-600">"Copiar código"</span>
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        2. Volte aqui e toque em <span className="font-medium text-green-600">"Colar código"</span>
                                    </p>
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                                    >
                                        <p className="text-sm text-red-600 dark:text-red-400 text-center">
                                            {error}
                                        </p>
                                    </motion.div>
                                )}

                                {/* Resend button */}
                                <div className="text-center">
                                    <button
                                        onClick={() => handleRequestOtp()}
                                        disabled={cooldown > 0 || isLoading}
                                        className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                                    >
                                        {cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar código'}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Success */}
                        {step === 'success' && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-8 text-center"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', bounce: 0.5 }}
                                    className="inline-flex p-6 rounded-full bg-green-500 mb-6"
                                >
                                    <Check className="h-12 w-12 text-white" />
                                </motion.div>

                                <h2 className="text-2xl font-bold text-green-600">
                                    Login realizado!
                                </h2>
                                <p className="text-muted-foreground mt-2">
                                    Redirecionando...
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            </motion.div>

            {/* Social Proof */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="py-8 px-6"
            >
                <div className="flex items-center justify-center gap-6 text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-medium">1.234 moradores</span>
                    </div>

                    <div className="w-px h-4 bg-border" />

                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        <span className="text-sm font-medium">App oficial</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
