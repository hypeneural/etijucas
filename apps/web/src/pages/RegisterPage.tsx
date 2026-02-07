import { useState, useCallback, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTenantNavigate } from '@/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
    Phone,
    KeyRound,
    User,
    MapPin,
    CheckCircle,
    ArrowLeft,
    ArrowRight,
    Loader2,
    Mail,
    PartyPopper,
    Sparkles,
    Home,
    Lock,
    Eye,
    EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { PhoneInput, OTPInput, AddressAutocomplete } from '@/components/auth';
import { authService, cleanPhone, validatePhone } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { PASSWORD_REGEX, mapAuthError } from '@/lib/auth-utils';
import type { RegisterStep, Address } from '@/types/auth.types';
import type { AddressDTO } from '@/types/api.types';

// Step configuration
const STEPS: { id: RegisterStep; icon: typeof Phone; label: string }[] = [
    { id: 'phone', icon: Phone, label: 'Telefone' },
    { id: 'verify', icon: KeyRound, label: 'Verificar' },
    { id: 'profile', icon: User, label: 'Perfil' },
    { id: 'address', icon: MapPin, label: 'Endereço' },
    { id: 'done', icon: CheckCircle, label: 'Pronto' },
];

export default function RegisterPage() {
    const navigate = useTenantNavigate();
    const location = useLocation();
    const setAuth = useAuthStore((state) => state.setAuth);

    // Check if coming from LoginPage with pre-verified phone
    const locationState = location.state as { phone?: string; otpVerified?: boolean } | null;
    const preVerifiedPhone = locationState?.phone;
    const isOtpVerified = locationState?.otpVerified;

    // Step state - skip to profile if OTP already verified
    const [currentStep, setCurrentStep] = useState<RegisterStep>(
        isOtpVerified ? 'profile' : 'phone'
    );
    const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

    // Form data
    const [phone, setPhone] = useState(preVerifiedPhone || '');
    const [otpCode, setOtpCode] = useState('');
    const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(null);
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [address, setAddress] = useState<Partial<Address>>({});

    // UI state
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Validation
    const isPhoneValid = validatePhone(cleanPhone(phone));
    const isOtpValid = otpCode.length === 6;
    const isPasswordValid = PASSWORD_REGEX.test(password);
    const arePasswordsMatching = password === confirmPassword;
    const isProfileValid = nome.trim().length >= 2 && isPasswordValid && arePasswordsMatching;
    const isAddressValid = address.cep && address.logradouro && address.bairro;

    // Navigation
    const goBack = useCallback(() => {
        const prevIndex = Math.max(0, currentStepIndex - 1);
        setCurrentStep(STEPS[prevIndex].id);
        setError(null);
    }, [currentStepIndex]);

    const goNext = useCallback(async () => {
        setError(null);
        setIsLoading(true);

        try {
            switch (currentStep) {
                case 'phone':
                    // Send OTP
                    const response = await authService.sendOtp({ phone: cleanPhone(phone) });

                    if (response.userExists) {
                        setError('Este telefone já está cadastrado. Faça login.');
                        return;
                    }

                    const expiresAt = new Date(Date.now() + response.expiresIn * 1000);
                    setOtpExpiresAt(expiresAt);
                    setCurrentStep('verify');
                    break;

                case 'verify':
                    // Verify OTP for registration
                    await authService.verifyOtp({ phone: cleanPhone(phone), code: otpCode });
                    setCurrentStep('profile');
                    break;

                case 'profile':
                    // Profile validation
                    if (!PASSWORD_REGEX.test(password)) {
                        throw new Error('A senha deve ter min. 8 chars, maiúscula, minúscula e número.');
                    }
                    if (!arePasswordsMatching) throw new Error('As senhas não conferem');
                    setCurrentStep('address');
                    break;

                case 'address':
                    // Map Address (ViaCEP/Frontend) to AddressDTO (Backend)
                    if (!address.cep || !address.logradouro || !address.bairro || !address.localidade || !address.uf) {
                        throw new Error('Endereço incompleto');
                    }

                    const addressDTO: AddressDTO = {
                        zipCode: address.cep,
                        street: address.logradouro,
                        number: address.numero || 'S/N',
                        neighborhood: address.bairro,
                        city: address.localidade,
                        state: address.uf,
                        complement: address.complemento
                    };

                    // Register user
                    const authResponse = await authService.register({
                        phone: cleanPhone(phone),
                        nome: nome.trim(),
                        email: email.trim() || undefined,
                        password,
                        confirmPassword,
                        address: addressDTO,
                    });

                    setAuth(authResponse.user, authResponse.token, authResponse.refreshToken);
                    setCurrentStep('done');
                    break;
            }
        } catch (err: any) {
            setError(mapAuthError(err));
        } finally {
            setIsLoading(false);
        }
    }, [currentStep, phone, otpCode, nome, email, password, confirmPassword, isPasswordValid, arePasswordsMatching, address, setAuth]);

    // Resend OTP
    const handleResendOTP = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await authService.sendOtp({ phone: cleanPhone(phone) });
            const expiresAt = new Date(Date.now() + response.expiresIn * 1000);
            setOtpExpiresAt(expiresAt);
            setOtpCode('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao reenviar código');
        } finally {
            setIsLoading(false);
        }
    }, [phone]);

    // Auto-verify OTP when complete (called from OTPInput onComplete)
    const handleVerifyOtp = useCallback(async (code: string) => {
        setIsLoading(true);
        setError(null);

        try {
            await authService.verifyOtp({ phone: cleanPhone(phone), code });
            setCurrentStep('profile');
        } catch (err) {
            setError(mapAuthError(err));
            // Clear OTP on error so user can try again
            setOtpCode('');
        } finally {
            setIsLoading(false);
        }
    }, [phone]);

    // Confetti on success
    useEffect(() => {
        if (currentStep === 'done') {
            // Fire confetti
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#22c55e', '#3b82f6', '#f59e0b'],
                });
                confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#22c55e', '#3b82f6', '#f59e0b'],
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };

            frame();
        }
    }, [currentStep]);

    // Can proceed to next step?
    const canProceed = () => {
        switch (currentStep) {
            case 'phone': return isPhoneValid;
            case 'verify': return isOtpValid;
            case 'profile': return isProfileValid;
            case 'address': return isAddressValid;
            default: return false;
        }
    };

    // Render step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 'phone':
                return (
                    <motion.div
                        key="phone"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className="space-y-6"
                    >
                        <div className="text-center mb-4">
                            <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
                                <Phone className="h-8 w-8 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold">Seu WhatsApp</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Vamos enviar um código de verificação
                            </p>
                        </div>

                        <PhoneInput
                            value={phone}
                            onChange={setPhone}
                            error={error || undefined}
                            autoFocus
                        />
                    </motion.div>
                );

            case 'verify':
                return (
                    <motion.div
                        key="verify"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className="space-y-4"
                    >
                        <OTPInput
                            value={otpCode}
                            onChange={setOtpCode}
                            onComplete={handleVerifyOtp}
                            onResend={handleResendOTP}
                            expiresAt={otpExpiresAt || undefined}
                            error={error || undefined}
                            isResending={isLoading}
                            isVerifying={isLoading}
                            phone={`(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`}
                        />
                    </motion.div>
                );

            case 'profile':
                return (
                    <motion.div
                        key="profile"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className="space-y-5"
                    >
                        <div className="text-center mb-4">
                            <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
                                <User className="h-8 w-8 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold">Seus dados</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Crie sua conta com segurança
                            </p>
                        </div>

                        {/* Name */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Nome completo
                            </Label>
                            <Input
                                type="text"
                                placeholder="Seu nome"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                className={cn(
                                    "h-12 text-base",
                                    nome.length > 0 && nome.trim().length < 2 && "border-amber-400"
                                )}
                                autoFocus
                            />
                            {nome.length > 0 && nome.trim().length < 2 && (
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                    Nome muito curto (mínimo 2 caracteres)
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                E-mail <span className="text-muted-foreground text-xs">(opcional)</span>
                            </Label>
                            <Input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-12 text-base"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                Senha
                            </Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Mínimo 8 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={cn(
                                        "h-12 text-base pr-10",
                                        password.length > 0 && !isPasswordValid && "border-amber-400"
                                    )}
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

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                Confirmar Senha
                            </Label>
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Repita a senha"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={cn(
                                    "h-12 text-base",
                                    confirmPassword.length > 0 && !arePasswordsMatching && "border-red-400"
                                )}
                            />
                            {confirmPassword.length > 0 && !arePasswordsMatching && (
                                <p className="text-xs text-red-600 dark:text-red-400">
                                    As senhas não conferem
                                </p>
                            )}
                        </div>
                    </motion.div>
                );

            case 'address':
                return (
                    <motion.div
                        key="address"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className="space-y-4"
                    >
                        <div className="text-center mb-4">
                            <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
                                <MapPin className="h-8 w-8 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold">Seu endereço</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Digite o CEP para preencher automaticamente
                            </p>
                        </div>

                        <AddressAutocomplete
                            value={address}
                            onChange={setAddress}
                            error={error || undefined}
                        />
                    </motion.div>
                );

            case 'done':
                return (
                    <motion.div
                        key="done"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2, bounce: 0.5 }}
                            className="inline-flex p-6 rounded-full bg-green-100 dark:bg-green-900/30 mb-6"
                        >
                            <PartyPopper className="h-12 w-12 text-green-600 dark:text-green-400" />
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-bold"
                        >
                            Bem-vindo(a)!
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-muted-foreground mt-2"
                        >
                            {nome}, sua conta foi criada com sucesso!
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="mt-8"
                        >
                            <Button
                                size="lg"
                                className="h-14 px-8 rounded-2xl bg-gradient-to-r from-green-600 to-green-500"
                                onClick={() => navigate('/')}
                            >
                                <Home className="h-5 w-5 mr-2" />
                                Explorar o app
                                <Sparkles className="h-5 w-5 ml-2" />
                            </Button>
                        </motion.div>
                    </motion.div>
                );
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-primary/10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 flex items-center justify-between"
            >
                {currentStep !== 'done' ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={currentStepIndex > 0 ? goBack : () => navigate('/login')}
                        className="rounded-xl"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                ) : (
                    <div />
                )}

                <h1 className="font-semibold text-lg">
                    {currentStep === 'done' ? 'Sucesso!' : 'Criar conta'}
                </h1>

                <div className="w-10" />
            </motion.div>

            {/* Progress */}
            {currentStep !== 'done' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-6 mb-6"
                >
                    <div className="flex items-center justify-between mb-2">
                        {STEPS.slice(0, -1).map((step, index) => {
                            const StepIcon = step.icon;
                            const isActive = index === currentStepIndex;
                            const isCompleted = index < currentStepIndex;

                            return (
                                <div key={step.id} className="flex items-center">
                                    <motion.div
                                        animate={{
                                            scale: isActive ? 1.1 : 1,
                                            backgroundColor: isCompleted
                                                ? 'rgb(34, 197, 94)'
                                                : isActive
                                                    ? 'hsl(var(--primary))'
                                                    : 'hsl(var(--muted))',
                                        }}
                                        className={cn(
                                            'w-10 h-10 rounded-full flex items-center justify-center',
                                            'transition-colors'
                                        )}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle className="h-5 w-5 text-white" />
                                        ) : (
                                            <StepIcon className={cn(
                                                'h-5 w-5',
                                                isActive ? 'text-white' : 'text-muted-foreground'
                                            )} />
                                        )}
                                    </motion.div>

                                    {index < STEPS.length - 2 && (
                                        <motion.div
                                            animate={{
                                                backgroundColor: isCompleted
                                                    ? 'rgb(34, 197, 94)'
                                                    : 'hsl(var(--muted))',
                                            }}
                                            className="w-8 h-1 mx-1 rounded-full"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Content */}
            <div className="flex-1 px-6 overflow-y-auto pb-32">
                <Card className="p-6 shadow-xl border-0 bg-background/80 backdrop-blur-xl">
                    <AnimatePresence mode="wait">
                        {renderStepContent()}
                    </AnimatePresence>

                    {/* Error */}
                    {error && currentStep !== 'verify' && (
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

            {/* Footer - Fixed button */}
            {currentStep !== 'done' && currentStep !== 'verify' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-background/90 backdrop-blur-lg border-t"
                >
                    {/* Skip address button */}
                    {currentStep === 'address' && !isAddressValid && (
                        <Button
                            variant="ghost"
                            size="lg"
                            onClick={async () => {
                                setIsLoading(true);
                                setError(null);
                                try {
                                    // Register without address
                                    const authResponse = await authService.register({
                                        phone: cleanPhone(phone),
                                        nome: nome.trim(),
                                        email: email.trim() || undefined,
                                        password,
                                        confirmPassword,
                                    });
                                    setAuth(authResponse.user, authResponse.token, authResponse.refreshToken);
                                    setCurrentStep('done');
                                } catch (err: any) {
                                    setError(mapAuthError(err));
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            disabled={isLoading}
                            className="w-full h-12 mb-3 text-muted-foreground"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Criando conta...
                                </>
                            ) : (
                                'Pular esta etapa'
                            )}
                        </Button>
                    )}

                    <Button
                        size="lg"
                        onClick={goNext}
                        disabled={!canProceed() || isLoading}
                        className={cn(
                            'w-full h-14 text-lg font-semibold rounded-2xl',
                            'bg-gradient-to-r from-primary to-primary/80',
                            'shadow-lg shadow-primary/30',
                            canProceed() && 'hover:shadow-xl hover:shadow-primary/40'
                        )}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                {currentStep === 'address' ? 'Criando conta...' : 'Verificando...'}
                            </>
                        ) : (
                            <>
                                {currentStep === 'address' ? 'Criar conta com endereço' : 'Continuar'}
                                <ArrowRight className="h-5 w-5 ml-2" />
                            </>
                        )}
                    </Button>

                    {currentStep === 'phone' && (
                        <p className="text-center text-sm text-muted-foreground mt-4">
                            Já tem conta?{' '}
                            <Link to="/login" className="text-primary font-semibold hover:underline">
                                Entrar
                            </Link>
                        </p>
                    )}
                </motion.div>
            )}
        </div>
    );
}
