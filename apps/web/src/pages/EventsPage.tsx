import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Filter,
  Search,
  CalendarDays,
  Home,
  Map as MapIcon,
  Heart,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import EventCard from '@/components/events/EventCard';
import FiltersSheet from '@/components/events/FiltersSheet';
import { useEventFilters } from '@/hooks/useEventFilters';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  formatDayHeader,
  formatDateLong,
  formatDateShort,
  getDateKey,
  isToday,
  isTomorrow,
  isWeekend,
} from '@/utils/date';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EventsPageProps {
  scrollRef?: (el: HTMLDivElement | null) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  SHOW: 'Shows',
  FESTA: 'Festas',
  CULTURA: 'Cultura',
  INFANTIL: 'Infantil',
  GASTRONOMICO: 'Gastronômico',
  ESPORTES: 'Esportes',
};

export default function EventsPage({ scrollRef }: EventsPageProps) {
  const {
    meta,
    allEvents,
    filteredEvents,
    groupedEvents,
    filters,
    setFilters,
    availableNeighborhoods,
    availableVenues,
    availableCategories,
    favorites,
    toggleFavorite,
    isLoading,
  } = useEventFilters();
  const { setActiveTab } = useAppStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const heroSlides = useMemo(() => {
    if (!allEvents || allEvents.length === 0) {
      return [
        { id: 'today', label: 'Hoje', caption: 'Descubra os eventos de hoje', event: null },
        { id: 'weekend', label: 'Fim de Semana', caption: 'Planeje o seu fim de semana', event: null },
        { id: 'free', label: 'Grátis', caption: 'Curta eventos gratuitos', event: null },
      ];
    }

    const today = allEvents.filter((event) => isToday(event.start));
    const weekend = allEvents.filter((event) => isWeekend(event.start));
    const free = allEvents.filter((event) => event.ticket?.type === 'free');

    return [
      {
        id: 'today',
        label: 'Hoje',
        caption: today[0]?.title ?? 'Descubra os eventos de hoje',
        event: today[0] ?? allEvents[0] ?? null,
      },
      {
        id: 'weekend',
        label: 'Fim de Semana',
        caption: weekend[0]?.title ?? 'Planeje o seu fim de semana',
        event: weekend[0] ?? allEvents[1] ?? allEvents[0] ?? null,
      },
      {
        id: 'free',
        label: 'Grátis',
        caption: free[0]?.title ?? 'Curta eventos gratuitos',
        event: free[0] ?? allEvents[2] ?? allEvents[0] ?? null,
      },
    ];
  }, [allEvents]);

  const activeSlide = heroSlides[heroIndex] ?? heroSlides[0];

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search.trim()) count++;
    if (filters.datePreset !== 'all') count++;
    if (filters.categories.length > 0) count++;
    if (filters.neighborhoods.length > 0) count++;
    if (filters.venues.length > 0) count++;
    if (filters.price !== 'all') count++;
    if (filters.timeOfDay.length > 0) count++;
    if (filters.accessibility || filters.parking || filters.kids || filters.outdoor) count++;
    return count;
  }, [filters]);

  const orderedDays = useMemo(() => {
    return Object.keys(groupedEvents).sort();
  }, [groupedEvents]);

  const popularNeighborhoods = useMemo(() => {
    if (!allEvents || allEvents.length === 0) return [];
    const counts = new Map<string, number>();
    allEvents.forEach((event) => {
      const bairro = event.venue?.bairro?.nome;
      if (bairro) {
        counts.set(bairro, (counts.get(bairro) ?? 0) + 1);
      }
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([bairro]) => bairro);
  }, [allEvents]);

  const calendarEventsByDate = useMemo(() => {
    const groups: Record<string, typeof filteredEvents> = {};
    filteredEvents.forEach((event) => {
      const key = getDateKey(event.start);
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    });
    return groups;
  }, [filteredEvents]);

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleHeroCTA = () => {
    if (activeSlide?.event) {
      navigate(`/agenda/${activeSlide.event.id}`);
    }
  };

  const toggleCategory = (category: string) => {
    setFilters((prev) => {
      const exists = prev.categories.includes(category as never);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((item) => item !== category)
          : [...prev.categories, category as never],
      };
    });
  };

  const toggleNeighborhood = (bairro: string) => {
    setFilters((prev) => {
      const exists = prev.neighborhoods.includes(bairro);
      return {
        ...prev,
        neighborhoods: exists ? prev.neighborhoods.filter((item) => item !== bairro) : [...prev.neighborhoods, bairro],
      };
    });
  };

  const selectDatePreset = (preset: 'today' | 'tomorrow' | 'weekend') => {
    setFilters((prev) => ({
      ...prev,
      datePreset: prev.datePreset === preset ? 'all' : preset,
    }));
  };

  const selectPrice = (price: 'free' | 'paid') => {
    setFilters((prev) => ({
      ...prev,
      price: prev.price === price ? 'all' : price,
    }));
  };

  const handleBottomNavClick = (tab: 'home' | 'agenda' | 'map' | 'favorites' | 'profile') => {
    if (tab === 'home') {
      setActiveTab('home');
      return;
    }
    if (tab === 'agenda') {
      setActiveTab('agenda');
      return;
    }
    toast({ title: 'Em breve', description: 'Funcionalidade em desenvolvimento.' });
  };

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div ref={scrollRef} className="h-full min-h-screen overflow-y-auto bg-background pb-32">
      <div className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md safe-top">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">Agenda</h1>
            <p className="text-xs text-muted-foreground">Eventos, shows e festas</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => searchRef.current?.focus()}>
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9"
              onClick={() => setFilterOpen(true)}
            >
              <Filter className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-6">
        {isLoading ? (
          <Skeleton className="h-44 w-full rounded-3xl" />
        ) : (
          <div className="relative overflow-hidden rounded-3xl border bg-card/90 shadow-elevated">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide?.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <motion.img
                  src={activeSlide?.event?.coverImage ?? '/placeholder.svg'}
                  alt={activeSlide?.event?.title ?? 'Destaque'}
                  className="h-44 w-full object-cover"
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.8 }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-between p-5">
                  <div className="text-white">
                    <Badge className="bg-white/20 text-white">{activeSlide?.label}</Badge>
                    <h2 className="mt-2 text-xl font-bold">{activeSlide?.caption}</h2>
                    <p className="text-xs text-white/80">
                      {activeSlide?.event ? formatDateLong(activeSlide.event.start) : 'Confira a programação'}
                    </p>
                  </div>
                  <Button onClick={handleHeroCTA} className="rounded-full">Ver</Button>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
              {heroSlides.map((slide, index) => (
                <span
                  key={slide.id}
                  className={cn(
                    'h-2 w-2 rounded-full transition-all',
                    index === heroIndex ? 'bg-white' : 'bg-white/40'
                  )}
                />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Input
            ref={searchRef}
            placeholder="Buscar evento, local, bairro..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />

          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max gap-2 pb-2">
              {['Hoje', 'Amanhã', 'Fim de semana'].map((label) => {
                const preset = label === 'Hoje' ? 'today' : label === 'Amanhã' ? 'tomorrow' : 'weekend';
                const active = filters.datePreset === preset;
                return (
                  <motion.button
                    key={label}
                    whileTap={{ scale: 0.92 }}
                    className={cn(
                      'rounded-full border px-4 py-2 text-xs font-medium',
                      active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card'
                    )}
                    onClick={() => selectDatePreset(preset)}
                  >
                    {label}
                  </motion.button>
                );
              })}

              <Separator orientation="vertical" className="h-7" />

              {['Grátis', 'Pago'].map((label) => {
                const price = label === 'Grátis' ? 'free' : 'paid';
                const active = filters.price === price;
                return (
                  <motion.button
                    key={label}
                    whileTap={{ scale: 0.92 }}
                    className={cn(
                      'rounded-full border px-4 py-2 text-xs font-medium',
                      active ? 'bg-secondary text-secondary-foreground border-secondary' : 'bg-card'
                    )}
                    onClick={() => selectPrice(price)}
                  >
                    {label}
                  </motion.button>
                );
              })}

              <Separator orientation="vertical" className="h-7" />

              {availableCategories.map((category) => {
                const categorySlug = typeof category === 'string' ? category : category.slug;
                const categoryName = typeof category === 'string' ? category : category.name;
                const active = filters.categories.includes(categorySlug);
                return (
                  <motion.button
                    key={categorySlug}
                    whileTap={{ scale: 0.92 }}
                    className={cn(
                      'rounded-full border px-4 py-2 text-xs font-medium',
                      active ? 'bg-accent text-accent-foreground border-accent' : 'bg-card'
                    )}
                    onClick={() => toggleCategory(categorySlug)}
                  >
                    {categoryName}
                  </motion.button>
                );
              })}

              <Separator orientation="vertical" className="h-7" />

              {popularNeighborhoods.map((bairro) => {
                const active = filters.neighborhoods.includes(bairro);
                return (
                  <motion.button
                    key={bairro}
                    whileTap={{ scale: 0.92 }}
                    className={cn(
                      'rounded-full border px-4 py-2 text-xs font-medium',
                      active ? 'bg-muted text-foreground border-border' : 'bg-card'
                    )}
                    onClick={() => toggleNeighborhood(bairro)}
                  >
                    {bairro}
                  </motion.button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Ordenar por</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={filters.sortBy === 'upcoming' ? 'default' : 'outline'}
              onClick={() => setFilters((prev) => ({ ...prev, sortBy: 'upcoming' }))}
            >
              Próximos
            </Button>
            <Button
              size="sm"
              variant={filters.sortBy === 'popular' ? 'default' : 'outline'}
              onClick={() => setFilters((prev) => ({ ...prev, sortBy: 'popular' }))}
            >
              Populares
            </Button>
          </div>
        </div>

        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'list' | 'calendar')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4 space-y-6">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={`event-skel-${index}`} className="h-28 w-full rounded-3xl" />
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="rounded-2xl border bg-card p-6 text-center">
                <p className="text-sm text-muted-foreground">Nenhum evento encontrado.</p>
                <Button
                  variant="link"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      search: '',
                      datePreset: 'all',
                      categories: [],
                      neighborhoods: [],
                      venues: [],
                      price: 'all',
                      timeOfDay: [],
                      accessibility: false,
                      parking: false,
                      kids: false,
                      outdoor: false,
                    }))
                  }
                >
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {orderedDays.map((key) => {
                  const dayEvents = groupedEvents[key];
                  if (!dayEvents || dayEvents.length === 0) return null;
                  const dayDate = dayEvents[0].start;

                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <h3 className={cn('text-lg font-semibold', isToday(dayDate) && 'text-primary')}>
                          {formatDayHeader(dayDate)}
                        </h3>
                        {isTomorrow(dayDate) && (
                          <Badge variant="secondary" className="text-xs">Amanhã</Badge>
                        )}
                        <Separator className="flex-1" />
                        <span className="text-xs text-muted-foreground">
                          {dayEvents.length} evento{dayEvents.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {dayEvents.map((event, index) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <EventCard
                              event={event}
                              isFavorite={favorites.includes(event.id)}
                              onToggleFavorite={toggleFavorite}
                              onOpen={(id) => navigate(`/agenda/${id}`)}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar" className="mt-4 space-y-4">
            <div className="rounded-2xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tijucas</p>
                  <h3 className="text-lg font-semibold capitalize">
                    {format(monthStart, 'MMMM yyyy', { locale: ptBR })}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedDate(subMonths(selectedDate, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addMonths(selectedDate, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
                  <span key={`day-header-${index}`}>{day}</span>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-2">
                {calendarDays.map((day) => {
                  const key = getDateKey(day);
                  const hasEvents = calendarEventsByDate[key]?.length;
                  const isCurrentMonth = day.getMonth() === monthStart.getMonth();
                  const isSelected = getDateKey(day) === getDateKey(selectedDate);
                  return (
                    <motion.button
                      key={day.toISOString()}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        'flex h-10 flex-col items-center justify-center rounded-xl border text-xs',
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background',
                        !isCurrentMonth && 'opacity-40'
                      )}
                    >
                      <span className="font-medium">{format(day, 'd')}</span>
                      {hasEvents ? <span className="mt-1 h-1 w-1 rounded-full bg-current" /> : null}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Eventos em {formatDateShort(selectedDate)}</h3>
              {(calendarEventsByDate[getDateKey(selectedDate)] ?? []).length === 0 ? (
                <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
                  Nenhum evento neste dia.
                </div>
              ) : (
                (calendarEventsByDate[getDateKey(selectedDate)] ?? []).map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <EventCard
                      event={event}
                      isFavorite={favorites.includes(event.id)}
                      onToggleFavorite={toggleFavorite}
                      onOpen={(id) => navigate(`/agenda/${id}`)}
                    />
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <FiltersSheet
        open={isFilterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        applyFilters={setFilters}
        allEvents={allEvents}
        availableNeighborhoods={availableNeighborhoods}
        availableVenues={availableVenues}
        availableCategories={availableCategories}
      />
    </div>
  );
}
