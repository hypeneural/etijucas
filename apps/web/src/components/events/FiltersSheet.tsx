import { useEffect, useMemo, useState } from 'react';
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import type { EventFiltersState, EventWithDates, EventCategory } from '@/types/events';
import { filterEvents } from '@/hooks/useEventFilters';

interface FiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: EventFiltersState;
  applyFilters: (filters: EventFiltersState) => void;
  allEvents: EventWithDates[];
  availableNeighborhoods: string[];
  availableVenues: string[];
  availableCategories: EventCategory[];
}

const DATE_PRESETS: Array<{ id: EventFiltersState['datePreset']; label: string }> = [
  { id: 'today', label: 'Hoje' },
  { id: 'tomorrow', label: 'Amanhã' },
  { id: 'weekend', label: 'Fim de semana' },
  { id: 'range', label: 'Intervalo' },
];

const TIME_OF_DAY: Array<{ id: 'morning' | 'afternoon' | 'night'; label: string }> = [
  { id: 'morning', label: 'Manhã' },
  { id: 'afternoon', label: 'Tarde' },
  { id: 'night', label: 'Noite' },
];

const CATEGORY_LABELS: Record<string, string> = {
  SHOW: 'Shows',
  FESTA: 'Festas',
  CULTURA: 'Cultura',
  INFANTIL: 'Infantil',
  GASTRONOMICO: 'Gastronômico',
  ESPORTES: 'Esportes',
};

export default function FiltersSheet({
  open,
  onOpenChange,
  filters,
  applyFilters,
  allEvents,
  availableNeighborhoods,
  availableVenues,
  availableCategories,
}: FiltersSheetProps) {
  const [localFilters, setLocalFilters] = useState<EventFiltersState>(filters);
  const [neighborhoodQuery, setNeighborhoodQuery] = useState('');

  useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  const previewCount = useMemo(() => {
    return filterEvents(allEvents, localFilters).length;
  }, [allEvents, localFilters]);

  const filteredNeighborhoods = useMemo(() => {
    const query = neighborhoodQuery.toLowerCase();
    return availableNeighborhoods.filter((bairro) => bairro.toLowerCase().includes(query));
  }, [availableNeighborhoods, neighborhoodQuery]);

  const toggleSelection = (key: 'categories' | 'neighborhoods' | 'venues' | 'timeOfDay', value: string) => {
    setLocalFilters((prev) => {
      const current = prev[key] as string[];
      return {
        ...prev,
        [key]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
      } as EventFiltersState;
    });
  };

  const handleClear = () => {
    setLocalFilters({
      ...filters,
      search: '',
      datePreset: 'all',
      dateRange: { start: null, end: null },
      categories: [],
      neighborhoods: [],
      venues: [],
      price: 'all',
      priceRange: [0, 150],
      timeOfDay: [],
      accessibility: false,
      parking: false,
      kids: false,
      outdoor: false,
      sortBy: 'upcoming',
    });
  };

  const handleApply = () => {
    applyFilters(localFilters);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Filtrar eventos</DrawerTitle>
        </DrawerHeader>

        <ScrollArea className="h-full px-4 pb-4">
          <Accordion type="multiple" className="space-y-3">
            <AccordionItem value="dates">
              <AccordionTrigger>Datas</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2">
                  {DATE_PRESETS.map((preset) => (
                    <Badge
                      key={preset.id}
                      variant={localFilters.datePreset === preset.id ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          datePreset: prev.datePreset === preset.id ? 'all' : preset.id,
                        }))
                      }
                    >
                      {preset.label}
                    </Badge>
                  ))}
                </div>
                {localFilters.datePreset === 'range' && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Input
                      type="date"
                      value={localFilters.dateRange.start ?? ''}
                      onChange={(e) =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, start: e.target.value },
                        }))
                      }
                    />
                    <Input
                      type="date"
                      value={localFilters.dateRange.end ?? ''}
                      onChange={(e) =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, end: e.target.value },
                        }))
                      }
                    />
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="category">
              <AccordionTrigger>Categoria</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map((category) => {
                    const categorySlug = typeof category === 'string' ? category : category.slug;
                    const categoryName = typeof category === 'string' ? category : category.name;
                    return (
                      <Badge
                        key={categorySlug}
                        variant={localFilters.categories.includes(categorySlug) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleSelection('categories', categorySlug)}
                      >
                        {categoryName}
                      </Badge>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="neighborhood">
              <AccordionTrigger>Bairro</AccordionTrigger>
              <AccordionContent>
                <Input
                  placeholder="Buscar bairro..."
                  value={neighborhoodQuery}
                  onChange={(e) => setNeighborhoodQuery(e.target.value)}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {filteredNeighborhoods.map((bairro) => (
                    <Badge
                      key={bairro}
                      variant={localFilters.neighborhoods.includes(bairro) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleSelection('neighborhoods', bairro)}
                    >
                      {bairro}
                    </Badge>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="venues">
              <AccordionTrigger>Locais</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2">
                  {availableVenues.map((venue) => (
                    <Badge
                      key={venue}
                      variant={localFilters.venues.includes(venue) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleSelection('venues', venue)}
                    >
                      {venue}
                    </Badge>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="price">
              <AccordionTrigger>Preço</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2">
                  {['all', 'free', 'paid'].map((price) => (
                    <Badge
                      key={price}
                      variant={localFilters.price === price ? 'default' : 'outline'}
                      className="cursor-pointer capitalize"
                      onClick={() => setLocalFilters((prev) => ({ ...prev, price: price as EventFiltersState['price'] }))}
                    >
                      {price === 'all' ? 'Todos' : price === 'free' ? 'Grátis' : 'Pago'}
                    </Badge>
                  ))}
                </div>

                {localFilters.price === 'paid' && (
                  <div className="mt-4 space-y-3">
                    <Slider
                      value={localFilters.priceRange}
                      min={0}
                      max={150}
                      step={5}
                      onValueChange={(value) =>
                        setLocalFilters((prev) => ({ ...prev, priceRange: value as [number, number] }))
                      }
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>R$ {localFilters.priceRange[0]}</span>
                      <span>R$ {localFilters.priceRange[1]}</span>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="time">
              <AccordionTrigger>Horário</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2">
                  {TIME_OF_DAY.map((period) => (
                    <Badge
                      key={period.id}
                      variant={localFilters.timeOfDay.includes(period.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleSelection('timeOfDay', period.id)}
                    >
                      {period.label}
                    </Badge>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="accessibility">
              <AccordionTrigger>Acessibilidade</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={localFilters.accessibility ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setLocalFilters((prev) => ({ ...prev, accessibility: !prev.accessibility }))}
                  >
                    Acessível
                  </Badge>
                  <Badge
                    variant={localFilters.parking ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setLocalFilters((prev) => ({ ...prev, parking: !prev.parking }))}
                  >
                    Estacionamento
                  </Badge>
                  <Badge
                    variant={localFilters.kids ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setLocalFilters((prev) => ({ ...prev, kids: !prev.kids }))}
                  >
                    Kids
                  </Badge>
                  <Badge
                    variant={localFilters.outdoor ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setLocalFilters((prev) => ({ ...prev, outdoor: !prev.outdoor }))}
                  >
                    Ao ar livre
                  </Badge>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Separator className="my-4" />
          <div className="text-xs text-muted-foreground">
            {previewCount} resultados encontrados
          </div>
        </ScrollArea>

        <DrawerFooter className="border-t">
          <Button onClick={handleApply}>Aplicar ({previewCount})</Button>
          <Button variant="outline" onClick={handleClear}>
            Limpar filtros
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
