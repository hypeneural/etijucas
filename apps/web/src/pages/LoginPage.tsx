import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LogIn,
    Loader2,
    MapPin,
    Users,
    Phone,
    ArrowRight,
    Sparkles,
    Lock,
    MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/auth';
import { authService, cleanPhone, validatePhone } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useAppName, useCityName } from '@/hooks/useCityName';

export default function LoginPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const appName = useAppName();
    const { name: cityName } = useCityName();

    // Form data
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isPhoneValid = validatePhone(cleanPhone(phone));
    const isFormValid = isPhoneValid && password.length >= 6;

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isFormValid) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await authService.login({
                phone: cleanPhone(phone),
                password,
            });

            if (response.token && response.user) {
                setAuth(response.user, response.token, response.refreshToken);
                navigate('/');
            }
        } catch (err: any) {
            // Handle specific errors
            if (err.data?.code === 'RATE_LIMITED' && err.data?.retryAfter) {
                setError(`Muitas tentativas. Tente novamente em ${err.data.retryAfter} segundos.`);
            } else if (err.status === 401 || err.data?.code === 'INVALID_CREDENTIALS') {
                setError('Telefone ou senha incorretos');
            } else if (err.status === 404 || err.data?.code === 'USER_NOT_FOUND') {
                // Suggest registration if user not found
                setError('Usuário não encontrado. Crie uma conta.');
            } else {
                setError(err.message || 'Erro ao realizar login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-primary/10">
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
                    className="inline-flex p-4 rounded-3xl bg-gradient-to-br from-primary to-primary/70 shadow-xl shadow-primary/30 mb-4"
                >
                    <MapPin className="h-12 w-12 text-white" />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
                >
                    {appName}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-muted-foreground mt-1"
                >
                    Seu dia a dia em {cityName}
                </motion.p>
            </motion.div>

            {/* Login Form */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex-1 px-6"
            >
                <Card className="p-6 shadow-xl border-0 bg-background/80 backdrop-blur-xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="text-center mb-4">
                            <h2 className="text-xl font-semibold">Bem-vindo de volta!</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Digite seu telefone e senha para entrar
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Telefone (WhatsApp)</Label>
                                <PhoneInput
                                    value={phone}
                                    onChange={setPhone}
                                    error={undefined} // Error shown globally
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Senha</Label>
                                    <Link
                                        to="/esqueci-senha"
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Esqueceu a senha?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10"
                                        placeholder="Sua senha"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Error message */}
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

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            size="lg"
                            disabled={!isFormValid || isLoading}
                            className={cn(
                                'w-full h-14 text-lg font-semibold rounded-2xl',
                                'bg-gradient-to-r from-primary to-primary/80',
                                'shadow-lg shadow-primary/30',
                                isFormValid && 'hover:shadow-xl hover:shadow-primary/40'
                            )}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                <>
                                    <LogIn className="h-5 w-5 mr-2" />
                                    Entrar
                                </>
                            )}
                        </Button>

                        {/* Register Link */}
                        <div className="text-center pt-2">
                            <p className="text-sm text-muted-foreground">
                                Ainda não tem conta?{' '}
                                <Link
                                    to="/cadastro"
                                    className="text-primary font-semibold hover:underline"
                                >
                                    Criar conta
                                </Link>
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">ou</span>
                            </div>
                        </div>

                        {/* WhatsApp Login Link */}
                        <Link
                            to="/login/otp"
                            state={isPhoneValid ? { phone: cleanPhone(phone) } : undefined}
                            className={cn(
                                'flex items-center justify-center gap-2 w-full h-12 rounded-2xl font-semibold',
                                'bg-gradient-to-r from-green-500 to-green-600 text-white',
                                'shadow-lg shadow-green-500/30',
                                'hover:shadow-xl hover:shadow-green-500/40 transition-all'
                            )}
                        >
                            <MessageCircle className="h-5 w-5" />
                            Entrar via WhatsApp
                        </Link>
                    </form>
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
                        <Users className="h-5 w-5 text-primary" />
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
