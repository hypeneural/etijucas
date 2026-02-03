// TourismDetailPage - Perfil do Ponto Turístico (TripAdvisor-like)
// Mobile-first, offline-first, native-first

import React, { useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  Bookmark,
  Share2,
  Star,
  MapPin,
  Clock,
  Phone,
  Globe,
  Instagram,
  Navigation,
  ChevronRight,
  MessageCircle,
  CheckCircle2,
  Play,
  X,
  ThumbsUp,
  Send,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useTourismSpot } from '@/hooks/useOfflineTourism';
import { TOURISM_CATEGORIES, PRECO_LABELS } from '@/types/tourism.types';
import type { TourismMedia, TourismReview, TourismOpeningHours } from '@/types/tourism.types';

// ============================================
// SUB-COMPONENTS
// ============================================

// Star rating component
function StarRating({ rating, size = 'md', showValue = true }: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <Star key={i} className={`${sizes[size]} fill-yellow-400 text-yellow-400`} />
      );
    } else if (i === fullStars && hasHalf) {
      stars.push(
        <div key={i} className="relative">
          <Star className={`${sizes[size]} text-gray-300`} />
          <Star
            className={`${sizes[size]} fill-yellow-400 text-yellow-400 absolute top-0 left-0`}
            style={{ clipPath: 'inset(0 50% 0 0)' }}
          />
        </div>
      );
    } else {
      stars.push(
        <Star key={i} className={`${sizes[size]} text-gray-300`} />
      );
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">{stars}</div>
      {showValue && (
        <span className={`font-semibold ${size === 'lg' ? 'text-lg' : ''}`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// Image gallery viewer
function GalleryViewer({
  media,
  initialIndex = 0,
  onClose
}: {
  media: TourismMedia[];
  initialIndex?: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentItem = media[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 safe-top">
        <span className="text-white/80 text-sm">
          {currentIndex + 1} / {media.length}
        </span>
        <button onClick={onClose}>
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Media */}
      <div className="flex-1 flex items-center justify-center p-4">
        {currentItem.type === 'video' ? (
          <div className="relative w-full max-w-lg aspect-video bg-black rounded-lg overflow-hidden">
            <img
              src={currentItem.thumbnailUrl || currentItem.url}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </div>
          </div>
        ) : (
          <img
            src={currentItem.url}
            alt={currentItem.caption || ''}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        )}
      </div>

      {/* Caption */}
      {currentItem.caption && (
        <div className="p-4 text-center">
          <p className="text-white/80 text-sm">{currentItem.caption}</p>
        </div>
      )}

      {/* Thumbnails */}
      <ScrollArea className="p-4 safe-bottom">
        <div className="flex gap-2 justify-center">
          {media.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setCurrentIndex(idx)}
              className={`
                w-16 h-16 rounded-lg overflow-hidden shrink-0
                ${idx === currentIndex ? 'ring-2 ring-white' : 'opacity-50'}
              `}
            >
              <img
                src={item.thumbnailUrl || item.url}
                alt=""
                className="w-full h-full object-cover"
              />
              {item.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </motion.div>
  );
}

// Opening hours display
function OpeningHours({ hours }: { hours: TourismOpeningHours[] }) {
  const today = new Date().getDay();
  const [expanded, setExpanded] = useState(false);

  const todayHours = hours.find(h => h.day === today);
  const isOpen = todayHours && !todayHours.isClosed;

  return (
    <div className="bg-muted/50 rounded-xl p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <div className="text-left">
            <span className={`font-medium ${isOpen ? 'text-green-600' : 'text-red-600'}`}>
              {isOpen ? 'Aberto agora' : 'Fechado'}
            </span>
            {todayHours && !todayHours.isClosed && (
              <span className="text-sm text-muted-foreground ml-2">
                · até {todayHours.close}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              {hours.map(h => (
                <div
                  key={h.day}
                  className={`flex justify-between text-sm ${h.day === today ? 'font-medium' : ''}`}
                >
                  <span>{h.dayLabel}</span>
                  <span className={h.isClosed ? 'text-red-600' : ''}>
                    {h.isClosed ? 'Fechado' : `${h.open} - ${h.close}`}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Review card
function ReviewCard({ review, onLike }: { review: TourismReview; onLike?: () => void }) {
  const date = new Date(review.createdAt);
  const formattedDate = date.toLocaleDateString('pt-BR', {
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm">
      {/* Author */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={review.autor.avatarUrl} />
          <AvatarFallback>{review.autor.nome.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{review.autor.nome}</span>
            {review.autor.reviewsCount && (
              <span className="text-xs text-muted-foreground">
                {review.autor.reviewsCount} avaliações
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRating rating={review.rating} size="sm" showValue={false} />
            <span className="text-xs text-muted-foreground">{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      {review.titulo && (
        <h4 className="font-medium text-foreground mb-1">{review.titulo}</h4>
      )}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {review.texto}
      </p>

      {/* Photos */}
      {review.fotos && review.fotos.length > 0 && (
        <div className="flex gap-2 mt-3">
          {review.fotos.slice(0, 3).map((foto, idx) => (
            <div key={idx} className="w-20 h-20 rounded-lg overflow-hidden">
              <img src={foto} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          {review.fotos.length > 3 && (
            <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
              <span className="text-sm font-medium">+{review.fotos.length - 3}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onLike}
          className="flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <ThumbsUp className={`w-4 h-4 ${review.liked ? 'fill-primary text-primary' : ''}`} />
          <span>Útil ({review.likesCount})</span>
        </motion.button>
      </div>
    </div>
  );
}

// Write review sheet
function WriteReviewSheet({
  spotName,
  onSubmit
}: {
  spotName: string;
  onSubmit: (data: { rating: number; text: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = () => {
    if (rating > 0 && text.trim()) {
      onSubmit({ rating, text });
      setOpen(false);
      setRating(0);
      setText('');
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="w-full"
        variant="outline"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Escrever avaliação
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Avaliar {spotName}</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Rating selector */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Toque nas estrelas para avaliar
              </p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <motion.button
                    key={star}
                    whileTap={{ scale: 0.9 }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={`w-10 h-10 ${star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                        }`}
                    />
                  </motion.button>
                ))}
              </div>
              {rating > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-sm font-medium"
                >
                  {['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'][rating]}
                </motion.p>
              )}
            </div>

            {/* Text */}
            <div>
              <Textarea
                placeholder="Conte sua experiência neste lugar..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[120px] resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {text.length}/500
              </p>
            </div>

            {/* Add photos */}
            <Button variant="outline" className="w-full">
              <Camera className="w-4 h-4 mr-2" />
              Adicionar fotos
            </Button>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || !text.trim()}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Publicar avaliação
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function TourismDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);

  const { spot, reviews, isLoading, likeSpot, saveSpot, createReview, isCreatingReview } = useTourismSpot(id || '');

  const categoryInfo = spot?.categoria ? TOURISM_CATEGORIES[spot.categoria] : null;

  const handleShare = async () => {
    if (navigator.share && spot) {
      try {
        await navigator.share({
          title: spot.titulo,
          text: spot.descCurta,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error
      }
    }
  };

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setShowGallery(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="w-full h-64" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-medium mb-2">Lugar não encontrado</h2>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero image */}
      <div className="relative">
        <AspectRatio ratio={4 / 3}>
          <img
            src={spot.imageUrl}
            alt={spot.titulo}
            className="w-full h-full object-cover"
          />
        </AspectRatio>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

        {/* Top navigation */}
        <div className="absolute top-0 left-0 right-0 safe-top p-4 flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={saveSpot}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg"
            >
              <Bookmark className={`w-5 h-5 ${spot.isSaved ? 'fill-primary text-primary' : ''}`} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg"
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Gallery count badge */}
        {spot.gallery && spot.gallery.length > 1 && (
          <button
            onClick={() => openGallery(0)}
            className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur text-white text-sm flex items-center gap-1.5"
          >
            <Camera className="w-4 h-4" />
            {spot.gallery.length} fotos
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 -mt-6 relative z-10">
        {/* Title card */}
        <div className="bg-card rounded-2xl p-4 shadow-lg mb-4">
          <div className="flex items-start justify-between mb-2">
            {categoryInfo && (
              <Badge className={categoryInfo.color}>
                {categoryInfo.icon} {categoryInfo.label}
              </Badge>
            )}
            {spot.isVerificado && (
              <div className="flex items-center gap-1 text-primary text-xs">
                <CheckCircle2 className="w-4 h-4" />
                Verificado
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">{spot.titulo}</h1>

          {/* Rating */}
          <div className="flex items-center gap-3 mb-3">
            <StarRating rating={spot.rating} size="lg" />
            <span className="text-muted-foreground">
              {spot.reviewsCount} avaliações
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="text-sm">{spot.endereco}</span>
          </div>

          {/* Quick info badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            {spot.preco && (
              <Badge variant="secondary">
                {PRECO_LABELS[spot.preco]?.icon} {PRECO_LABELS[spot.preco]?.label}
              </Badge>
            )}
            {spot.duracao && (
              <Badge variant="secondary">
                <Clock className="w-3 h-3 mr-1" />
                {spot.duracao}
              </Badge>
            )}
          </div>
        </div>

        {/* Gallery thumbnails */}
        {spot.gallery && spot.gallery.length > 0 && (
          <ScrollArea className="mb-4 -mx-4 px-4">
            <div className="flex gap-2">
              {spot.gallery.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => openGallery(idx)}
                  className="w-24 h-24 rounded-xl overflow-hidden shrink-0 relative"
                >
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.caption || ''}
                    className="w-full h-full object-cover"
                  />
                  {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}

        {/* Description */}
        <div className="bg-card rounded-xl p-4 shadow-sm mb-4">
          <h2 className="font-semibold text-foreground mb-3">Sobre</h2>
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {spot.descLonga || spot.descCurta}
          </div>
        </div>

        {/* Opening hours */}
        {spot.horarios && spot.horarios.length > 0 && (
          <div className="mb-4">
            <OpeningHours hours={spot.horarios} />
          </div>
        )}

        {/* Contact & links */}
        <div className="bg-card rounded-xl p-4 shadow-sm mb-4 space-y-3">
          {spot.telefone && (
            <a
              href={`tel:${spot.telefone}`}
              className="flex items-center gap-3 text-foreground"
            >
              <Phone className="w-5 h-5 text-muted-foreground" />
              <span>{spot.telefone}</span>
            </a>
          )}
          {spot.website && (
            <a
              href={spot.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-primary"
            >
              <Globe className="w-5 h-5" />
              <span className="truncate">{spot.website.replace(/^https?:\/\//, '')}</span>
            </a>
          )}
          {spot.instagram && (
            <a
              href={`https://instagram.com/${spot.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-pink-600"
            >
              <Instagram className="w-5 h-5" />
              <span>{spot.instagram}</span>
            </a>
          )}
        </div>

        {/* How to get there */}
        {spot.comoChegar && (
          <div className="bg-card rounded-xl p-4 shadow-sm mb-4">
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Como chegar
            </h2>
            <p className="text-sm text-muted-foreground">
              {spot.comoChegar}
            </p>
            {spot.latitude && spot.longitude && (
              <Button
                variant="outline"
                className="mt-3 w-full"
                onClick={() => window.open(
                  `https://maps.google.com/?q=${spot.latitude},${spot.longitude}`,
                  '_blank'
                )}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Abrir no Google Maps
              </Button>
            )}
          </div>
        )}

        {/* Tips */}
        {spot.dicasVisita && spot.dicasVisita.length > 0 && (
          <div className="bg-secondary/10 rounded-xl p-4 mb-4">
            <h2 className="font-semibold text-foreground mb-3">💡 Dicas de visita</h2>
            <ul className="space-y-2">
              {spot.dicasVisita.map((dica, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-secondary">•</span>
                  <span className="text-muted-foreground">{dica}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Reviews section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">
              Avaliações ({reviews?.length || 0})
            </h2>
          </div>

          {/* Write review button */}
          <WriteReviewSheet
            spotName={spot.titulo}
            onSubmit={(data) => {
              createReview({
                rating: data.rating,
                texto: data.text,
              });
            }}
          />

          {/* Reviews list */}
          <div className="space-y-3 mt-4">
            {!reviews || reviews.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">
                  Seja o primeiro a avaliar este lugar!
                </p>
              </div>
            ) : (
              reviews.map(review => (
                <ReviewCard key={review.id} review={review} />
              ))
            )}
          </div>
        </div>

        {/* Tags */}
        {spot.tags && spot.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {spot.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Floating action bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border safe-bottom">
        <div className="max-w-md mx-auto flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={likeSpot}
            className={`
              flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium
              ${spot.liked
                ? 'bg-accent/10 text-accent border border-accent'
                : 'bg-muted text-foreground'
              }
            `}
          >
            <Heart className={`w-5 h-5 ${spot.liked ? 'fill-current' : ''}`} />
            {spot.likesCount}
          </motion.button>

          {spot.latitude && spot.longitude && (
            <Button
              className="flex-[2]"
              onClick={() => window.open(
                `https://maps.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`,
                '_blank'
              )}
            >
              <Navigation className="w-5 h-5 mr-2" />
              Como chegar
            </Button>
          )}
        </div>
      </div>

      {/* Gallery viewer */}
      <AnimatePresence>
        {showGallery && spot.gallery && spot.gallery.length > 0 && (
          <GalleryViewer
            media={spot.gallery}
            initialIndex={galleryIndex}
            onClose={() => setShowGallery(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
