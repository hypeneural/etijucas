import { motion } from 'framer-motion';
import { MapPin, Share2, Ticket, Heart, Clock, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { EventWithDates } from '@/types/events';
import { formatTimeRange } from '@/utils/date';

interface EventCardProps {
  event: EventWithDates;
  isFavorite: boolean;
  onToggleFavorite: (eventId: string) => void;
  onOpen: (eventId: string) => void;
  variant?: 'default' | 'compact';
}

const CATEGORY_LABELS: Record<string, string> = {
  show: 'Show',
  festa: 'Festa',
  cultura: 'Cultura',
  infantil: 'Infantil',
  gastronomico: 'Gastronômico',
  esportes: 'Esportes',
};

const CATEGORY_COLORS: Record<string, string> = {
  show: 'bg-purple-500/10 text-purple-600 border-purple-200',
  festa: 'bg-pink-500/10 text-pink-600 border-pink-200',
  cultura: 'bg-amber-500/10 text-amber-600 border-amber-200',
  infantil: 'bg-green-500/10 text-green-600 border-green-200',
  gastronomico: 'bg-orange-500/10 text-orange-600 border-orange-200',
  esportes: 'bg-blue-500/10 text-blue-600 border-blue-200',
};

export default function EventCard({
  event,
  isFavorite,
  onToggleFavorite,
  onOpen,
  variant = 'default'
}: EventCardProps) {
  const isFreeEvent = event.ticket?.type === 'free';
  const priceLabel = isFreeEvent ? 'Grátis' : `R$ ${event.ticket?.minPrice ?? 0}`;
  const timeRange = formatTimeRange(event.start, event.end);
  const categorySlug = typeof event.category === 'string' ? event.category : event.category?.slug ?? 'show';
  const categoryName = typeof event.category === 'string' ? event.category : event.category?.name ?? 'Evento';
  const bairroNome = event.venue?.bairro?.nome ?? 'Tijucas';

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: event.title,
      text: `${event.title} • ${event.venue?.name ?? 'Evento em Tijucas'}`,
      url: `${window.location.origin}/agenda/${event.id}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch { }
      return;
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareData.url);
      } catch { }
    }
  };

  const handleMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const geo = event.venue?.coordinates;
    const query = geo
      ? `${geo.latitude},${geo.longitude}`
      : `${event.venue?.name ?? 'Tijucas'}, ${bairroNome}, Tijucas - SC`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
  };

  const handleTickets = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.ticket?.purchaseUrl) {
      window.open(event.ticket.purchaseUrl, '_blank');
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(event.id);
  };

  // Compact variant for horizontal scroll lists
  if (variant === 'compact') {
    return (
      <motion.div
        whileTap={{ scale: 0.96 }}
        onClick={() => onOpen(event.id)}
        className="cursor-pointer min-w-[280px] snap-start"
      >
        <Card className="relative overflow-hidden rounded-2xl border-border/60 bg-card shadow-card h-full">
          {/* Cover image */}
          <div className="relative h-36">
            <img
              src={event.coverImage ?? '/placeholder.svg'}
              alt={event.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            {/* Favorite button */}
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleFavorite}
              className={cn(
                'absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center',
                'bg-black/40 backdrop-blur-sm',
                isFavorite ? 'text-red-400' : 'text-white'
              )}
            >
              <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
            </motion.button>

            {/* Bottom info */}
            <div className="absolute bottom-2 left-2 right-2">
              <Badge className={cn('text-xs', CATEGORY_COLORS[categorySlug])}
              >
                {categoryName}
              </Badge>
            </div>
          </div>

          <div className="p-3 space-y-2">
            <h3 className="font-semibold text-sm line-clamp-2 leading-tight">{event.title}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{timeRange}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{bairroNome}</span>
              <Badge variant="outline" className="text-xs">{priceLabel}</Badge>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Default variant - full card
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={() => onOpen(event.id)}
      className="cursor-pointer"
    >
      <Card className="relative overflow-hidden rounded-2xl border-border/60 bg-card shadow-card group">
        <div className="flex">
          {/* Cover image */}
          <div className="relative w-28 h-32 shrink-0">
            <img
              src={event.coverImage ?? '/placeholder.svg'}
              alt={event.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />

            {/* Price overlay */}
            <div className="absolute bottom-2 left-2">
              <Badge
                className={cn(
                  'text-xs font-bold',
                  isFreeEvent
                    ? 'bg-green-500/90 text-white'
                    : 'bg-black/70 text-white'
                )}
              >
                {priceLabel}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-3 flex flex-col justify-between min-h-[128px]">
            <div>
              <div className="flex items-start justify-between gap-2">
                <Badge
                  variant="secondary"
                  className={cn('text-xs mb-1.5', CATEGORY_COLORS[categorySlug])}
                >
                  {categoryName}
                </Badge>
                <motion.button
                  whileTap={{ scale: 0.75 }}
                  animate={{ scale: isFavorite ? [1, 1.2, 1] : 1 }}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full -mt-1 -mr-1',
                    'transition-colors',
                    isFavorite ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'
                  )}
                  onClick={handleFavorite}
                >
                  <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
                </motion.button>
              </div>
              <h3 className="font-semibold text-sm leading-tight line-clamp-2">{event.title}</h3>
            </div>

            <div className="space-y-1.5 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 text-primary" />
                <span className="font-medium">{timeRange}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 text-primary" />
                <span className="truncate">{event.venue?.name ?? 'Local'} • {bairroNome}</span>
              </div>
            </div>

            {/* Bottom actions */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{event.popularityScore}+ interessados</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  onClick={handleMap}
                >
                  <MapPin className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  onClick={handleShare}
                >
                  <Share2 className="h-3.5 w-3.5" />
                </Button>
                {event.ticket?.purchaseUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full text-primary"
                    onClick={handleTickets}
                  >
                    <Ticket className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
