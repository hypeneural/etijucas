import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

// Layout components
import TodayBentoGrid from '@/components/home/TodayBentoGrid';
import EventsCarousel from '@/components/home/EventsCarousel';
import TourismHighlights from '@/components/home/TourismHighlights';
import { InstallCard } from '@/components/home/InstallCard';
import { WeatherHomeCard } from '@/components/weather/WeatherHomeCard';

// New "Hoje em Tijucas" VIVO components
import HeaderSlim from '@/components/home/HeaderSlim';
import { AlertTotem } from '@/components/home/AlertTotem';
import { BoletimDoDia } from '@/components/home/BoletimDoDia';
import { FiscalizaVivo } from '@/components/home/FiscalizaVivo';
import { BocaNoTromboneVivo } from '@/components/home/BocaNoTromboneVivo';
import { TijucanosCounter } from '@/components/home/TijucanosCounter';
import QuickAccessGridVivo from '@/components/home/QuickAccessGridVivo';

// Hooks & Store
import { useHomeData } from '@/hooks/useHomeData';
import { useAppStore } from '@/store/useAppStore';
import { TabId } from '@/components/layout/BottomTabBar';
import { useToast } from '@/hooks/use-toast';
import { hapticFeedback } from '@/hooks/useHaptics';

interface HomeScreenProps {
  scrollRef: (el: HTMLDivElement | null) => void;
  onNavigate: (tab: TabId) => void;
}

// Constants for pull-to-refresh
const PULL_THRESHOLD = 80;
const MAX_PULL_DISTANCE = 120;
const RUBBER_BAND_FACTOR = 0.4;

export default function HomeScreen({ scrollRef, onNavigate }: HomeScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const { isRefreshing, setIsRefreshing } = useAppStore();
  const { toast } = useToast();
  const [isPulling, setIsPulling] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  // ========================================
  // Home Aggregator Hook
  // ========================================
  const {
    blocks,
    meta,
    refresh: refreshHomeData,
    isLoading,
    isStale,
  } = useHomeData();

  // Extract alerts from aggregator
  const alertItems = blocks.alerts?.payload?.alerts || [];

  // Spring-based pull distance
  const springPull = useSpring(0, {
    stiffness: 400,
    damping: 40,
    mass: 0.5,
  });

  const pullHeight = useTransform(springPull, (value) => {
    if (value <= 0) return 0;
    return MAX_PULL_DISTANCE * (1 - Math.exp(-value / MAX_PULL_DISTANCE * RUBBER_BAND_FACTOR * 5));
  });

  const iconRotation = useTransform(springPull, [0, PULL_THRESHOLD], [0, 180]);
  const iconScale = useTransform(springPull, (value) => value >= PULL_THRESHOLD ? 1.2 : 1);

  // ========================================
  // Pull to Refresh - Connected to aggregator
  // ========================================
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    hapticFeedback('success');

    // Refresh the aggregator data
    await refreshHomeData();

    setIsRefreshing(false);
    setHasTriggered(false);
    toast({
      title: "Atualizado agora",
      description: "Conteúdo atualizado com sucesso!",
    });
  }, [setIsRefreshing, toast, refreshHomeData]);

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
      const rubberBandedDistance = deltaY * Math.pow(RUBBER_BAND_FACTOR, deltaY / MAX_PULL_DISTANCE);
      springPull.set(Math.min(rubberBandedDistance, MAX_PULL_DISTANCE * 1.5));

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
      springPull.set(60);
      handleRefresh();
    } else {
      springPull.set(0);
    }

    setIsPulling(false);
  }, [isPulling, springPull, isRefreshing, handleRefresh]);

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
      {/* ========================================
          HEADER SLIM - Compact with inline weather
          ======================================== */}
      <HeaderSlim
        scrollRef={containerRef}
        weather={blocks.weather?.payload}
        notificationCount={alertItems.length}
        hasActiveAlert={alertItems.length > 0}
      />

      {/* Pull to refresh indicator */}
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

      {/* ========================================
          ALERT TOTEM - Animated ticker for alerts
          ======================================== */}
      {alertItems.length > 0 && (
        <AlertTotem
          alerts={alertItems}
          onAlertClick={(alert) => {
            hapticFeedback('selection');
            // TODO: Navigate to alert detail
          }}
        />
      )}

      <div className="pb-24 space-y-4">
        {/* Install App Card */}
        <div className="px-4">
          <InstallCard />
        </div>

        {/* ========================================
            BOLETIM DO DIA - Daily Summary
            ======================================== */}
        {blocks.boletim?.payload && (
          <div className="px-4">
            <BoletimDoDia data={blocks.boletim.payload} />
          </div>
        )}

        {/* Weather Card - Detailed */}
        <div className="px-4">
          <WeatherHomeCard />
        </div>

        {/* Today's Quick Info Grid */}
        <TodayBentoGrid onNavigate={onNavigate} />

        {/* Events Carousel */}
        <EventsCarousel onNavigate={onNavigate} />

        {/* Tourism Highlights */}
        <TourismHighlights onNavigate={onNavigate} />

        {/* ========================================
            FISCALIZA VIVO - Live Reports Card
            ======================================== */}
        <div className="px-4">
          <FiscalizaVivo data={blocks.fiscaliza?.payload} />
        </div>

        {/* ========================================
            BOCA NO TROMBONE VIVO - Live Forum Card
            ======================================== */}
        <div className="px-4">
          <BocaNoTromboneVivo data={blocks.forum?.payload} />
        </div>

        {/* ========================================
            QUICK ACCESS VIVO - with badges
            ======================================== */}
        <QuickAccessGridVivo data={blocks.quickAccess?.payload} />

        {/* ========================================
            TIJUCANOS COUNTER - Gamification
            ======================================== */}
        {blocks.stats?.payload && (
          <div className="px-4">
            <TijucanosCounter data={blocks.stats.payload} />
          </div>
        )}
      </div>
    </div>
  );
}
