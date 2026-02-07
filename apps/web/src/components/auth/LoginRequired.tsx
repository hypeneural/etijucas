import { motion } from 'framer-motion';
import { useTenantNavigate } from '@/hooks';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface LoginRequiredProps {
    title?: string;
    message?: string;
    returnUrl?: string;
}

export function LoginRequired({
    title = 'Login necessário',
    message = 'Você precisa estar logado para acessar esta funcionalidade.',
    returnUrl,
}: LoginRequiredProps) {
    const navigate = useTenantNavigate();

    const handleLogin = () => {
        // Store return URL for after login
        if (returnUrl) {
            sessionStorage.setItem('returnUrl', returnUrl);
        }
        navigate('/login');
    };

    const handleRegister = () => {
        if (returnUrl) {
            sessionStorage.setItem('returnUrl', returnUrl);
        }
        navigate('/register');
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <Card className="p-8 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.1 }}
                        className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-6"
                    >
                        <AlertCircle className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                    </motion.div>

                    <h1 className="text-2xl font-bold mb-2">{title}</h1>
                    <p className="text-muted-foreground mb-8">
                        {message}
                    </p>

                    <div className="space-y-3">
                        <Button
                            size="lg"
                            className="w-full h-14 rounded-xl text-base"
                            onClick={handleLogin}
                        >
                            <LogIn className="h-5 w-5 mr-2" />
                            Entrar
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="w-full h-14 rounded-xl text-base"
                            onClick={handleRegister}
                        >
                            <UserPlus className="h-5 w-5 mr-2" />
                            Criar conta
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground mt-6">
                        Ao fazer login, você poderá acompanhar suas denúncias e receber atualizações.
                    </p>
                </Card>
            </motion.div>
        </div>
    );
}
