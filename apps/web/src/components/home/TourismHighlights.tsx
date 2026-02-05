/**
 * TourismHighlights - Interactive carousel of featured tourism spots
 * Mobile-first, offline-first, native-first
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { MapPin, Star, ChevronRight, Camera, Heart, Sparkles } from 'lucide-react';
import { useOfflineTourism } from '@/hooks/useOfflineTourism';
import { hapticFeedback } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';
import { TOURISM_CATEGORIES } from '@/types/tourism.types';
import { AggregatorTourismItem } from '@/types/home.types';

interface TourismHighlightsProps {
  onNavigate?: (tab: string) => void;
  data?: AggregatorTourismItem[]; // External data from aggregator
}

/**
 * Map aggregator tourism data to component format
 */
function mapAggregatorToSpots(items: AggregatorTourismItem[]) {
  return items.map((item) => ({
    id: item.id,
    titulo: item.titulo,
    slug: item.slug,
    descricaoCurta: item.desc_curta,
    categoria: item.categoria,
    imageUrl: item.image_url,
    rating: item.rating_avg,
    reviewsCount: 0,
    liked: false,
    endereco: '',
    bairroNome: '',
  }));
}

export default function TourismHighlights({ onNavigate, data: externalData }: TourismHighlightsProps) {
  const navigate = useNavigate();
  const { featuredSpots: hookSpots, isLoading: hookLoading, likeSpot } = useOfflineTourism();

  // Use external data if available, otherwise use hook data
  const featuredSpots = useMemo(() => {
    if (externalData && externalData.length > 0) {
      return mapAggregatorToSpots(externalData);
    }
    return hookSpots;
  }, [externalData, hookSpots]);

  // Only show loading if no external data and hook is loading
  const isLoading = !externalData && hookLoading;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play carousel
  useEffect(() => {
    if (isPaused || featuredSpots.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % featuredSpots.length);
    }, 4000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, featuredSpots.length]);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;

    if (info.offset.x < -threshold) {
      setActiveIndex(prev => (prev + 1) % featuredSpots.length);
      hapticFeedback('light');
    } else if (info.offset.x > threshold) {
      setActiveIndex(prev => (prev - 1 + featuredSpots.length) % featuredSpots.length);
      hapticFeedback('light');
    }
  }, [featuredSpots.length]);

  const handleSpotTap = useCallback((spotId: string) => {
    hapticFeedback('selection');
    navigate(`/ponto-turistico/${spotId}`);
  }, [navigate]);

  const handleLike = useCallback((e: React.MouseEvent, spotId: string) => {
    e.stopPropagation();
    hapticFeedback('medium');
    likeSpot(spotId);
  }, [likeSpot]);

  const handleViewAll = useCallback(() => {
    hapticFeedback('selection');
    navigate('/pontos-turisticos');
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="h-6 w-40 skeleton-shimmer rounded" />
          <div className="h-5 w-20 skeleton-shimmer rounded" />
        </div>
        <div className="h-48 skeleton-shimmer rounded-2xl" />
      </div>
    );
  }

  if (!featuredSpots || featuredSpots.length === 0) {
    return null;
  }

  const currentSpot = featuredSpots[activeIndex];
  const categoryConfig = TOURISM_CATEGORIES[currentSpot.categoria];

  return (
    <div className="py-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}>
            <Camera className="w-5 h-5 text-primary" />
          </motion.div>
          Descubra Tijucas
        </h2>
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleViewAll} className="flex items-center gap-1 text-sm text-primary font-medium">
          Ver todos <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Main Carousel Card */}
      <div className="px-4" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="relative h-52 rounded-2xl overflow-hidden shadow-xl cursor-grab active:cursor-grabbing"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSpot.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
              onClick={() => handleSpotTap(currentSpot.id)}
            >
              {/* Background Image */}
              {currentSpot.imageUrl ? (
                <img src={currentSpot.imageUrl} alt={currentSpot.titulo} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary" />
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Category badge */}
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 text-foreground backdrop-blur-sm flex items-center gap-1">
                  <span>{categoryConfig?.icon || '📍'}</span>
                  {categoryConfig?.label || currentSpot.categoria}
                </span>
              </motion.div>

              {/* Like button */}
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={(e) => handleLike(e, currentSpot.id)}
                className={cn(
                  "absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center bg-white/90 backdrop-blur-sm shadow-lg",
                  currentSpot.liked && "bg-red-500"
                )}
              >
                <Heart className={cn("w-5 h-5 transition-all", currentSpot.liked ? "fill-white text-white" : "text-foreground")} />
              </motion.button>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                {/* Rating */}
                {currentSpot.rating > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500 text-white">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs font-bold">
                        {typeof currentSpot.rating === 'number'
                          ? currentSpot.rating.toFixed(1)
                          : Number(currentSpot.rating || 0).toFixed(1)}
                      </span>
                    </div>
                    <span className="text-xs text-white/80">({currentSpot.reviewsCount} avaliações)</span>
                  </div>
                )}

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-1">{currentSpot.titulo}</h3>

                {/* Location */}
                <div className="flex items-center gap-1 text-xs text-white/80">
                  <MapPin className="w-3 h-3" />
                  {currentSpot.bairroNome || currentSpot.endereco?.split(',')[0]}
                </div>

                {/* CTA */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-foreground text-sm font-semibold mt-3"
                  onClick={(e) => { e.stopPropagation(); handleSpotTap(currentSpot.id); }}
                >
                  <Sparkles className="w-4 h-4" /> Explorar
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-1.5 mt-3">
          {featuredSpots.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => { setActiveIndex(index); hapticFeedback('light'); }}
              className={cn("rounded-full transition-all duration-300", index === activeIndex ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-muted-foreground/30")}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
