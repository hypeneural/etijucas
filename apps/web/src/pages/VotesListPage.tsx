import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Users, Calendar, Filter, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { BottomTabBar, TabId } from '@/components/layout/BottomTabBar';
import { useAppStore } from '@/store/useAppStore';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/api/config';

// Votes components
import {
    VoteListCard,
    EmptyListState,
    VoteListSkeleton,
} from '@/components/votes';

// Service
import { votacoesService } from '@/services/votes.service';

// Types
import type { VoteStatus } from '@/types/votes';

type ActiveTab = 'votacoes' | 'vereadores';
type StatusFilter = 'all' | VoteStatus;

export default function VotesListPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { activeTab: appTab, setActiveTab } = useAppStore();

    // Tab state
    const [activeSection, setActiveSection] = useState<ActiveTab>('votacoes');

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [yearFilter, setYearFilter] = useState<number | 'all'>('all');
    const [tipoFilter, setTipoFilter] = useState<string>('all');
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
        staleTime: 5 * 60 * 1000,
    });

    // Fetch available years
    const { data: availableYearsData } = useQuery({
        queryKey: QUERY_KEYS.votes.anos,
        queryFn: () => votacoesService.getAnos(),
        staleTime: 60 * 60 * 1000,
    });

    const votacoes = votacoesResponse?.data || [];
    const availableYears = availableYearsData || [2026, 2025];

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
        setTipoFilter('all');
        setIsSearchOpen(false);
    };

    const handleTabChange = (tab: TabId) => {
        setActiveTab(tab);
        navigate('/');
    };

    const hasActiveFilters = searchQuery || statusFilter !== 'all' || yearFilter !== 'all' || tipoFilter !== 'all';

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
                            <h1 className="text-lg font-bold">Câmara Municipal</h1>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className={cn(isSearchOpen && 'bg-primary/10 text-primary')}
                            >
                                <Search className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Section Tabs */}
                        <div className="px-4 pb-3">
                            <Tabs value={activeSection} onValueChange={(v) => {
                                if (v === 'vereadores') {
                                    navigate('/vereadores');
                                } else {
                                    setActiveSection(v as ActiveTab);
                                }
                            }}>
                                <TabsList className="w-full grid grid-cols-2">
                                    <TabsTrigger value="votacoes" className="gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Votações
                                    </TabsTrigger>
                                    <TabsTrigger value="vereadores" className="gap-2">
                                        <Users className="h-4 w-4" />
                                        Vereadores
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </header>

                    {/* Filters Section */}
                    <div className="sticky top-28 z-30 bg-background/95 backdrop-blur-xl border-b px-4 py-3 space-y-3">
                        {/* Search Input */}
                        <AnimatePresence>
                            {isSearchOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar votação..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 pr-10"
                                            autoFocus
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                            >
                                                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Filters Row */}
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />

                            {/* Status Filter */}
                            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                                <SelectTrigger className="flex-1 h-9 text-xs">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="APROVADO">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                            Aprovados
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="REJEITADO">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                            Rejeitados
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="EM_ANDAMENTO">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            Em Andamento
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Year Filter */}
                            <Select
                                value={yearFilter.toString()}
                                onValueChange={(v) => setYearFilter(v === 'all' ? 'all' : parseInt(v))}
                            >
                                <SelectTrigger className="w-24 h-9 text-xs">
                                    <SelectValue placeholder="Ano" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {availableYears.map((year) => (
                                        <SelectItem key={year} value={year.toString()}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Active Filters Tags */}
                        {hasActiveFilters && (
                            <div className="flex items-center gap-2 flex-wrap">
                                {statusFilter !== 'all' && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                        {statusFilter === 'APROVADO' && 'Aprovados'}
                                        {statusFilter === 'REJEITADO' && 'Rejeitados'}
                                        {statusFilter === 'EM_ANDAMENTO' && 'Em Andamento'}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => setStatusFilter('all')}
                                        />
                                    </Badge>
                                )}
                                {yearFilter !== 'all' && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                        {yearFilter}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => setYearFilter('all')}
                                        />
                                    </Badge>
                                )}
                                {searchQuery && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                        "{searchQuery}"
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => setSearchQuery('')}
                                        />
                                    </Badge>
                                )}
                                <button
                                    onClick={handleClearFilters}
                                    className="text-xs text-primary font-medium ml-auto"
                                >
                                    Limpar tudo
                                </button>
                            </div>
                        )}
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
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <Calendar className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <p className="font-medium text-foreground mb-1">
                                    Nenhuma votação encontrada
                                </p>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {hasActiveFilters
                                        ? 'Tente ajustar os filtros de busca'
                                        : 'As votações aparecerão aqui quando forem registradas'}
                                </p>
                                {hasActiveFilters && (
                                    <Button variant="outline" size="sm" onClick={handleClearFilters}>
                                        Limpar filtros
                                    </Button>
                                )}
                                <div className="mt-6 pt-6 border-t w-full">
                                    <Button
                                        variant="default"
                                        className="w-full gap-2"
                                        onClick={() => navigate('/vereadores')}
                                    >
                                        <Users className="h-4 w-4" />
                                        Ver Vereadores
                                    </Button>
                                </div>
                            </div>
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
                <BottomTabBar activeTab={appTab} onTabChange={handleTabChange} />
            </div>
        </div>
    );
}
