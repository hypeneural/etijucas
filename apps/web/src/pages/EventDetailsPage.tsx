import { useMemo, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTenantNavigate } from '@/hooks';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import {
  ArrowLeft,
  Share2,
  Heart,
  Calendar,
  MapPin,
  Ticket,
  Link as LinkIcon,
  Instagram,
  MessageCircle,
  Globe,
  Youtube,
  Music2,
  Clock,
  Users,
  CheckCircle,
  Bell,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useEventFilters } from '@/hooks/useEventFilters';
import { formatDateLong, formatTimeRange } from '@/utils/date';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const SOCIAL_LINKS = [
  { key: 'instagram', icon: Instagram, label: 'Instagram', color: 'from-pink-500 to-purple-500' },
  { key: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', color: 'from-green-500 to-green-600' },
  { key: 'website', icon: Globe, label: 'Site', color: 'from-blue-500 to-blue-600' },
  { key: 'youtube', icon: Youtube, label: 'YouTube', color: 'from-red-500 to-red-600' },
  { key: 'tiktok', icon: Music2, label: 'TikTok', color: 'from-gray-800 to-black' },
];

const CATEGORY_LABELS: Record<string, string> = {
  show: 'Show',
  festa: 'Festa',
  cultura: 'Cultura',
  infantil: 'Infantil',
  gastronomico: 'Gastronômico',
  esportes: 'Esportes',
};

const CATEGORY_COLORS: Record<string, string> = {
  show: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  festa: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  cultura: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  infantil: 'bg-green-500/20 text-green-300 border-green-500/30',
  gastronomico: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  esportes: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
};

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useTenantNavigate();
  const { allEvents, toggleFavorite, isFavorite } = useEventFilters();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll({ container: containerRef });
  const headerOpacity = useTransform(scrollY, [0, 200], [0, 1]);
  const imageScale = useTransform(scrollY, [0, 200], [1, 1.1]);
  const imageOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setHeaderVisible(latest > 150);
  });

  const event = allEvents.find((item) => item.id === eventId);

  const relatedEvents = useMemo(() => {
    if (!event) return [];
    return allEvents
      .filter(
        (item) =>
          item.id !== event.id &&
          (item.category.slug === event.category.slug || item.venue?.bairro?.id === event.venue?.bairro?.id)
      )
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, 5);
  }, [allEvents, event]);

  if (!event) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-background flex flex-col items-center justify-center gap-4"
      >
        <div className="rounded-full bg-muted p-6">
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Evento não encontrado.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </motion.div>
    );
  }

  const handleShare = async () => {
    const shareData = {
      title: event.title,
      text: `${event.title} • ${event.venue.name}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({ title: 'Compartilhado!' });
      } catch { }
      return;
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareData.url);
        toast({ title: 'Link copiado!', description: 'Cole onde quiser compartilhar.' });
      } catch { }
    }
  };

  const handleToggleFavorite = () => {
    toggleFavorite(event.id);
    const isFav = !isFavorite(event.id);
    toast({
      title: isFav ? 'Adicionado aos favoritos' : 'Removido dos favoritos',
      description: isFav ? 'Você será notificado sobre este evento.' : undefined,
    });
  };

  const handleConfirmPresence = () => {
    setIsConfirmed(!isConfirmed);
    if (!isConfirmed) {
      toast({
        title: '🎉 Presença confirmada!',
        description: 'Você receberá lembretes sobre este evento.',
      });
    }
  };

  const handleAddToCalendar = () => {
    toast({
      title: 'Adicionado ao calendário',
      description: 'Lembrete configurado para o dia do evento.',
    });
  };

  const priceLabel = event.ticket?.type === 'free' ? 'Grátis' : `R$ ${event.ticket?.minPrice ?? 0}`;
  const isFav = isFavorite(event.id);
  const heroImage =
    event.media?.bannerImageMobile ??
    event.media?.bannerImage ??
    event.media?.coverImage ??
    event.coverImage ??
    '/placeholder.svg';
  const galleryImages = useMemo(() => {
    const gallery = (event.media?.gallery ?? []) as Array<{ url?: string } | string>;
    return gallery
      .map((item) => (typeof item === 'string' ? item : item?.url))
      .filter((item): item is string => Boolean(item));
  }, [event.media?.gallery]);

  return (
    <div ref={containerRef} className="min-h-screen bg-background overflow-y-auto">
      {/* Sticky Header - appears on scroll */}
      <motion.div
        style={{ opacity: headerOpacity }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur-xl',
          !headerVisible && 'pointer-events-none'
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 safe-top">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <p className="text-sm font-medium truncate max-w-[50%]">{event.title}</p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleToggleFavorite}>
              <Heart className={cn('h-4 w-4', isFav && 'fill-red-500 text-red-500')} />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Hero Image with Parallax */}
      <div className="relative h-80 overflow-hidden">
        <motion.img
          style={{ scale: imageScale, opacity: imageOpacity }}
          src={heroImage}
          alt={event.title}
          className="h-full w-full object-cover origin-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        {/* Floating back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 left-4 right-4 flex items-center justify-between safe-top"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm rounded-full h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm rounded-full h-10 w-10"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                className="bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm rounded-full h-10 w-10"
              >
                <Heart className={cn('h-5 w-5 transition-all', isFav && 'fill-red-400 text-red-400 scale-110')} />
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Event info overlay */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute bottom-4 left-4 right-4 text-white"
        >
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className={cn('border', CATEGORY_COLORS[event.category.slug] || 'bg-primary/20')}>
              {CATEGORY_LABELS[event.category.slug] ?? event.category.name}
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30">{priceLabel}</Badge>
            <Badge className="bg-white/20 text-white border-white/30">{event.flags.ageRating}</Badge>
          </div>
          <h1 className="text-2xl font-bold leading-tight">{event.title}</h1>
          <p className="text-sm text-white/80 mt-1 flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{event.popularityScore}+ interessados</span>
          </p>
        </motion.div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Quick Actions - Native feel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-3"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleConfirmPresence}
            className={cn(
              'flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all',
              isConfirmed
                ? 'bg-green-500/10 border-green-500/30 text-green-600'
                : 'bg-card border-border hover:bg-muted/50'
            )}
          >
            <CheckCircle className={cn('h-6 w-6', isConfirmed && 'fill-green-500')} />
            <span className="text-xs font-medium">{isConfirmed ? 'Confirmado!' : 'Confirmar'}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCalendar}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border bg-card border-border hover:bg-muted/50 transition-all"
          >
            <Bell className="h-6 w-6 text-primary" />
            <span className="text-xs font-medium">Lembrete</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border bg-card border-border hover:bg-muted/50 transition-all"
          >
            <Share2 className="h-6 w-6 text-primary" />
            <span className="text-xs font-medium">Compartilhar</span>
          </motion.button>
        </motion.div>

        {/* Date & Location Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="rounded-2xl p-4 bg-gradient-to-br from-card to-muted/30">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{formatDateLong(event.start)}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTimeRange(event.start, event.end)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{event.venue?.name}</p>
                  <p className="text-sm text-muted-foreground">{event.venue?.bairro?.nome}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue.address)}`,
                      '_blank'
                    )
                  }
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Mapa
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Ticket CTA - Inline instead of fixed */}
        {event.ticket?.purchaseUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="rounded-2xl p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/20">
                    <Ticket className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {event.ticket?.type === 'free' ? 'Entrada Gratuita' : `A partir de ${event.ticket?.minPrice ? `R$ ${event.ticket.minPrice}` : '???'}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.ticket?.type === 'free' ? 'Reserve seu lugar' : 'Garanta seu ingresso'}
                    </p>
                  </div>
                </div>
                <Button onClick={() => window.open(event.ticket!.purchaseUrl!, '_blank')}>
                  {event.ticket?.type === 'free' ? 'Reservar' : 'Comprar'}
                </Button>
              </div>

              {event.ticket?.lots && event.ticket.lots.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                  {event.ticket.lots.map((lot) => (
                    <div key={lot.name} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{lot.name}</span>
                      <span className="font-medium">R$ {lot.price}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Description */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Sobre o evento</h2>
            <Badge variant="outline" className="text-xs">
              {event.organizer?.name ?? 'Organizador'}
            </Badge>
          </div>
          <motion.div layout className="rounded-2xl border bg-card p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {expanded ? event.descriptionFull : event.descriptionShort}
            </p>
            <Button variant="link" size="sm" className="px-0 mt-2" onClick={() => setExpanded((prev) => !prev)}>
              {expanded ? 'Ler menos' : 'Ler mais'}
            </Button>
          </motion.div>
        </motion.section>

        {/* Schedule */}
        {(() => {
          // Safe schedule access handling both legacy array and new object structure
          const scheduleItems = Array.isArray(event.schedule)
            ? event.schedule
            : event.schedule?.items;

          if (!scheduleItems || scheduleItems.length === 0) return null;

          return (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              <h2 className="text-lg font-semibold">Programação</h2>
              <Accordion type="multiple" className="space-y-2">
                {scheduleItems.map((item, index) => (
                  <AccordionItem
                    key={`${event.id}-schedule-${index}`}
                    value={`${event.id}-${index}`}
                    className="border rounded-xl overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-primary tabular-nums">{item.time}</span>
                        <span className="text-sm font-medium">{item.title}</span>
                      </div>
                    </AccordionTrigger>
                    {item.description && (
                      <AccordionContent className="px-4 pb-4 pt-1 text-muted-foreground">
                        {item.description}
                      </AccordionContent>
                    )}
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.section>
          );
        })()}


        {/* Venue Flags */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex flex-wrap gap-2"
        >
          {event.flags.parking && (
            <Badge variant="outline" className="gap-1">
              <span className="text-lg">🅿️</span> Estacionamento
            </Badge>
          )}
          {event.flags.accessibility && (
            <Badge variant="outline" className="gap-1">
              <span className="text-lg">♿</span> Acessível
            </Badge>
          )}
          {event.flags.outdoor && (
            <Badge variant="outline" className="gap-1">
              <span className="text-lg">🌳</span> Ao ar livre
            </Badge>
          )}
          {(event.flags as { kids?: boolean }).kids && (
            <Badge variant="outline" className="gap-1">
              <span className="text-lg">👶</span> Kids
            </Badge>
          )}
        </motion.div>

        {/* Social Links */}
        {event.links && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <h2 className="text-lg font-semibold">Links e redes</h2>
            <div className="grid grid-cols-2 gap-2">
              {SOCIAL_LINKS.map((link) => {
                const url = (event.links as any)[link.key];
                if (!url) return null;
                const Icon = link.icon;
                return (
                  <motion.button
                    key={link.key}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.open(url, '_blank')}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-xl border bg-gradient-to-r',
                      link.color,
                      'text-white'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </motion.button>
                );
              })}
              {event.links.other && event.links.other.map((item, index) => (
                <motion.button
                  key={`other-${index}`}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.open(item.url, '_blank')}
                  className="flex items-center gap-2 p-3 rounded-xl border bg-card hover:bg-muted/50"
                >
                  <LinkIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{item.label ?? 'Link'}</span>
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}

        {/* Gallery */}
        {
          galleryImages.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="space-y-3"
            >
              <h2 className="text-lg font-semibold">Galeria</h2>
              <div className="grid grid-cols-2 gap-3">
                {galleryImages.map((img, index) => (
                  <motion.button
                    key={`${event.id}-gallery-${index}`}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setLightboxImage(img)}
                    className="overflow-hidden rounded-2xl aspect-[4/3]"
                  >
                    <img src={img} alt="Galeria do evento" className="h-full w-full object-cover" />
                  </motion.button>
                ))}
              </div>
            </motion.section>
          )
        }

        {/* Related Events */}
        {
          relatedEvents.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-3 pb-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Você também pode curtir</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
                {relatedEvents.map((related, index) => (
                  <motion.button
                    key={related.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate(`/agenda/${related.id}`)}
                    className="min-w-[180px] rounded-2xl border bg-card p-3 text-left shadow-card snap-start"
                  >
                    <img
                      src={related.media?.coverImage ?? related.coverImage ?? '/placeholder.svg'}
                      alt={related.title}
                      className="h-24 w-full rounded-xl object-cover"
                    />
                    <p className="mt-2 text-sm font-semibold line-clamp-2">{related.title}</p>
                    <p className="text-xs text-muted-foreground">{related.venue?.bairro?.nome ?? ''}</p>
                  </motion.button>
                ))}
              </div>
            </motion.section>
          )
        }
      </div >

      {/* Lightbox */}
      <AnimatePresence>
        {
          lightboxImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-6"
              onClick={() => setLightboxImage(null)}
            >
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', damping: 25 }}
                src={lightboxImage}
                alt="Evento"
                className="max-h-[85vh] w-full rounded-2xl object-contain"
              />
            </motion.div>
          )
        }
      </AnimatePresence >
    </div >
  );
}
