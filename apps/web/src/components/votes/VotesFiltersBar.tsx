import { motion } from 'framer-motion';
import { Search, X, RefreshCw, WifiOff } from 'lucide-react';
import { VoteStatus, VOTE_STATUS_CONFIG } from '@/types/votes';
import { cn } from '@/lib/utils';

export type StatusFilter = 'all' | VoteStatus;
export type YearFilter = 'all' | number;

interface VotesFiltersBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    statusFilter: StatusFilter;
    onStatusChange: (status: StatusFilter) => void;
    yearFilter: YearFilter;
    onYearChange: (year: YearFilter) => void;
    availableYears: number[];
    isSearchOpen: boolean;
    onSearchToggle: () => void;
    className?: string;
}

const STATUS_CHIPS: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'APROVADO', label: 'Aprovados' },
    { value: 'REJEITADO', label: 'Rejeitados' },
];

export function VotesFiltersBar({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    yearFilter,
    onYearChange,
    availableYears,
    isSearchOpen,
    onSearchToggle,
    className,
}: VotesFiltersBarProps) {
    return (
        <div className={cn('space-y-3', className)}>
            {/* Search Bar (Expandable) */}
            {isSearchOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative"
                >
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Buscar por título, número ou tema..."
                        autoFocus
                        className={cn(
                            'w-full h-11 pl-10 pr-10 rounded-xl border bg-card',
                            'text-sm placeholder:text-muted-foreground',
                            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                            'transition-all duration-200'
                        )}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
                        >
                            <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                    )}
                </motion.div>
            )}

            {/* Chips Row */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
                {/* Status Chips */}
                {STATUS_CHIPS.map((chip) => {
                    const isActive = statusFilter === chip.value;
                    const config = chip.value !== 'all' ? VOTE_STATUS_CONFIG[chip.value] : null;

                    return (
                        <motion.button
                            key={chip.value}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onStatusChange(chip.value)}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap',
                                'border transition-all duration-200',
                                isActive
                                    ? config
                                        ? cn(config.bgColor, config.textColor, config.borderColor)
                                        : 'bg-primary text-primary-foreground border-primary shadow-sm'
                                    : 'bg-card border-border text-muted-foreground hover:bg-muted'
                            )}
                        >
                            {chip.label}
                        </motion.button>
                    );
                })}

                {/* Divider */}
                <div className="w-px h-8 bg-border shrink-0 self-center" />

                {/* Year Chips */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onYearChange('all')}
                    className={cn(
                        'px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap',
                        'border transition-all duration-200',
                        yearFilter === 'all'
                            ? 'bg-primary/10 text-primary border-primary/30'
                            : 'bg-card border-border text-muted-foreground hover:bg-muted'
                    )}
                >
                    Todos Anos
                </motion.button>

                {availableYears.map((year) => (
                    <motion.button
                        key={year}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onYearChange(year)}
                        className={cn(
                            'px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap',
                            'border transition-all duration-200',
                            yearFilter === year
                                ? 'bg-primary/10 text-primary border-primary/30'
                                : 'bg-card border-border text-muted-foreground hover:bg-muted'
                        )}
                    >
                        {year}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}

// Empty State Component
interface EmptyListStateProps {
    type: 'no-results' | 'error' | 'offline';
    onRetry?: () => void;
    onClearFilters?: () => void;
}

export function EmptyListState({ type, onRetry, onClearFilters }: EmptyListStateProps) {
    const config = {
        'no-results': {
            icon: Search,
            title: 'Nenhuma votação encontrada',
            description: 'Tente ajustar os filtros ou buscar por outro termo.',
            action: onClearFilters ? { label: 'Limpar filtros', onClick: onClearFilters } : undefined,
        },
        error: {
            icon: RefreshCw,
            title: 'Erro ao carregar',
            description: 'Não foi possível carregar as votações.',
            action: onRetry ? { label: 'Tentar novamente', onClick: onRetry } : undefined,
        },
        offline: {
            icon: WifiOff,
            title: 'Você está offline',
            description: 'Mostrando dados salvos no seu dispositivo.',
            action: undefined,
        },
    }[type];

    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-6 text-center"
        >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Icon className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
                {config.title}
            </h3>
            <p className="text-sm text-muted-foreground max-w-[280px] mb-4">
                {config.description}
            </p>
            {config.action && (
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={config.action.onClick}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                >
                    {config.action.label}
                </motion.button>
            )}
        </motion.div>
    );
}

// Skeleton Component
export function VoteListSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl p-4 border">
                    <div className="flex items-center justify-between mb-3">
                        <div className="h-4 w-20 bg-muted rounded" />
                        <div className="h-5 w-16 bg-muted rounded-full" />
                    </div>
                    <div className="h-6 w-3/4 bg-muted rounded mb-2" />
                    <div className="h-4 w-full bg-muted rounded mb-1" />
                    <div className="h-4 w-2/3 bg-muted rounded mb-4" />
                    <div className="flex gap-4 mb-3">
                        <div className="h-6 w-12 bg-muted rounded" />
                        <div className="h-6 w-12 bg-muted rounded" />
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full" />
                </div>
            ))}
        </div>
    );
}
