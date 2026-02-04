import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BottomTabBar, TabId } from '@/components/layout/BottomTabBar';
import { useAppStore } from '@/store/useAppStore';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/api/config';

// Votes components
import {
    VoteListCard,
    VotesFiltersBar,
    EmptyListState,
    VoteListSkeleton,
    type StatusFilter,
    type YearFilter,
} from '@/components/votes';

// Service
import { votacoesService } from '@/services/votes.service';

// Types
import type { VotacaoList, VoteStatus } from '@/types/votes';

export default function VotesListPage() {
    const navigate = useNavigate();
    const { activeTab, setActiveTab } = useAppStore();

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [yearFilter, setYearFilter] = useState<YearFilter>('all');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Fetch votações from API
    const {
        data: votacoesResponse,
        isLoading,
        error,
    } = useQuery({
        queryKey: QUERY_KEYS.votes.votacoes({
            status: statusFilter !== 'all' ? statusFilter : undefined,
            ano: yearFilter !== 'all' ? yearFilter : undefined,
            search: searchQuery || undefined,
        }),
        queryFn: () =>
            votacoesService.getAll({
                status: statusFilter !== 'all' ? (statusFilter as VoteStatus) : undefined,
                ano: yearFilter !== 'all' ? yearFilter : undefined,
                search: searchQuery || undefined,
                perPage: 50,
            }),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Fetch available years
    const { data: availableYearsData } = useQuery({
        queryKey: QUERY_KEYS.votes.anos,
        queryFn: () => votacoesService.getAnos(),
        staleTime: 60 * 60 * 1000, // 1 hour
    });

    const votacoes = votacoesResponse?.data || [];
    const availableYears = availableYearsData || [];

    // Transform API data to match component expectations
    const filteredVotes = useMemo(() => {
        return votacoes.map((v) => ({
            id: v.id,
            status: v.status,
            date: v.data,
            title: v.titulo,
            summary: v.subtitulo || '',
            counts: v.counts,
            tags: v.tags,
        }));
    }, [votacoes]);

    const handleClearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setYearFilter('all');
        setIsSearchOpen(false);
    };

    const handleTabChange = (tab: TabId) => {
        setActiveTab(tab);
        navigate('/');
    };

    const hasActiveFilters = searchQuery || statusFilter !== 'all' || yearFilter !== 'all';

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-muted/50">
            <div className="relative w-full max-w-[420px] h-full bg-background overflow-hidden shadow-elevated">
                <div className="h-full overflow-y-auto pb-24">
                    {/* Header */}
                    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b">
                        <div className="flex items-center justify-between px-4 py-3 safe-top">
                            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <h1 className="text-lg font-bold">Votações da Câmara</h1>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className={cn(isSearchOpen && 'bg-primary/10 text-primary')}
                            >
                                <Search className="h-5 w-5" />
                            </Button>
                        </div>
                    </header>

                    {/* Filters Section */}
                    <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-xl border-b px-4 py-3">
                        <VotesFiltersBar
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            statusFilter={statusFilter}
                            onStatusChange={setStatusFilter}
                            yearFilter={yearFilter}
                            onYearChange={setYearFilter}
                            availableYears={availableYears}
                            isSearchOpen={isSearchOpen}
                            onSearchToggle={() => setIsSearchOpen(!isSearchOpen)}
                        />
                    </div>

                    {/* Main Content */}
                    <main className="px-4 py-5">
                        {/* Results count */}
                        {!isLoading && filteredVotes.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-between mb-4"
                            >
                                <span className="text-sm text-muted-foreground">
                                    {filteredVotes.length} {filteredVotes.length === 1 ? 'votação' : 'votações'}
                                </span>
                                {hasActiveFilters && (
                                    <button
                                        onClick={handleClearFilters}
                                        className="text-sm text-primary font-medium"
                                    >
                                        Limpar filtros
                                    </button>
                                )}
                            </motion.div>
                        )}

                        {/* Loading State */}
                        {isLoading && <VoteListSkeleton />}

                        {/* Error State */}
                        {error && (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">Erro ao carregar votações</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-4"
                                    onClick={() => window.location.reload()}
                                >
                                    Tentar novamente
                                </Button>
                            </div>
                        )}

                        {/* Empty State */}
                        {!isLoading && !error && filteredVotes.length === 0 && (
                            <EmptyListState
                                type="no-results"
                                onClearFilters={hasActiveFilters ? handleClearFilters : undefined}
                            />
                        )}

                        {/* Votes List */}
                        {!isLoading && !error && filteredVotes.length > 0 && (
                            <AnimatePresence mode="popLayout">
                                <motion.div layout className="space-y-4 pb-8">
                                    {filteredVotes.map((vote, index) => (
                                        <VoteListCard key={vote.id} vote={vote} index={index} />
                                    ))}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </main>
                </div>

                {/* Bottom Tab Bar */}
                <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
        </div>
    );
}
