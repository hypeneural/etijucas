import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2,
    Phone,
    ArrowRight,
    ArrowLeft,
    KeyRound,
    Lock,
    Eye,
    EyeOff,
    CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { PhoneInput, OTPInput } from '@/components/auth';
import { authService, cleanPhone, validatePhone } from '@/services/auth.service';
import { cn } from '@/lib/utils';
import { PASSWORD_REGEX, mapAuthError } from '@/lib/auth-utils';

type Step = 'phone' | 'otp' | 'password' | 'done';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();

    // Steps
    const [currentStep, setCurrentStep] = useState<Step>('phone');

    // Data
    const [phone, setPhone] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Validation
    const isPhoneValid = validatePhone(cleanPhone(phone));
    const isOtpValid = otpCode.length === 6;
    const isPasswordValid = PASSWORD_REGEX.test(password);
    const arePasswordsMatching = password === confirmPassword;

    // Handlers
    const handleSendOTP = async (isResend = false) => {
        if (!isPhoneValid) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await authService.forgotPassword({ phone: cleanPhone(phone) });
            const expiresAt = new Date(Date.now() + response.expiresIn * 1000);
            setOtpExpiresAt(expiresAt);
            if (!isResend) setCurrentStep('otp');
            if (isResend) setOtpCode('');
        } catch (err) {
            setError(mapAuthError(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!isOtpValid) return;
        // Logic: verification happens implicitly when resetting password 
        // OR we could have a verify endpoint. 
        // Backend 'verifyOtp' is for login/register usually.
        // But for reset password, usually we just collect the code and send it with the new password.
        // So we proceed to password step directly for UI flow.
        setCurrentStep('password');
    };

    const handleResetPassword = async () => {
        if (!isPasswordValid || !arePasswordsMatching) return;

        setIsLoading(true);
        setError(null);

        try {
            await authService.resetPassword({
                phone: cleanPhone(phone),
                code: otpCode,
                password,
                confirmPassword,
            });
            setCurrentStep('done');
        } catch (err: any) {
            setError(mapAuthError(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentStep === 'phone') await handleSendOTP();
        else if (currentStep === 'otp') await handleVerifyOTP();
        else if (currentStep === 'password') await handleResetPassword();
    };

    const stepsContent = {
        phone: (
            <motion.div
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
            >
                <div className="text-center mb-4">
                    <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
                        <KeyRound className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">Recuperar Senha</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Digite seu telefone para receber um código
                    </p>
                </div>

                <PhoneInput
                    value={phone}
                    onChange={setPhone}
                    error={undefined}
                    autoFocus
                />

                <Button
                    type="submit"
                    size="lg"
                    disabled={!isPhoneValid || isLoading}
                    className="w-full h-14 text-lg font-semibold rounded-2xl"
                >
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <>
                            Enviar Código
                            <ArrowRight className="h-5 w-5 ml-2" />
                        </>
                    )}
                </Button>
            </motion.div>
        ),
        otp: (
            <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
            >
                <OTPInput
                    value={otpCode}
                    onChange={setOtpCode}
                    onComplete={(code) => {
                        setOtpCode(code);
                        setCurrentStep('password');
                    }}
                    onResend={() => handleSendOTP(true)}
                    expiresAt={otpExpiresAt || undefined}
                    error={error || undefined}
                    isResending={isLoading}
                    isVerifying={false}
                    phone={`(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`}
                />
            </motion.div>
        ),
        password: (
            <motion.div
                key="password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
            >
                <div className="text-center mb-4">
                    <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
                        <Lock className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">Nova Senha</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Digite sua nova senha
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nova Senha</Label>
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={cn(
                                    "h-12 text-base pr-10",
                                    password.length > 0 && !isPasswordValid && "border-amber-400"
                                )}
                                placeholder="Mínimo 8 caracteres"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        {password.length > 0 && !isPasswordValid && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                Mínimo 8 caracteres
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Confirmar Senha</Label>
                        <Input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={cn(
                                "h-12 text-base",
                                confirmPassword.length > 0 && !arePasswordsMatching && "border-red-400"
                            )}
                            placeholder="Repita a senha"
                            autoComplete="new-password"
                        />
                        {confirmPassword.length > 0 && !arePasswordsMatching && (
                            <p className="text-xs text-red-600 dark:text-red-400">
                                As senhas não conferem
                            </p>
                        )}
                    </div>
                </div>

                <Button
                    type="submit"
                    size="lg"
                    disabled={!isPasswordValid || !arePasswordsMatching || isLoading}
                    className="w-full h-14 text-lg font-semibold rounded-2xl"
                >
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        "Redefinir Senha"
                    )}
                </Button>
            </motion.div>
        ),
        done: (
            <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
            >
                <div className="inline-flex p-6 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                    <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Sucesso!</h2>
                <p className="text-muted-foreground mb-8">
                    Sua senha foi redefinida com sucesso.
                </p>
                <Button
                    size="lg"
                    onClick={() => navigate('/login')}
                    className="w-full h-14 text-lg font-semibold rounded-2xl bg-green-600 hover:bg-green-700"
                >
                    Fazer Login
                </Button>
            </motion.div>
        )
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-primary/10">
            {/* Header */}
            <div className="p-4">
                {currentStep !== 'done' && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            if (currentStep === 'phone') navigate('/login');
                            else if (currentStep === 'otp') setCurrentStep('phone');
                            else if (currentStep === 'password') setCurrentStep('otp');
                        }}
                        className="rounded-xl"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 px-6 flex items-center justify-center pb-20">
                <Card className="w-full max-w-md p-6 shadow-xl border-0 bg-background/80 backdrop-blur-xl">
                    <form onSubmit={handleSubmit}>
                        <AnimatePresence mode="wait">
                            {stepsContent[currentStep]}
                        </AnimatePresence>
                    </form>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                        >
                            <p className="text-sm text-red-600 dark:text-red-400 text-center">
                                {error}
                            </p>
                        </motion.div>
                    )}
                </Card>
            </div>
        </div>
    );
}
