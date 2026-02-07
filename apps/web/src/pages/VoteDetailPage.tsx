import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTenantNavigate } from '@/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Share2, CheckCircle, Calendar, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { BottomTabBar, TabId } from '@/components/layout/BottomTabBar';
import { useAppStore } from '@/store/useAppStore';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/api/config';

// Votes components
import {
    VoteSummaryCards,
    VoteScoreboard,
    VoteFiltersBar,
    CouncilorVoteCard,
    CouncilorDetailSheet,
    EmptyState,
    SourceFooter,
    VotacaoComments,
    type SortOption,
    type VoteFilter,
} from '@/components/votes';

// Service
import { votacoesService } from '@/services/votes.service';

// Types
import type { VoteType, VotoRegistro, VotacaoFull } from '@/types/votes';
import { VOTE_ORDER } from '@/types/votes';

// Adapter to convert API data to component format
function adaptVotoToCouncilor(voto: VotoRegistro) {
    return {
        id: voto.vereador.id,
        name: voto.vereador.nome,
        party: voto.vereador.partido?.sigla || '???',
        vote: voto.voto,
        photoUrl: voto.vereador.fotoUrl || '',
        justification: voto.justificativa,
        videoUrl: voto.urlVideo,
    };
}

export default function VoteDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useTenantNavigate();
    const { toast } = useToast();
    const { activeTab, setActiveTab } = useAppStore();

    // Filter/Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedParty, setSelectedParty] = useState('all');
    const [selectedVote, setSelectedVote] = useState<VoteFilter>('all');
    const [sortBy, setSortBy] = useState<SortOption>('relevance');

    // Sheet state
    const [selectedCouncilorData, setSelectedCouncilorData] = useState<ReturnType<typeof adaptVotoToCouncilor> | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Fetch votação details
    const { data: votacao, isLoading, error } = useQuery({
        queryKey: QUERY_KEYS.votes.votacao(id || ''),
        queryFn: () => votacoesService.getById(id!),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });

    // Derive available parties
    const availableParties = useMemo(() => {
        if (!votacao?.votos) return [];
        const parties = new Set(
            votacao.votos
                .map((v) => v.vereador.partido?.sigla)
                .filter((p): p is string => !!p && p !== '???')
        );
        return Array.from(parties).sort();
    }, [votacao]);

    // Adapt councilors from API data
    const councilors = useMemo(() => {
        if (!votacao?.votos) return [];
        return votacao.votos.map(adaptVotoToCouncilor);
    }, [votacao]);

    // Determine vote status
    const voteStatus = votacao ? (votacao.counts.sim > votacao.counts.nao ? 'approved' : 'rejected') : 'approved';

    // Filter and sort councilors
    const filteredCouncilors = useMemo(() => {
        let result = [...councilors];

        // Filter by search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter((c) => c.name.toLowerCase().includes(query));
        }

        // Filter by party
        if (selectedParty !== 'all') {
            result = result.filter((c) => c.party === selectedParty);
        }

        // Filter by vote type
        if (selectedVote !== 'all') {
            result = result.filter((c) => c.vote === selectedVote);
        }

        // Sort
        if (sortBy === 'alphabetical') {
            result.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        } else {
            // Relevance: SIM/NAO first, then ABSTENCAO, then NAO_VOTOU
            result.sort((a, b) => VOTE_ORDER[a.vote as VoteType] - VOTE_ORDER[b.vote as VoteType]);
        }

        return result;
    }, [councilors, searchQuery, selectedParty, selectedVote, sortBy]);

    const handleShare = async () => {
        if (!votacao) return;

        const shareData = {
            title: votacao.titulo,
            text: `${votacao.titulo} • ${votacao.subtitulo || ''}`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch { }
        } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareData.url);
            toast({ title: 'Link copiado!', description: 'Cole onde quiser compartilhar.' });
        }
    };

    const handleCouncilorClick = (councilor: ReturnType<typeof adaptVotoToCouncilor>) => {
        setSelectedCouncilorData(councilor);
        setIsSheetOpen(true);
    };

    const handleTabChange = (tab: TabId) => {
        setActiveTab(tab);
        navigate('/');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-muted/50">
                <div className="relative w-full max-w-[420px] h-full bg-background flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    // Error state
    if (error || !votacao) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-muted/50">
                <div className="relative w-full max-w-[420px] h-full bg-background flex flex-col items-center justify-center gap-4 p-6">
                    <p className="text-muted-foreground text-center">
                        Não foi possível carregar os detalhes da votação
                    </p>
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        Voltar
                    </Button>
                </div>
            </div>
        );
    }

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
                            <h1 className="text-lg font-bold">Detalhes da Votação</h1>
                            <Button variant="ghost" size="icon" onClick={handleShare}>
                                <Share2 className="h-5 w-5" />
                            </Button>
                        </div>
                    </header>

                    <main className="px-4 py-5 space-y-6">
                        {/* Hero Section */}
                        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <Card className="rounded-2xl p-5 bg-gradient-to-br from-card to-muted/30 border shadow-card overflow-hidden relative">
                                {/* Status accent bar */}
                                <div
                                    className={cn(
                                        'absolute top-0 left-0 right-0 h-1',
                                        voteStatus === 'approved' ? 'bg-green-500' : 'bg-red-500'
                                    )}
                                />

                                {/* Status & Date */}
                                <div className="flex items-center justify-between mb-4 pt-1">
                                    <Badge
                                        className={cn(
                                            'gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider',
                                            voteStatus === 'approved'
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                                        )}
                                    >
                                        {voteStatus === 'approved' ? (
                                            <CheckCircle className="w-3.5 h-3.5" />
                                        ) : (
                                            <XCircle className="w-3.5 h-3.5" />
                                        )}
                                        {voteStatus === 'approved' ? 'Aprovado' : 'Rejeitado'}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {formatDate(votacao.data)}
                                    </span>
                                </div>

                                {/* Title & Description */}
                                <motion.h2
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-2xl font-bold text-foreground leading-tight mb-2"
                                >
                                    {votacao.titulo}
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-sm text-muted-foreground leading-relaxed mb-5"
                                >
                                    {votacao.descricao}
                                </motion.p>

                                {/* Divider */}
                                <div className="h-px w-full bg-border mb-5" />

                                {/* Scoreboard */}
                                <VoteScoreboard counts={votacao.counts} status={voteStatus} />
                            </Card>
                        </motion.section>

                        {/* Vote Summary Cards */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <VoteSummaryCards counts={votacao.counts} />
                        </motion.section>

                        {/* Filters Section */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="sticky top-14 z-30 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-xl border-y"
                        >
                            <VoteFiltersBar
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                                selectedParty={selectedParty}
                                onPartyChange={setSelectedParty}
                                selectedVote={selectedVote}
                                onVoteChange={setSelectedVote}
                                sortBy={sortBy}
                                onSortChange={setSortBy}
                                availableParties={availableParties}
                            />
                        </motion.section>

                        {/* Councilors List */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-foreground">
                                    Votos dos Vereadores
                                </h3>
                                <span className="text-sm text-muted-foreground font-medium">
                                    {filteredCouncilors.length} de {councilors.length}
                                </span>
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap gap-3 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                    <span className="text-muted-foreground">Sim</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <span className="text-muted-foreground">Não</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                                    <span className="text-muted-foreground">Abstenção</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                                    <span className="text-muted-foreground">Ausente</span>
                                </div>
                            </div>

                            <AnimatePresence mode="popLayout">
                                {filteredCouncilors.length === 0 ? (
                                    <EmptyState type="no-results" />
                                ) : (
                                    <motion.div layout className="space-y-3">
                                        {filteredCouncilors.map((councilor, index) => (
                                            <CouncilorVoteCard
                                                key={councilor.id}
                                                councilor={councilor}
                                                searchQuery={searchQuery}
                                                onClick={() => handleCouncilorClick(councilor)}
                                                index={index}
                                            />
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </section>

                        {/* Public Comments Section */}
                        <section className="px-4 py-4">
                            <VotacaoComments votacaoId={votacao.id} />
                        </section>

                        {/* Source Footer */}
                        {votacao.urlFonte && (
                            <SourceFooter
                                source={{
                                    label: 'Fonte oficial',
                                    url: votacao.urlFonte,
                                }}
                            />
                        )}
                    </main>
                </div>

                {/* Bottom Tab Bar */}
                <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />

                {/* Councilor Detail Sheet */}
                <CouncilorDetailSheet
                    councilor={selectedCouncilorData}
                    isOpen={isSheetOpen}
                    onClose={() => setIsSheetOpen(false)}
                    voteTitle={votacao.titulo}
                />
            </div>
        </div>
    );
}
