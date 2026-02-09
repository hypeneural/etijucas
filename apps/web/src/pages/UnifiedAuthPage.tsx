/**
 * UnifiedAuthPage
 *
 * Single entry point for login/registration via WhatsApp OTP.
 * Combines login + registration + onboarding in one seamless flow.
 *
 * Flow:
 * Step 1: PHONE    → Input phone number
 * Step 2: OTP      → Verify 6-digit code
 * Step 3: PROFILE  → Name + Terms (only for new users)
 * Step 4: SUCCESS  → Animation + redirect
 *
 * Features:
 * - OTP-first (no password)
 * - Auto-registration for new users
 * - Inline onboarding (not modal)
 * - Clipboard OTP detection
 * - Magic link support via ?token=
 * - Multi-tenancy aware
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTenantNavigate } from '@/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageCircle,
    Loader2,
    MapPin,
    Users,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    Check,
    Clipboard,
    RefreshCw,
    User,
    Shield,
    ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { PhoneInput } from '@/components/auth';
import { authService, cleanPhone, validatePhone } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useClipboardOTP } from '@/hooks/useClipboardOTP';
import { useAppName, useCityName } from '@/hooks/useCityName';
import { cn } from '@/lib/utils';

// Flow steps
type Step = 'phone' | 'otp' | 'profile' | 'success';

// Step indicator config
const STEPS: { key: Step; label: string }[] = [
    { key: 'phone', label: 'Telefone' },
    { key: 'otp', label: 'Código' },
    { key: 'profile', label: 'Perfil' },
    { key: 'success', label: 'Pronto' },
];

export default function UnifiedAuthPage() {
    const navigate = useTenantNavigate();
    const [searchParams] = useSearchParams();
    const { setAuth, updateUser } = useAuthStore();
    const appName = useAppName();
    const { name: cityName } = useCityName();

    // Flow state
    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [sid, setSid] = useState<string | null>(null);
    const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [expiresIn, setExpiresIn] = useState(300);
    const [cooldown, setCooldown] = useState(0);

    // Profile state (for new users)
    const [isNewUser, setIsNewUser] = useState(false);
    const [nome, setNome] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // OTP input refs
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Clipboard hook
    const { detectedCode, showPasteChip, readClipboard, clearDetectedCode } = useClipboardOTP();

    // Validation
    const isPhoneValid = validatePhone(cleanPhone(phone));
    const isNameValid = nome.trim().length >= 2;
    const canSubmitProfile = isNameValid && termsAccepted;

    // Get current step index for progress
    const currentStepIndex = STEPS.findIndex(s => s.key === step);
    const visibleSteps = isNewUser ? STEPS : STEPS.filter(s => s.key !== 'profile');

    // Handle magic link ?token= on mount
    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            handleMagicLink(token);
        }
    }, [searchParams]);

    // Auto-fill OTP from clipboard detection
    useEffect(() => {
        if (detectedCode && step === 'otp') {
            setCode(detectedCode);
            setIsLoading(true);
            setTimeout(() => handleVerifyOtp(detectedCode), 300);
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
     * Handle magic link from WhatsApp button
     */
    const handleMagicLink = async (token: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await authService.verifyMagicLink(token);
            setAuth(response.user, response.token, response.refreshToken);

            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate([50, 50, 100]);
            }

            // Check if needs profile completion
            if (!response.user.profileCompleted) {
                setIsNewUser(true);
                setStep('profile');
            } else {
                setStep('success');
                setTimeout(() => navigate('/', { replace: true }), 1500);
            }
        } catch (err: any) {
            if (err.status === 410 || err.status === 404) {
                setError('Link expirado ou inválido. Digite seu telefone para receber novo código.');
            } else {
                setError('Erro ao processar link. Tente novamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Request OTP via WhatsApp
     */
    const handleRequestOtp = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!isPhoneValid) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await authService.requestOtpLogin(cleanPhone(phone));
            setSid(response.sid);
            setExpiresIn(response.expiresIn || 300);
            setCooldown(response.cooldown || 60);
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
     * Verify OTP code
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
            clearDetectedCode();

            // Check if new user needs profile
            const needsProfile = response.isNewUser || !response.user.profileCompleted;
            setIsNewUser(needsProfile);

            if (needsProfile) {
                setStep('profile');
            } else {
                setStep('success');
                setTimeout(() => navigate('/', { replace: true }), 1500);
            }
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
     * Complete profile for new user
     */
    const handleCompleteProfile = async () => {
        if (!canSubmitProfile) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await authService.completeProfile({
                nome: nome.trim(),
                termsAccepted: true,
            });

            // Explicitly set profileCompleted to prevent re-showing onboarding
            updateUser({ ...response.user, profileCompleted: true });

            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }

            setStep('success');
            setTimeout(() => navigate('/', { replace: true }), 1500);
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar perfil');
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
            setIsLoading(true);
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
            setIsLoading(true);
            handleVerifyOtp(pasted);
        }
    };

    /**
     * Handle clipboard chip click
     */
    const handlePasteChipClick = async () => {
        const clipCode = await readClipboard();
        if (clipCode) {
            setCode(clipCode);
            handleVerifyOtp(clipCode);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Animation variants
    const stepVariants = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-primary/10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="pt-12 pb-6 px-6 text-center"
            >
                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
                    className="inline-flex p-4 rounded-3xl bg-gradient-to-br from-primary to-primary/70 shadow-xl shadow-primary/30 mb-4"
                >
                    <MapPin className="h-10 w-10 text-white" />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
                >
                    {appName}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-muted-foreground text-sm mt-1"
                >
                    Seu dia a dia em {cityName}
                </motion.p>
            </motion.div>

            {/* Step Progress */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="px-6 mb-4"
            >
                <div className="flex justify-center gap-2">
                    {visibleSteps.map((s, index) => {
                        const stepIdx = STEPS.findIndex(st => st.key === s.key);
                        const isActive = s.key === step;
                        const isComplete = stepIdx < currentStepIndex;

                        return (
                            <div
                                key={s.key}
                                className={cn(
                                    'h-1.5 rounded-full transition-all duration-300',
                                    isActive ? 'w-8 bg-primary' :
                                        isComplete ? 'w-6 bg-primary/50' :
                                            'w-6 bg-muted'
                                )}
                            />
                        );
                    })}
                </div>
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
                                variants={stepVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                onSubmit={handleRequestOtp}
                                className="space-y-5"
                            >
                                <div className="text-center mb-2">
                                    <div className="inline-flex p-3 rounded-2xl bg-green-500/10 mb-3">
                                        <MessageCircle className="h-6 w-6 text-green-600" />
                                    </div>
                                    <h2 className="text-lg font-semibold">Entre com WhatsApp</h2>
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
                                        'w-full h-14 text-base font-semibold rounded-2xl',
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
                                            Receber código
                                        </>
                                    )}
                                </Button>

                                <p className="text-xs text-center text-muted-foreground">
                                    Ao continuar, você concorda com nossos{' '}
                                    <Link to="/termos" className="text-primary hover:underline">
                                        Termos de Uso
                                    </Link>
                                </p>
                            </motion.form>
                        )}

                        {/* Step 2: OTP Verification */}
                        {step === 'otp' && (
                            <motion.div
                                key="otp"
                                variants={stepVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="space-y-5"
                            >
                                <div className="text-center mb-2">
                                    <h2 className="text-lg font-semibold">Verifique seu WhatsApp</h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Código enviado para {maskedPhone || `(${phone.slice(0, 2)}) •••••-${phone.slice(-4)}`}
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
                                        <span className="font-medium">Colar código</span>
                                    </motion.button>
                                )}

                                {/* OTP Input boxes */}
                                <div
                                    className="flex justify-center gap-2"
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
                                                'w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all touch-manipulation',
                                                'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
                                                code[index] ? 'border-primary bg-primary/5' : 'border-border bg-muted/50'
                                            )}
                                        />
                                    ))}
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

                                {/* Actions */}
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => setStep('phone')}
                                        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Trocar número
                                    </button>

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

                        {/* Step 3: Profile (for new users) */}
                        {step === 'profile' && (
                            <motion.div
                                key="profile"
                                variants={stepVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="space-y-5"
                            >
                                <div className="text-center mb-2">
                                    <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-3">
                                        <User className="h-6 w-6 text-primary" />
                                    </div>
                                    <h2 className="text-lg font-semibold">Quase lá!</h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Como podemos te chamar?
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <Input
                                            value={nome}
                                            onChange={(e) => setNome(e.target.value)}
                                            placeholder="Seu nome"
                                            className="h-12 text-base rounded-xl"
                                            autoFocus
                                        />
                                        {nome && !isNameValid && (
                                            <p className="text-xs text-muted-foreground mt-1 ml-1">
                                                Mínimo 2 caracteres
                                            </p>
                                        )}
                                    </div>

                                    <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                                        <Checkbox
                                            checked={termsAccepted}
                                            onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                                            className="mt-0.5"
                                        />
                                        <div className="text-sm">
                                            <p className="text-foreground">
                                                Li e aceito os{' '}
                                                <Link
                                                    to="/termos"
                                                    target="_blank"
                                                    className="text-primary hover:underline inline-flex items-center gap-1"
                                                >
                                                    Termos de Uso
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            </p>
                                            <p className="text-muted-foreground mt-0.5">
                                                Inclui política de privacidade
                                            </p>
                                        </div>
                                    </label>
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

                                <Button
                                    onClick={handleCompleteProfile}
                                    size="lg"
                                    disabled={!canSubmitProfile || isLoading}
                                    className={cn(
                                        'w-full h-13 text-base font-semibold rounded-2xl',
                                        'bg-gradient-to-r from-primary to-primary/80',
                                        'shadow-lg shadow-primary/30',
                                        canSubmitProfile && 'hover:shadow-xl hover:shadow-primary/40'
                                    )}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-5 w-5 mr-2" />
                                            Concluir
                                        </>
                                    )}
                                </Button>
                            </motion.div>
                        )}

                        {/* Step 4: Success */}
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
                                    className="inline-flex p-5 rounded-full bg-green-500 mb-5"
                                >
                                    <Check className="h-10 w-10 text-white" />
                                </motion.div>

                                <h2 className="text-xl font-bold text-green-600">
                                    Bem-vindo!
                                </h2>
                                <p className="text-muted-foreground mt-2">
                                    Entrando no {appName}...
                                </p>

                                <div className="mt-4">
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                                </div>
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
                className="py-6 px-6"
            >
                <div className="flex items-center justify-center gap-5 text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-500" />
                        <span className="text-xs font-medium">Seguro</span>
                    </div>

                    <div className="w-px h-3 bg-border" />

                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium">+1.000 moradores</span>
                    </div>

                    <div className="w-px h-3 bg-border" />

                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-medium">Oficial</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
