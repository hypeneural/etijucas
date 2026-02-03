import { motion } from 'framer-motion';
import { Search, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    type?: 'no-results' | 'no-data';
    message?: string;
    className?: string;
}

export function EmptyState({
    type = 'no-results',
    message,
    className
}: EmptyStateProps) {
    const isNoResults = type === 'no-results';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'flex flex-col items-center justify-center py-12 px-6 text-center',
                className
            )}
        >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                {isNoResults ? (
                    <Search className="w-7 h-7 text-muted-foreground" />
                ) : (
                    <Users className="w-7 h-7 text-muted-foreground" />
                )}
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
                {isNoResults ? 'Nenhum resultado' : 'Sem dados'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-[260px]">
                {message || (isNoResults
                    ? 'Nenhum vereador encontrado com os filtros selecionados.'
                    : 'Não há dados de votação disponíveis no momento.'
                )}
            </p>
        </motion.div>
    );
}
