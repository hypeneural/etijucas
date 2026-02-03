import { useMemo, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Filter, Heart, Search, MapPin, CalendarClock, Sparkles, Church } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useMassFilters } from '@/hooks/useMassFilters';
import MassCard from '@/components/missas/MassCard';
import FiltersSheet from '@/components/missas/FiltersSheet';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { BottomTabBar, TabId } from '@/components/layout/BottomTabBar';
import { useAppStore } from '@/store/useAppStore';

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HERO_IMAGE = '/igreja-hero.svg';

export default function MassesPage() {
    const navigate = useNavigate();
    const [isFilterOpen, setFilterOpen] = useState(false);
    const { setActiveTab } = useAppStore();

    const handleTabChange = (tab: TabId) => {
        setActiveTab(tab);
        navigate('/');
    };

    const {
        filters,
        setFilters,
        filteredMasses,
        groupedMasses,
        nextMass,
        favorites,
        toggleFavorite,
        availableSuburbs,
        allMasses,
        locations,
        meta,
    } = useMassFilters();

    const currentDay = new Date().getDay();

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.weekdays.length > 0) count++;
        if (filters.suburbs.length > 0) count++;
        if (filters.types.length > 0) count++;
        return count;
    }, [filters]);

    const hasActiveFilters = useMemo(() => {
        return (
            activeFilterCount > 0 ||
            filters.search.trim().length > 0 ||
            filters.showFavoritesOnly
        );
    }, [activeFilterCount, filters.search, filters.showFavoritesOnly]);

    const todayMasses = useMemo(() => {
        return filteredMasses.filter(m => m.weekday === currentDay);
    }, [filteredMasses, currentDay]);

    const orderedDays = useMemo(() => {
        const days = Object.keys(groupedMasses).map(Number);
        return days.sort((a, b) => {
            const diffA = (a - currentDay + 7) % 7;
            const diffB = (b - currentDay + 7) % 7;
            return diffA - diffB;
        });
    }, [groupedMasses, currentDay]);

    const lastUpdatedLabel = useMemo(() => {
        if (!meta?.lastUpdated) return 'Atualizado recentemente';
        return format(parseISO(meta.lastUpdated), "dd 'de' MMM, yyyy", { locale: ptBR });
    }, [meta?.lastUpdated]);

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, search: e.target.value }));
    };

    const toggleFavoriteFilter = () => {
        setFilters(prev => ({ ...prev, showFavoritesOnly: !prev.showFavoritesOnly }));
    };

    const resetFilters = () => {
        setFilters({
            search: '',
            suburbs: [],
            weekdays: [],
            types: [],
            showFavoritesOnly: false,
        });
    };

    const selectQuickDay = (dayIndex: number) => {
        const isOnly = filters.weekdays.length === 1 && filters.weekdays[0] === dayIndex;
        if (isOnly) {
            setFilters(prev => ({ ...prev, weekdays: [] }));
        } else {
            setFilters(prev => ({ ...prev, weekdays: [dayIndex] }));
        }
    };

    const openMap = (name: string, neighborhood?: string | null, geo?: { lat: number; lng: number } | null) => {
        const query = geo
            ? `${geo.lat},${geo.lng}`
            : `${name}, ${neighborhood ?? ''}, Tijucas - SC`;
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
    };

    const stats = [
        {
            id: 'next',
            label: 'Próxima',
            value: nextMass?.time ?? '—',
            sub: nextMass ? `${WEEKDAYS[nextMass.weekday]} • ${nextMass.location?.name}` : 'Sem horários próximos',
            icon: CalendarClock,
        },
        {
            id: 'today',
            label: 'Hoje',
            value: String(todayMasses.length),
            sub: todayMasses.length === 1 ? 'missa' : 'missas',
            icon: Sparkles,
        },
        {
            id: 'locs',
            label: 'Comunidades',
            value: String(locations.length),
            sub: 'locais',
            icon: Church,
        },
    ];

    return (
        <div className="min-h-screen bg-background pb-[calc(var(--tab-bar-height)+2.5rem)]">
            <div className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex h-14 w-full max-w-[420px] items-center justify-between px-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="font-semibold text-lg">Horários de Missas</h1>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleFavoriteFilter}
                            className={cn(filters.showFavoritesOnly && 'text-red-500')}
                        >
                            <Heart className={cn('h-5 w-5', filters.showFavoritesOnly && 'fill-current')} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFilterOpen(true)}
                            className="relative"
                        >
                            <Filter className="h-5 w-5" />
                            {activeFilterCount > 0 && (
                                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mx-auto w-full max-w-[420px]">
                <section className="px-4 pt-4">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-elevated"
                    >
                        <img
                            src={HERO_IMAGE}
                            alt="Igreja em Tijucas"
                            className="h-56 w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                        <div className="absolute inset-0 flex flex-col justify-between p-5 text-white">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                                    {meta?.city ?? 'Tijucas/SC'}
                                </p>
                                <h2 className="mt-2 text-2xl font-bold leading-tight">
                                    {meta?.parishName ?? 'Paróquia São Sebastião'}
                                </h2>
                                <Badge
                                    variant="outline"
                                    className="mt-2 border-white/30 text-white/80"
                                >
                                    Atualizado em {lastUpdatedLabel}
                                </Badge>
                            </div>

                            {nextMass && nextMass.location && (
                                <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                                    <div className="text-[10px] uppercase tracking-[0.3em] text-white/70">
                                        Próxima missa
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold">{nextMass.time}</div>
                                            <div className="text-sm font-medium text-white/85">
                                                {WEEKDAYS[nextMass.weekday]}, {nextMass.location.name}
                                            </div>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-9 w-9 text-white hover:bg-white/20"
                                            onClick={() =>
                                                openMap(
                                                    nextMass.location!.name,
                                                    nextMass.location!.neighborhood,
                                                    nextMass.location!.geo
                                                )
                                            }
                                        >
                                            <MapPin className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </section>

                <section className="mt-4">
                    <div className="flex gap-3 overflow-x-auto px-4 pb-1">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <motion.div
                                    key={stat.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="min-w-[150px] flex-1 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-card"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                            {stat.label}
                                        </p>
                                        <Icon className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="mt-2 text-2xl font-bold text-foreground">
                                        {stat.value}
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                        {stat.sub}
                                    </p>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                <section className="mt-4 px-4">
                    <div className="rounded-2xl border bg-card/80 p-3 shadow-card">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar capela, comunidade, bairro..."
                                className="h-10 rounded-xl border-transparent bg-secondary/50 pl-9 transition-all focus:bg-background"
                                value={filters.search}
                                onChange={handleSearchChange}
                            />
                        </div>
                        <div className="mt-3 flex gap-2">
                            <Button
                                variant="secondary"
                                className="flex-1 rounded-xl"
                                onClick={() => setFilterOpen(true)}
                            >
                                <Filter className="mr-2 h-4 w-4" />
                                Filtros
                            </Button>
                            <Button
                                variant={filters.showFavoritesOnly ? 'default' : 'secondary'}
                                className="flex-1 rounded-xl"
                                onClick={toggleFavoriteFilter}
                            >
                                <Heart className="mr-2 h-4 w-4" />
                                Favoritas
                            </Button>
                        </div>
                        {hasActiveFilters && (
                            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                <span>{filteredMasses.length} missas encontradas</span>
                                <Button variant="ghost" size="sm" onClick={resetFilters}>
                                    Limpar filtros
                                </Button>
                            </div>
                        )}
                    </div>
                </section>

                <section className="mt-4">
                    <div className="flex items-center justify-between px-4">
                        <h3 className="text-sm font-semibold">Escolha o dia</h3>
                        {filters.weekdays.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => setFilters(prev => ({ ...prev, weekdays: [] }))}>
                                Ver semana toda
                            </Button>
                        )}
                    </div>
                    <ScrollArea className="w-full whitespace-nowrap">
                        <div className="flex w-max space-x-2 px-4 pb-2 pt-2">
                            <Badge
                                variant={filters.weekdays.includes(currentDay) ? 'default' : 'secondary'}
                                className="cursor-pointer rounded-full px-4"
                                onClick={() => selectQuickDay(currentDay)}
                            >
                                Hoje
                            </Badge>
                            {WEEKDAYS_SHORT.map((day, idx) => {
                                if (idx === currentDay) return null;
                                const isSelected = filters.weekdays.includes(idx);
                                return (
                                    <Badge
                                        key={day}
                                        variant={isSelected ? 'default' : 'outline'}
                                        className="cursor-pointer rounded-full px-4"
                                        onClick={() => selectQuickDay(idx)}
                                    >
                                        {day}
                                    </Badge>
                                );
                            })}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </section>

                <section className="px-4 py-4 space-y-6">
                    {filteredMasses.length === 0 ? (
                        <div className="text-center py-10 opacity-70">
                            <p className="text-sm">Nenhuma missa encontrada.</p>
                            <Button variant="link" onClick={resetFilters}>
                                Limpar filtros
                            </Button>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {orderedDays.map((dayIndex) => {
                                const masses = groupedMasses[dayIndex];
                                if (!masses || masses.length === 0) return null;

                                const isToday = dayIndex === currentDay;

                                return (
                                    <motion.div
                                        key={dayIndex}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <h3 className={cn('text-lg font-bold', isToday && 'text-primary')}>
                                                {isToday ? 'Hoje' : WEEKDAYS[dayIndex]}
                                            </h3>
                                            <Separator className="flex-1" />
                                            <span className="text-xs text-muted-foreground">
                                                {masses.length} {masses.length === 1 ? 'missa' : 'missas'}
                                            </span>
                                        </div>

                                        <div className="grid gap-3">
                                            {masses.map(mass => (
                                                <MassCard
                                                    key={mass.id}
                                                    mass={mass}
                                                    isFavorite={favorites.includes(mass.location!.id)}
                                                    onToggleFavorite={toggleFavorite}
                                                    highlight={isToday && nextMass?.id === mass.id}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </section>
            </div>

            <FiltersSheet
                open={isFilterOpen}
                onOpenChange={setFilterOpen}
                filters={filters}
                applyFilters={setFilters}
                availableSuburbs={availableSuburbs}
                allMasses={allMasses}
                favorites={favorites}
            />

            <BottomTabBar activeTab="mais" onTabChange={handleTabChange} />
        </div>
    );
}
