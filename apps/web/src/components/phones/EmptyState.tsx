// ======================================================
// EmptyState - Empty and error states for phone list
// ======================================================

import { motion } from 'framer-motion';
import { Search, Phone, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    variant: 'no-results' | 'no-favorites' | 'error' | 'offline';
    searchQuery?: string;
    onClearFilters?: () => void;
    onRetry?: () => void;
}

export function EmptyState({ variant, searchQuery, onClearFilters, onRetry }: EmptyStateProps) {
    const content = {
        'no-results': {
            icon: Search,
            title: 'Nenhum resultado',
            description: searchQuery
                ? `Nenhum contato encontrado para "${searchQuery}"`
                : 'Nenhum contato corresponde aos filtros selecionados',
            action: onClearFilters && {
                label: 'Limpar filtros',
                onClick: onClearFilters,
            },
        },
        'no-favorites': {
            icon: Phone,
            title: 'Sem favoritos',
            description: 'Toque no menu ⋮ de um contato e adicione aos favoritos',
            action: undefined,
        },
        'error': {
            icon: WifiOff,
            title: 'Erro ao carregar',
            description: 'Não foi possível carregar os contatos',
            action: onRetry && {
                label: 'Tentar novamente',
                onClick: onRetry,
                icon: RefreshCw,
            },
        },
        'offline': {
            icon: WifiOff,
            title: 'Sem conexão',
            description: 'Verifique sua internet e tente novamente',
            action: onRetry && {
                label: 'Tentar novamente',
                onClick: onRetry,
                icon: RefreshCw,
            },
        },
    };

    const { icon: Icon, title, description, action } = content[variant];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-6 text-center"
        >
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-muted-foreground" />
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-1">
                {title}
            </h3>

            <p className="text-sm text-muted-foreground max-w-[250px]">
                {description}
            </p>

            {action && (
                <Button
                    variant="outline"
                    onClick={action.onClick}
                    className="mt-4"
                >
                    {'icon' in action && action.icon && <action.icon className="w-4 h-4 mr-2" />}
                    {action.label}
                </Button>
            )}
        </motion.div>
    );
}
