import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown, X } from 'lucide-react';
import { VoteType } from '@/types/votes';
import { cn } from '@/lib/utils';

export type SortOption = 'relevance' | 'alphabetical';
export type VoteFilter = 'all' | VoteType;

interface VoteFiltersBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedParty: string;
    onPartyChange: (party: string) => void;
    selectedVote: VoteFilter;
    onVoteChange: (vote: VoteFilter) => void;
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
    availableParties: string[];
    className?: string;
}

const VOTE_TABS: { value: VoteFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'SIM', label: 'Sim' },
    { value: 'NAO', label: 'Não' },
    { value: 'ABSTENCAO', label: 'Abstenção' },
    { value: 'NAO_VOTOU', label: 'Ausente' },
];

export function VoteFiltersBar({
    searchQuery,
    onSearchChange,
    selectedParty,
    onPartyChange,
    selectedVote,
    onVoteChange,
    sortBy,
    onSortChange,
    availableParties,
    className,
}: VoteFiltersBarProps) {
    const [isPartyOpen, setIsPartyOpen] = useState(false);

    return (
        <div className={cn('flex flex-col gap-3', className)}>
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Buscar vereador..."
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
            </div>

            {/* Filters Row */}
            <div className="flex gap-2">
                {/* Party Dropdown */}
                <div className="relative flex-1">
                    <button
                        onClick={() => setIsPartyOpen(!isPartyOpen)}
                        className={cn(
                            'w-full h-10 px-3 rounded-lg border bg-card',
                            'flex items-center justify-between gap-2',
                            'text-sm font-medium transition-colors',
                            selectedParty !== 'all' && 'border-primary/30 bg-primary/5'
                        )}
                    >
                        <span className="truncate">
                            {selectedParty === 'all' ? 'Todos os Partidos' : selectedParty}
                        </span>
                        <ChevronDown className={cn(
                            'w-4 h-4 text-muted-foreground transition-transform',
                            isPartyOpen && 'rotate-180'
                        )} />
                    </button>

                    {isPartyOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsPartyOpen(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 right-0 mt-1 p-1 rounded-lg border bg-card shadow-lg z-20 max-h-48 overflow-auto"
                            >
                                <button
                                    onClick={() => {
                                        onPartyChange('all');
                                        setIsPartyOpen(false);
                                    }}
                                    className={cn(
                                        'w-full px-3 py-2 text-left text-sm rounded-md transition-colors',
                                        selectedParty === 'all' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                                    )}
                                >
                                    Todos os Partidos
                                </button>
                                {availableParties.map((party) => (
                                    <button
                                        key={party}
                                        onClick={() => {
                                            onPartyChange(party);
                                            setIsPartyOpen(false);
                                        }}
                                        className={cn(
                                            'w-full px-3 py-2 text-left text-sm rounded-md transition-colors',
                                            selectedParty === party ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                                        )}
                                    >
                                        {party}
                                    </button>
                                ))}
                            </motion.div>
                        </>
                    )}
                </div>

                {/* Sort Toggle */}
                <button
                    onClick={() => onSortChange(sortBy === 'relevance' ? 'alphabetical' : 'relevance')}
                    className={cn(
                        'h-10 px-3 rounded-lg border bg-card',
                        'text-xs font-medium transition-colors whitespace-nowrap',
                        'hover:bg-muted'
                    )}
                >
                    {sortBy === 'relevance' ? 'A-Z' : '⭐'}
                </button>
            </div>

            {/* Vote Type Segmented Control */}
            <div className="flex p-1 bg-muted rounded-xl">
                {VOTE_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => onVoteChange(tab.value)}
                        className={cn(
                            'relative flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-200',
                            selectedVote === tab.value
                                ? 'text-foreground'
                                : 'text-muted-foreground hover:text-foreground/70'
                        )}
                    >
                        {selectedVote === tab.value && (
                            <motion.div
                                layoutId="vote-tab-indicator"
                                className="absolute inset-0 bg-card rounded-lg shadow-sm"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
