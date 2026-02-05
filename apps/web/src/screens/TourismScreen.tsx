// TourismScreen - Pontos Turísticos (TripAdvisor-like)
// Mobile-first, offline-first, native-first

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  Star,
  MapPin,
  Heart,
  MessageCircle,
  ChevronRight,
  X,
  Bookmark,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useOfflineTourism } from '@/hooks/useOfflineTourism';
import {
  TOURISM_CATEGORIES,
  TOURISM_SORT_OPTIONS,
  PRECO_LABELS,
  type TourismCategory,
  type TourismFilters,
} from '@/types/tourism.types';

// ============================================
// COMPONENTS
// ============================================

// Star rating display
function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  const starSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <Star key={i} className={`${starSize} fill-yellow-400 text-yellow-400`} />
      );
    } else if (i === fullStars && hasHalf) {
      stars.push(
        <div key={i} className="relative">
          <Star className={`${starSize} text-gray-200`} />
          <Star
            className={`${starSize} fill-yellow-400 text-yellow-400 absolute top-0 left-0`}
            style={{ clipPath: 'inset(0 50% 0 0)' }}
          />
        </div>
      );
    } else {
      stars.push(
        <Star key={i} className={`${starSize} text-gray-200`} />
      );
    }
  }

  return <div className="flex items-center gap-0.5">{stars}</div>;
}

