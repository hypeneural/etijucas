import { motion } from 'framer-motion';
import { useTenantNavigate } from '@/hooks';
import { MessageCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface LoginRequiredProps {
    title?: string;
    message?: string;
    returnUrl?: string;
    /** Custom action label e.g. "Entre para denunciar" */
    actionLabel?: string;
}

export function LoginRequired({
    title = 'Entre para continuar',
    message = 'Você precisa estar logado para acessar esta funcionalidade.',
    returnUrl,
    actionLabel,
}: LoginRequiredProps) {
    const navigate = useTenantNavigate();

    const handleWhatsAppLogin = () => {
        // Store return URL for after login
        if (returnUrl) {
            sessionStorage.setItem('returnUrl', returnUrl);
        }
        navigate('/auth');
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
                        className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6"
                    >
                        <Lock className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </motion.div>

                    <h1 className="text-2xl font-bold mb-2">
                        {actionLabel || title}
                    </h1>
                    <p className="text-muted-foreground mb-8">
                        {message}
                    </p>

                    <Button
                        size="lg"
                        className="w-full h-14 rounded-xl text-base bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleWhatsAppLogin}
                    >
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Entrar com WhatsApp
                    </Button>

                    <p className="text-xs text-muted-foreground mt-6">
                        Login rápido e seguro usando seu número de WhatsApp.
                    </p>
                </Card>
            </motion.div>
        </div>
    );
}
