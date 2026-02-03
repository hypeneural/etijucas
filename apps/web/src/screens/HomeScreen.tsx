import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import HeroHeader from '@/components/home/HeroHeader';
import SearchBar from '@/components/home/SearchBar';
import TodayBentoGrid from '@/components/home/TodayBentoGrid';
import ReportCTA from '@/components/home/ReportCTA';
import ForumPreview from '@/components/home/ForumPreview';
import QuickAccessGrid from '@/components/home/QuickAccessGrid';
import AlertBanner from '@/components/home/AlertBanner';
import EventsCarousel from '@/components/home/EventsCarousel';
import TourismHighlights from '@/components/home/TourismHighlights';
import { InstallCard } from '@/components/home/InstallCard';
import { useAppStore } from '@/store/useAppStore';
import { TabId } from '@/components/layout/BottomTabBar';
import { useToast } from '@/hooks/use-toast';
import { hapticFeedback } from '@/hooks/useHaptics';

// Mock alerts (TODO: replace with real API)
import { alerts as mockAlerts } from '@/data/mockData';

interface HomeScreenProps {
  scrollRef: (el: HTMLDivElement | null) => void;
  onNavigate: (tab: TabId) => void;
}

// Constants for pull-to-refresh
const PULL_THRESHOLD = 80;
const MAX_PULL_DISTANCE = 120;
const RUBBER_BAND_FACTOR = 0.4; // Exponential resistance factor

export default function HomeScreen({ scrollRef, onNavigate }: HomeScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const { isRefreshing, setIsRefreshing } = useAppStore();
  const { toast } = useToast();
  const [isPulling, setIsPulling] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  // TODO: Replace with offline-first hooks when available
  const activeAlerts = mockAlerts;

  // Spring-based pull distance with damping for native feel
  const springPull = useSpring(0, {
    stiffness: 400,
    damping: 40,
    mass: 0.5,
  });

  // Transform spring value to visual height with rubber banding
  const pullHeight = useTransform(springPull, (value) => {
    if (value <= 0) return 0;
    // Rubber band effect: resistance increases as you pull further
    return MAX_PULL_DISTANCE * (1 - Math.exp(-value / MAX_PULL_DISTANCE * RUBBER_BAND_FACTOR * 5));
  });

  // Transform for rotation based on pull progress
  const iconRotation = useTransform(springPull, [0, PULL_THRESHOLD], [0, 180]);

  // Scale effect when threshold is reached
  const iconScale = useTransform(springPull, (value) =>
    value >= PULL_THRESHOLD ? 1.2 : 1
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    hapticFeedback('success');
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    setHasTriggered(false);
    toast({
      title: "Atualizado agora",
      description: "Conteúdo atualizado com sucesso!",
    });
  }, [setIsRefreshing, toast]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0 && !isRefreshing) {
      startYRef.current = e.touches[0].clientY;
      setIsPulling(true);
      setHasTriggered(false);
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    if (containerRef.current && containerRef.current.scrollTop > 0) {
      setIsPulling(false);
      springPull.set(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startYRef.current;

    if (deltaY > 0) {
      // Apply rubber banding: the further you pull, the harder it gets
      const rubberBandedDistance = deltaY * Math.pow(RUBBER_BAND_FACTOR, deltaY / MAX_PULL_DISTANCE);
      springPull.set(Math.min(rubberBandedDistance, MAX_PULL_DISTANCE * 1.5));

      // Trigger haptic when crossing threshold
      if (rubberBandedDistance >= PULL_THRESHOLD && !hasTriggered) {
        hapticFeedback('medium');
        setHasTriggered(true);
      }
    }
  }, [isPulling, isRefreshing, springPull, hasTriggered]);

  const handleTouchEnd = useCallback(() => {
    if (!isPulling) return;

    const currentPull = springPull.get();

    if (currentPull >= PULL_THRESHOLD && !isRefreshing) {
      // Animate to refreshing state
      springPull.set(60);
      handleRefresh();
    } else {
      // Spring back
      springPull.set(0);
    }

    setIsPulling(false);
  }, [isPulling, springPull, isRefreshing, handleRefresh]);

  // Reset spring when refresh completes
  React.useEffect(() => {
    if (!isRefreshing) {
      springPull.set(0);
    }
  }, [isRefreshing, springPull]);

  return (
    <div
      ref={(el) => {
        if (containerRef) (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        scrollRef(el);
      }}
      className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Alert Banner - Sticky at top */}
      <AlertBanner
        alerts={activeAlerts}
        onTap={(alert) => {
          hapticFeedback('selection');
          // TODO: Navigate to alert detail
        }}
      />

      {/* Pull to refresh indicator with spring physics */}
      <AnimatePresence>
        {(springPull.get() > 0 || isRefreshing) && (
          <motion.div
            style={{ height: isRefreshing ? 60 : pullHeight }}
            className="flex items-center justify-center bg-gradient-to-b from-primary/10 to-transparent overflow-hidden"
          >
            <motion.div
              style={{
                rotate: isRefreshing ? undefined : iconRotation,
                scale: iconScale,
              }}
              animate={isRefreshing ? { rotate: 360 } : undefined}
              transition={isRefreshing ? {
                repeat: Infinity,
                duration: 1,
                ease: 'linear'
              } : undefined}
              className="flex items-center justify-center"
            >
              <RefreshCw
                className={`w-6 h-6 transition-colors ${hasTriggered || isRefreshing
                  ? 'text-primary'
                  : 'text-muted-foreground'
                  }`}
              />
            </motion.div>
            {hasTriggered && !isRefreshing && (
              <motion.span
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute mt-10 text-xs text-primary font-medium"
              >
                Solte para atualizar
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <HeroHeader
        scrollRef={containerRef}
        todayEventsCount={0}
        hasActiveAlert={activeAlerts.length > 0}
        streakDays={3} // TODO: Get from user store
      />

      <div className="pb-24">
        <SearchBar onNavigate={onNavigate} />

        {/* Install App Card - inline */}
        <div className="px-4 pb-2">
          <InstallCard />
        </div>

        <TodayBentoGrid onNavigate={onNavigate} />

        {/* Events Carousel */}
        <EventsCarousel onNavigate={onNavigate} />

        {/* Tourism Highlights */}
        <TourismHighlights onNavigate={onNavigate} />

        <ReportCTA onNavigate={onNavigate} />
        <ForumPreview onNavigate={onNavigate} />
        <QuickAccessGrid onNavigate={onNavigate} />
      </div>
    </div>
  );
}