// Tourism spot card
function SpotCard({
  spot,
  onLike,
  onSave,
  onClick
}: {
  spot: import('@/types/tourism.types').TourismSpotEnhanced;
  onLike: () => void;
  onSave: () => void;
  onClick: () => void;
}) {
  const category = TOURISM_CATEGORIES[spot.categoria];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-card rounded-2xl overflow-hidden shadow-card cursor-pointer"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={spot.imageUrl}
          alt={spot.titulo}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <Badge className={`${category?.color} text-xs`}>
            {category?.icon} {category?.label}
          </Badge>

          <div className="flex gap-2">
            {spot.isVerificado && (
              <div className="bg-white/90 backdrop-blur rounded-full p-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
            )}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => { e.stopPropagation(); onSave(); }}
              className="bg-white/90 backdrop-blur rounded-full p-1.5"
            >
              <Bookmark
                className={`w-4 h-4 ${spot.isSaved ? 'fill-primary text-primary' : 'text-gray-600'}`}
              />
            </motion.button>
          </div>
        </div>

        {/* Bottom info overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-bold text-lg line-clamp-1 mb-1">
            {spot.titulo}
          </h3>
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <MapPin className="w-3.5 h-3.5" />
            <span className="line-clamp-1">{spot.bairroNome || spot.endereco}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {spot.descCurta}
        </p>

        {/* Rating and stats row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StarRating rating={spot.rating} />
            <span className="text-sm font-medium">{Number(spot.rating || 0).toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">
              ({spot.reviewsCount} avaliações)
            </span>
          </div>
        </div>

        {/* Tags */}
        {spot.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {spot.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {spot.tags.length > 3 && (
              <span className="text-xs px-2 py-0.5 text-muted-foreground">
                +{spot.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onLike(); }}
              className="flex items-center gap-1.5 text-sm"
            >
              <Heart
                className={`w-4 h-4 ${spot.liked ? 'fill-accent text-accent' : 'text-muted-foreground'}`}
              />
              <span className={spot.liked ? 'text-accent' : 'text-muted-foreground'}>
                {spot.likesCount}
              </span>
            </motion.button>

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MessageCircle className="w-4 h-4" />
              <span>{spot.reviewsCount}</span>
            </div>
          </div>

          {spot.preco && (
            <span className="text-xs font-medium text-secondary">
              {PRECO_LABELS[spot.preco]?.label}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Skeleton loader
function SpotCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-card">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Category filter chip
function CategoryChip({
  category,
  isActive,
  onClick
}: {
  category: TourismCategory | 'todos';
  isActive: boolean;
  onClick: () => void;
}) {
  const info = category === 'todos'
    ? { icon: '🗺️', label: 'Todos', color: 'bg-primary/10 text-primary' }
    : TOURISM_CATEGORIES[category];

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap
        transition-colors
        ${isActive
          ? 'bg-primary text-primary-foreground'
          : 'bg-card text-foreground border border-border'
        }
      `}
    >
      <span>{info?.icon}</span>
      <span>{info?.label}</span>
    </motion.button>
  );
}

// Filters sheet
function FiltersSheet({
  filters,
  onChange,
  usedCategories,
  allTags,
}: {
  filters: TourismFilters;
  onChange: (filters: TourismFilters) => void;
  usedCategories: TourismCategory[];
  allTags: string[];
}) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [open, setOpen] = useState(false);

  const handleApply = () => {
    onChange(localFilters);
    setOpen(false);
  };

  const handleReset = () => {
    const reset: TourismFilters = {};
    setLocalFilters(reset);
    onChange(reset);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0">
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-120px)] mt-4">
          <div className="space-y-6 pb-4">
            {/* Sort */}
            <div>
              <h4 className="font-medium mb-3">Ordenar por</h4>
              <div className="flex flex-wrap gap-2">
                {TOURISM_SORT_OPTIONS.map(opt => (
                  <Button
                    key={opt.value}
                    variant={localFilters.sortBy === opt.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLocalFilters(f => ({ ...f, sortBy: opt.value }))}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <h4 className="font-medium mb-3">Avaliação mínima</h4>
              <div className="flex gap-2">
                {[4.5, 4, 3.5, 3].map(r => (
                  <Button
                    key={r}
                    variant={localFilters.rating === r ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLocalFilters(f => ({
                      ...f,
                      rating: f.rating === r ? undefined : r
                    }))}
                    className="flex items-center gap-1"
                  >
                    <Star className="w-3 h-3 fill-current" />
                    {r}+
                  </Button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div>
              <h4 className="font-medium mb-3">Preço</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PRECO_LABELS).map(([key, val]) => (
                  <Button
                    key={key}
                    variant={localFilters.preco === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLocalFilters(f => ({
                      ...f,
                      preco: f.preco === key ? undefined : key
                    }))}
                  >
                    {val.icon} {val.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <h4 className="font-medium mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 12).map(tag => (
                  <Button
                    key={tag}
                    variant={localFilters.tags?.includes(tag) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLocalFilters(f => {
                      const current = f.tags || [];
                      const updated = current.includes(tag)
                        ? current.filter(t => t !== tag)
                        : [...current, tag];
                      return { ...f, tags: updated.length ? updated : undefined };
                    })}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Action buttons */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={handleReset}>
            Limpar
          </Button>
          <Button className="flex-1" onClick={handleApply}>
            Aplicar filtros
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================
// MAIN SCREEN
// ============================================

interface TourismScreenProps {
  scrollRef?: (el: HTMLDivElement | null) => void;
}

export default function TourismScreen({ scrollRef }: TourismScreenProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TourismCategory | 'todos'>('todos');
  const [filters, setFilters] = useState<TourismFilters>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Combine filters
  const combinedFilters = useMemo<TourismFilters>(() => ({
    ...filters,
    categoria: selectedCategory === 'todos' ? undefined : selectedCategory,
    search: searchQuery || undefined,
  }), [filters, selectedCategory, searchQuery]);

  const {
    spots,
    featuredSpots,
    usedCategories,
    allTags,
    isLoading,
    likeSpot,
    saveSpot,
    isOnline,
  } = useOfflineTourism(combinedFilters);

  const handleSpotClick = useCallback((id: string) => {
    navigate(`/ponto-turistico/${id}`);
  }, [navigate]);

  const clearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  // All categories for chips (including 'todos')
  const categoryChips: (TourismCategory | 'todos')[] = ['todos', ...usedCategories];

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm safe-top border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">Pontos Turísticos</h1>
              <p className="text-sm text-muted-foreground">
                Descubra o melhor de Tijucas
              </p>
            </div>
            {!isOnline && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>

          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar lugares, atividades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 rounded-full bg-muted/50"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <FiltersSheet
              filters={filters}
              onChange={setFilters}
              usedCategories={usedCategories}
              allTags={allTags}
            />
          </div>
        </div>

        {/* Category chips */}
        <ScrollArea className="px-4 pb-3">
          <div className="flex gap-2">
            {categoryChips.map(cat => (
              <CategoryChip
                key={cat}
                category={cat}
                isActive={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Content */}
      <div className="px-4 pb-24 mt-4">
        {/* Featured section (only when no filters) */}
        {!searchQuery && selectedCategory === 'todos' && !Object.keys(filters).length && featuredSpots.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              Destaques
            </h2>
            <ScrollArea className="-mx-4 px-4">
              <div className="flex gap-3">
                {featuredSpots.map(spot => (
                  <motion.div
                    key={spot.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSpotClick(spot.id)}
                    className="w-[280px] shrink-0 bg-card rounded-2xl overflow-hidden shadow-card cursor-pointer"
                  >
                    <div className="relative aspect-[16/10]">
                      <img
                        src={spot.imageUrl}
                        alt={spot.titulo}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-white font-bold line-clamp-1">{spot.titulo}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating rating={spot.rating} />
                          <span className="text-white/80 text-xs">
                            {Number(spot.rating || 0).toFixed(1)} ({spot.reviewsCount})
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {/* Results count */}
        {!isLoading && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {spots.length} {spots.length === 1 ? 'lugar encontrado' : 'lugares encontrados'}
            </p>
          </div>
        )}

        {/* Spots grid */}
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div className="space-y-4">
              <SpotCardSkeleton />
              <SpotCardSkeleton />
              <SpotCardSkeleton />
            </div>
          ) : spots.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-foreground mb-2">
                Nenhum lugar encontrado
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tente ajustar os filtros ou buscar por outro termo
              </p>
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setSelectedCategory('todos');
                setFilters({});
              }}>
                Limpar filtros
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {spots.map(spot => (
                <SpotCard
                  key={spot.id}
                  spot={spot}
                  onLike={() => likeSpot(spot.id)}
                  onSave={() => saveSpot(spot.id)}
                  onClick={() => handleSpotClick(spot.id)}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
