/**
 * LoginPromptSheet - Modal sheet to prompt user to login/register
 * Used when non-authenticated users try to perform auth-required actions
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, X, MessageCircle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';

interface LoginPromptSheetProps {
    open: boolean;
    onClose: () => void;
    action?: 'comment' | 'like' | 'general';
}

export function LoginPromptSheet({ open, onClose, action = 'general' }: LoginPromptSheetProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const returnTo = encodeURIComponent(location.pathname + location.search);

    const getTitle = () => {
        switch (action) {
            case 'comment':
                return 'Faça login para comentar';
            case 'like':
                return 'Faça login para curtir';
            default:
                return 'Faça login para continuar';
        }
    };

    const getDescription = () => {
        switch (action) {
            case 'comment':
                return 'Crie uma conta ou faça login para participar da conversa e compartilhar sua opinião.';
            case 'like':
                return 'Crie uma conta ou faça login para curtir e interagir com os comentários.';
            default:
                return 'Crie uma conta ou faça login para acessar todas as funcionalidades.';
        }
    };

    const getIcon = () => {
        switch (action) {
            case 'comment':
                return <MessageCircle className="w-12 h-12 text-primary" />;
            case 'like':
                return <Heart className="w-12 h-12 text-red-500" />;
            default:
                return <LogIn className="w-12 h-12 text-primary" />;
        }
    };

    const handleLogin = () => {
        onClose();
        navigate(`/login?returnTo=${returnTo}`);
    };

    const handleRegister = () => {
        onClose();
        navigate(`/cadastro?returnTo=${returnTo}`);
    };

    return (
        <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <SheetContent side="bottom" className="rounded-t-3xl">
                <SheetHeader className="text-center pb-4">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mx-auto mb-4"
                    >
                        {getIcon()}
                    </motion.div>
                    <SheetTitle className="text-xl">{getTitle()}</SheetTitle>
                    <SheetDescription className="text-sm">
                        {getDescription()}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-3 pt-4 pb-8">
                    <Button
                        onClick={handleLogin}
                        size="lg"
                        className="w-full gap-2 h-12 text-base"
                    >
                        <LogIn className="w-5 h-5" />
                        Entrar na minha conta
                    </Button>

                    <Button
                        onClick={handleRegister}
                        variant="outline"
                        size="lg"
                        className="w-full gap-2 h-12 text-base"
                    >
                        <UserPlus className="w-5 h-5" />
                        Criar conta gratuita
                    </Button>

                    <button
                        onClick={onClose}
                        className="text-sm text-muted-foreground hover:text-foreground mt-2"
                    >
                        Talvez depois
                    </button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

export default LoginPromptSheet;
