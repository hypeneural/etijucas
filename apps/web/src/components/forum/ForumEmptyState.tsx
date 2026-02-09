// ======================================================
// ForumEmptyState - Empty, error, and offline states
// ======================================================

import { motion } from 'framer-motion';
import { MessageSquarePlus, WifiOff, AlertCircle, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type EmptyStateType = 'empty' | 'no-results' | 'offline' | 'error';

interface ForumEmptyStateProps {
    type: EmptyStateType;
    onAction?: () => void;
    onClearFilters?: () => void;
}

const stateConfig = {
    empty: {
        icon: MessageSquarePlus,
        title: 'Nenhuma observação ainda',
        description: 'Seja o primeiro a abrir um assunto na comunidade!',
        actionLabel: 'Criar observação',
        iconColor: 'text-primary',
    },
    'no-results': {
        icon: Search,
        title: 'Sem resultados',
        description: 'Tente outro termo ou remova alguns filtros.',
        actionLabel: 'Limpar filtros',
        iconColor: 'text-muted-foreground',
    },
    offline: {
        icon: WifiOff,
        title: 'Você está offline',
        description: 'Mostrando observações salvas. Conecte-se para ver novidades.',
        actionLabel: 'Tentar novamente',
        iconColor: 'text-orange-500',
    },
    error: {
        icon: AlertCircle,
        title: 'Algo deu errado',
        description: 'Não foi possível carregar as observações. Tente novamente.',
        actionLabel: 'Tentar novamente',
        iconColor: 'text-red-500',
    },
};

export function ForumEmptyState({ type, onAction, onClearFilters }: ForumEmptyStateProps) {
    const config = stateConfig[type];
    const Icon = config.icon;

    const handleAction = () => {
        if (type === 'no-results' && onClearFilters) {
            onClearFilters();
        } else {
            onAction?.();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-6 text-center"
        >
            <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className={`w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 ${config.iconColor}`}
            >
                <Icon className="w-8 h-8" />
            </motion.div>

            <h3 className="text-lg font-semibold text-foreground mb-2">
                {config.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-[260px]">
                {config.description}
            </p>

            {onAction && (
                <Button
                    onClick={handleAction}
                    variant={type === 'empty' ? 'default' : 'outline'}
                    className="min-h-[44px] px-6 rounded-full"
                >
                    {type === 'error' || type === 'offline' ? (
                        <RefreshCw className="w-4 h-4 mr-2" />
                    ) : null}
                    {config.actionLabel}
                </Button>
            )}
        </motion.div>
    );
}

export default ForumEmptyState;
