import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Users, Filter, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { BottomTabBar, TabId } from '@/components/layout/BottomTabBar';
import { useAppStore } from '@/store/useAppStore';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/api/config';

// Services
import { vereadoresService, votesReferenceService } from '@/services/votes.service';

// Types
import type { VereadorList, Partido } from '@/types/votes';

export default function VereadoresListPage() {
    const navigate = useNavigate();
    const { activeTab, setActiveTab } = useAppStore();

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPartido, setSelectedPartido] = useState<string>('all');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Fetch vereadores
    const { data: vereadores, isLoading: loadingVereadores } = useQuery({
        queryKey: QUERY_KEYS.votes.vereadores({
            partido: selectedPartido !== 'all' ? selectedPartido : undefined,
            search: searchQuery || undefined,
        }),
        queryFn: () =>
            vereadoresService.getAll({
                partido: selectedPartido !== 'all' ? selectedPartido : undefined,
                search: searchQuery || undefined,
            }),
        staleTime: 10 * 60 * 1000, // 10 minutes
    });

    // Fetch partidos for filter
    const { data: partidos } = useQuery({
        queryKey: QUERY_KEYS.votes.partidos,
        queryFn: () => votesReferenceService.getPartidos(),
        staleTime: 60 * 60 * 1000, // 1 hour
    });

    const isLoading = loadingVereadores;

    // Filter vereadores by local search (additional to API filter)
    const filteredVereadores = useMemo(() => {
        if (!vereadores) return [];

        let result = [...vereadores];

        // Local search filtering (in case API doesn't filter)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter((v) => v.nome.toLowerCase().includes(query));
        }

        // Sort alphabetically
        result.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

        return result;
    }, [vereadores, searchQuery]);

    const handleClearFilters = () => {
        setSearchQuery('');
        setSelectedPartido('all');
    };

    const handleTabChange = (tab: TabId) => {
        setActiveTab(tab);
        navigate('/');
    };

    const hasActiveFilters = searchQuery || selectedPartido !== 'all';

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
                            <h1 className="text-lg font-bold">Vereadores</h1>
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
                    <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-xl border-b px-4 py-3 space-y-3">
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
                                            placeholder="Buscar vereador..."
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

                        {/* Party Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <Select value={selectedPartido} onValueChange={setSelectedPartido}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Filtrar por partido" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os partidos</SelectItem>
                                    {partidos?.map((partido: Partido) => (
                                        <SelectItem key={partido.id} value={partido.sigla}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: partido.corHex }}
                                                />
                                                {partido.sigla} - {partido.nome}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Main Content */}
                    <main className="px-4 py-5">
                        {/* Results count */}
                        {!isLoading && filteredVereadores.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-between mb-4"
                            >
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    {filteredVereadores.length}{' '}
                                    {filteredVereadores.length === 1 ? 'vereador' : 'vereadores'}
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
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Carregando vereadores...</p>
                            </div>
                        )}

                        {/* Empty State */}
                        {!isLoading && filteredVereadores.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                    <Users className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">
                                        Nenhum vereador encontrado
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Tente ajustar os filtros de busca
                                    </p>
                                </div>
                                {hasActiveFilters && (
                                    <Button variant="outline" size="sm" onClick={handleClearFilters}>
                                        Limpar filtros
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Vereadores Grid */}
                        {!isLoading && filteredVereadores.length > 0 && (
                            <AnimatePresence mode="popLayout">
                                <motion.div layout className="grid grid-cols-2 gap-3 pb-8">
                                    {filteredVereadores.map((vereador: VereadorList, index: number) => (
                                        <VereadorCard
                                            key={vereador.id}
                                            vereador={vereador}
                                            index={index}
                                            onClick={() => navigate(`/vereadores/${vereador.slug}`)}
                                        />
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

// ==========================================
// Vereador Card Component
// ==========================================

interface VereadorCardProps {
    vereador: VereadorList;
    index: number;
    onClick: () => void;
}

function VereadorCard({ vereador, index, onClick }: VereadorCardProps) {
    const initials = vereador.nome
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.03 }}
        >
            <Card
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
                onClick={onClick}
            >
                <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                    <Avatar className="w-16 h-16 border-2 border-muted">
                        <AvatarImage src={vereador.fotoUrl || ''} alt={vereador.nome} />
                        <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1.5">
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                            {vereador.nome}
                        </h3>

                        {vereador.partido && (
                            <Badge
                                variant="secondary"
                                className="text-xs px-2 py-0.5"
                                style={{
                                    backgroundColor: `${vereador.partido.corHex}20`,
                                    borderColor: vereador.partido.corHex,
                                    color: vereador.partido.corHex,
                                }}
                            >
                                {vereador.partido.sigla}
                            </Badge>
                        )}

                        {!vereador.emExercicio && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
                                Licenciado
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
