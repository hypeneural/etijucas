import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Users, Calendar, Filter, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

type ActiveTab = 'votacoes' | 'vereadores';

export default function VereadoresListPage() {
    const navigate = useNavigate();
    const { activeTab: appTab, setActiveTab } = useAppStore();

    // Tab state
    const [activeSection] = useState<ActiveTab>('vereadores');

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPartido, setSelectedPartido] = useState<string>('all');
    const [cargoFilter, setCargoFilter] = useState<string>('all');
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
        staleTime: 10 * 60 * 1000,
    });

    // Fetch partidos for filter
    const { data: partidos } = useQuery({
        queryKey: QUERY_KEYS.votes.partidos,
        queryFn: () => votesReferenceService.getPartidos(),
        staleTime: 60 * 60 * 1000,
    });

    const isLoading = loadingVereadores;

    // Filter vereadores
    const filteredVereadores = useMemo(() => {
        if (!vereadores) return [];

        let result = [...vereadores];

        // Local search filtering
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter((v) => v.nome.toLowerCase().includes(query));
        }

        // Filter by cargo
        if (cargoFilter !== 'all') {
            result = result.filter((v) => v.cargo === cargoFilter);
        }

        // Sort: Mesa Diretora first, then alphabetically
        result.sort((a, b) => {
            const cargoOrder: Record<string, number> = {
                'Presidente': 1,
                'Vice-Presidente': 2,
                '1º Secretário': 3,
                '2º Secretário': 4,
                '2º Secretária': 4,
                'Vereador': 10,
                'Vereadora': 10,
            };
            const orderA = cargoOrder[a.cargo || 'Vereador'] || 10;
            const orderB = cargoOrder[b.cargo || 'Vereador'] || 10;
            if (orderA !== orderB) return orderA - orderB;
            return a.nome.localeCompare(b.nome, 'pt-BR');
        });

        return result;
    }, [vereadores, searchQuery, cargoFilter]);

    // Extract unique cargos
    const availableCargos = useMemo(() => {
        if (!vereadores) return [];
        const cargos = new Set(vereadores.map((v) => v.cargo).filter(Boolean));
        return Array.from(cargos).sort();
    }, [vereadores]);

    const handleClearFilters = () => {
        setSearchQuery('');
        setSelectedPartido('all');
        setCargoFilter('all');
        setIsSearchOpen(false);
    };

    const handleTabChange = (tab: TabId) => {
        setActiveTab(tab);
        navigate('/');
    };

    const hasActiveFilters = searchQuery || selectedPartido !== 'all' || cargoFilter !== 'all';

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
                                if (v === 'votacoes') {
                                    navigate('/votacoes');
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

                        {/* Filters Row */}
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />

                            {/* Party Filter */}
                            <Select value={selectedPartido} onValueChange={setSelectedPartido}>
                                <SelectTrigger className="flex-1 h-9 text-xs">
                                    <SelectValue placeholder="Partido" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos Partidos</SelectItem>
                                    {partidos?.map((partido: Partido) => (
                                        <SelectItem key={partido.id} value={partido.sigla}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: partido.corHex }}
                                                />
                                                {partido.sigla}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Cargo Filter */}
                            <Select value={cargoFilter} onValueChange={setCargoFilter}>
                                <SelectTrigger className="flex-1 h-9 text-xs">
                                    <SelectValue placeholder="Cargo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos Cargos</SelectItem>
                                    {availableCargos.map((cargo) => (
                                        <SelectItem key={cargo} value={cargo || ''}>
                                            {cargo}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Active Filters Tags */}
                        {hasActiveFilters && (
                            <div className="flex items-center gap-2 flex-wrap">
                                {selectedPartido !== 'all' && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                        {selectedPartido}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => setSelectedPartido('all')}
                                        />
                                    </Badge>
                                )}
                                {cargoFilter !== 'all' && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                        {cargoFilter}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => setCargoFilter('all')}
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
                <BottomTabBar activeTab={appTab} onTabChange={handleTabChange} />
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

    const isMesaDiretora = ['Presidente', 'Vice-Presidente', '1º Secretário', '2º Secretário', '2º Secretária'].includes(vereador.cargo || '');

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.03 }}
        >
            <Card
                className={cn(
                    "cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden",
                    isMesaDiretora && "ring-2 ring-primary/20"
                )}
                onClick={onClick}
            >
                <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                    <Avatar className="w-16 h-16 border-2 border-muted">
                        <AvatarImage src={vereador.fotoUrl || ''} alt={vereador.nome} />
                        <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1.5 w-full">
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                            {vereador.nome}
                        </h3>

                        {vereador.cargo && vereador.cargo !== 'Vereador' && vereador.cargo !== 'Vereadora' && (
                            <Badge
                                variant="default"
                                className="text-[10px] px-2 py-0.5"
                            >
                                {vereador.cargo}
                            </Badge>
                        )}

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
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground">
                                Licenciado
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
