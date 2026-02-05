import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, AlertTriangle } from 'lucide-react';

// Carousels (use their own API hooks)
import EventsCarousel from '@/components/home/EventsCarousel';
import TourismHighlights from '@/components/home/TourismHighlights';

// New "Hoje em Tijucas" VIVO components
import HeaderSlim from '@/components/home/HeaderSlim';
import { AlertTotem } from '@/components/home/AlertTotem';
import { BoletimDoDia } from '@/components/home/BoletimDoDia';
import { FiscalizaVivo } from '@/components/home/FiscalizaVivo';
import { BocaNoTromboneVivo } from '@/components/home/BocaNoTromboneVivo';
import { TijucanosCounter } from '@/components/home/TijucanosCounter';
import QuickAccessGridVivo from '@/components/home/QuickAccessGridVivo';
import { NearYouBento } from '@/components/home/NearYouBento';
import { HojeShareCard } from '@/components/home/HojeShareCard';
import { MetaShareCard } from '@/components/home/MetaShareCard';

// Hooks & Store
import { useHomeData } from '@/hooks/useHomeData';
import { useCheckIn } from '@/hooks/useCheckIn';
import { useAppStore } from '@/store/useAppStore';
import { TabId } from '@/components/layout/BottomTabBar';
import { useToast } from '@/hooks/use-toast';
import { hapticFeedback } from '@/hooks/useHaptics';

import { useNavigate } from 'react-router-dom';
import { EventListItem } from '@/types/events.api';
import { AggregatorEventItem } from '@/types/home.types';
import confetti from 'canvas-confetti';

interface HomeScreenProps {
  scrollRef?: (el: HTMLDivElement | null) => void;
  onNavigate?: (tab: TabId) => void;
}

// Constants for pull-to-refresh
const PULL_THRESHOLD = 80;
const MAX_PULL_DISTANCE = 120;
const RUBBER_BAND_FACTOR = 0.4;

// Milestone confetti celebration
const MILESTONES = [7, 14, 30, 60, 90];
function celebrateMilestone(days: number) {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#ff6b00', '#ffc107', '#4caf50'],
  });
}

/**
 * Map aggregator events (snake_case) to EventListItem format (camelCase)
 */
function mapAggregatorEventsToEventListItems(events: AggregatorEventItem[]): EventListItem[] {
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
    startDateTime: e.start_datetime,
    endDateTime: e.end_datetime || e.start_datetime,
    venue: e.venue ? {
      id: e.venue.id,
      name: e.venue.name,
      bairro: null,
    } : null,
    coverImage: e.cover_image_url,
    descriptionShort: '',
    tags: [],
    rsvpCount: 0,
    popularityScore: 0,
    isFeatured: false,
    flags: {
      ageRating: 'livre',
      outdoor: false,
      accessibility: false,
      parking: false,
    },
  }));
}

export default function HomeScreen({ scrollRef, onNavigate }: HomeScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const navigate = useNavigate();
  const { isRefreshing, setIsRefreshing, selectedBairro } = useAppStore();
  const { toast } = useToast();
  const [isPulling, setIsPulling] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  // Default navigation handler if prop not provided
  const handleNavigate = onNavigate || ((tab: TabId) => {
    navigate(tab === 'home' ? '/' : `/${tab === 'mais' ? 'telefones' : tab}`);
  });

  // ========================================
  // Home Aggregator Hook
  // ========================================
  const {
    blocks,
    meta,
    refresh: refreshHomeData,
    isLoading,
    isStale,
    isError,
    error,
    failureReason,
  } = useHomeData();

  // Debug: Log error in console for developers
  useEffect(() => {
    if (isError) {
      console.error('[HomeScreen] Home data error:', error, failureReason);
    }
  }, [isError, error, failureReason]);

  // ========================================
  // Check-in Hook (daily streak)
  // ========================================
  const {
    streak: checkInStreak,
    checkIn,
    justReachedMilestone,
    clearMilestone,
    isAuthenticated
  } = useCheckIn();

  // Get streak from aggregator meta (for logged-in users) or from check-in hook
  // Maps to BoletimDoDia's StreakData interface (current, longest, checked_in_today)
  const userStreak = useMemo(() => {
    // Prefer aggregator data (already fetched), fallback to check-in hook
    if (meta?.user?.streak) {
      const s = meta.user.streak;
      return {
        current: s.current_streak,
        longest: s.longest_streak,
        checked_in_today: s.today_completed,
      };
    }
    return checkInStreak ? {
      current: checkInStreak.current,
      longest: checkInStreak.longest,
      checked_in_today: checkInStreak.checked_in_today,
    } : null;
  }, [meta?.user?.streak, checkInStreak]);

  // Celebrate milestone with confetti
  useEffect(() => {
    if (justReachedMilestone && MILESTONES.includes(justReachedMilestone)) {
      celebrateMilestone(justReachedMilestone);
      toast({
        title: `🔥 ${justReachedMilestone} dias seguidos!`,
        description: 'Parabéns! Continue acompanhando Tijucas!',
      });
      clearMilestone();
    }
  }, [justReachedMilestone, clearMilestone, toast]);

  // Handle "mark as read" on boletim - triggers check-in as micro-action
  const handleBoletimRead = useCallback(() => {
    if (isAuthenticated) {
      checkIn(); // Micro-action: viewing boletim counts as engagement
      hapticFeedback('success');
    }
  }, [isAuthenticated, checkIn]);

  // Extract alerts from aggregator
  const alertItems = blocks.alerts?.payload?.alerts || [];

  // Map aggregator events to EventListItem format for carousel
  const aggregatorEvents = useMemo(() => {
    const events = blocks.events?.payload?.events;
    if (!events || events.length === 0) return undefined;
    return mapAggregatorEventsToEventListItems(events);
  }, [blocks.events]);

  // Extract tourism data for carousel
  const aggregatorTourism = useMemo(() => {
    return blocks.tourism?.payload?.spots;
  }, [blocks.tourism]);

  // Check if specific blocks had errors
  const hasBlockError = useCallback((blockName: string) => {
    return meta?.errors?.includes(blockName) ?? false;
  }, [meta?.errors]);

  // Compute "Near You" items from aggregator blocks
  const nearYouItems = useMemo(() => {
    const items: Array<{
      type: 'fiscaliza' | 'evento' | 'alerta';
      id: string;
      title: string;
      subtitle?: string;
      count?: number;
      route: string;
    }> = [];

    // Fiscaliza nearby
    const fiscalizaData = blocks.fiscaliza?.payload;
    if (fiscalizaData?.pendentes_bairro && fiscalizaData.pendentes_bairro > 0) {
      items.push({
        type: 'fiscaliza',
        id: 'fiscaliza-near',
        title: 'denúncias pendentes',
        count: fiscalizaData.pendentes_bairro,
        route: '/denuncias',
      });
    }

    // Events today
    const eventsData = blocks.events?.payload?.events;
    if (eventsData && eventsData.length > 0) {
      items.push({
        type: 'evento',
        id: 'events-today',
        title: 'eventos hoje',
        count: eventsData.length,
        route: '/agenda',
      });
    }

    // Active alerts
    if (alertItems.length > 0) {
      items.push({
        type: 'alerta',
        id: 'alerts-active',
        title: 'alertas ativos',
        count: alertItems.length,
        route: '/alertas',
      });
    }

    return items;
  }, [blocks.fiscaliza, blocks.events, alertItems.length]);

  // Simple pull distance state for CSS-based animation
  const [pullDistance, setPullDistance] = useState(0);

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
    setPullDistance(0);
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
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startYRef.current;

    if (deltaY > 0) {
      // Simple rubber banding calculation
      const rubberBanded = deltaY * 0.5; // Linear resistance for simplicity
      const limitedPull = Math.min(rubberBanded, MAX_PULL_DISTANCE * 1.5);
      setPullDistance(limitedPull);

      if (limitedPull >= PULL_THRESHOLD && !hasTriggered) {
        hapticFeedback('medium');
        setHasTriggered(true);
      }
    }
  }, [isPulling, isRefreshing, hasTriggered]);

  const handleTouchEnd = useCallback(() => {
    if (!isPulling) return;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setPullDistance(60); // Keep open while refreshing
      handleRefresh();
    } else {
      setPullDistance(0);
    }

    setIsPulling(false);
  }, [isPulling, pullDistance, isRefreshing, handleRefresh]);

  // Reset pull distance when refreshing stops
  useEffect(() => {
    if (!isRefreshing) {
      setPullDistance(0);
    }
  }, [isRefreshing]);

  return (
    <div
      ref={(el) => {
        if (containerRef) (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        if (scrollRef) scrollRef(el);
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

      {/* Pull to refresh indicator - CSS Version */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          style={{ height: isRefreshing ? 60 : pullDistance }}
          className="flex items-center justify-center bg-gradient-to-b from-primary/10 to-transparent overflow-hidden transition-all duration-200 ease-out"
        >
          <div
            className={`flex items-center justify-center transition-transform duration-300 ${isRefreshing ? "animate-spin" : ""}`}
            style={{
              transform: isRefreshing ? "none" : `rotate(${Math.min(pullDistance * 2, 180)}deg) scale(${pullDistance >= PULL_THRESHOLD ? 1.2 : 1})`
            }}
          >
            <RefreshCw
              className={`w-6 h-6 transition-colors ${hasTriggered || isRefreshing
                ? 'text-primary'
                : 'text-muted-foreground'
                }`}
            />
          </div>
          {hasTriggered && !isRefreshing && (
            <span className="absolute mt-10 text-xs text-primary font-medium animate-in fade-in slide-in-from-bottom-2">
              Solte para atualizar
            </span>
          )}
        </div>
      )}

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

      {/* Error Banner - shows when API fails */}
      {isError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Erro ao carregar dados</span>
            </div>
            <button
              onClick={() => refreshHomeData()}
              className="text-xs px-2 py-1 rounded-lg bg-destructive/20 text-destructive font-medium min-h-[32px]"
            >
              Tentar novamente
            </button>
          </div>
          {error?.message && (
            <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
          )}
        </motion.div>
      )}

      <div className="pb-24 space-y-4">
        {/* ========================================
            BOLETIM DO DIA - Daily Summary (O Gancho!)
            Always visible - shows skeleton when loading
            With streak display for gamification
            ======================================== */}
        <div className="px-4 pt-2">
          <BoletimDoDia
            data={blocks.boletim?.payload}
            isLoading={isLoading}
            streak={userStreak}
            onMarkAsRead={handleBoletimRead}
          />
        </div>

        {/* ========================================
            QUICK ACCESS VIVO - Mobile First! (Moved up)
            ======================================== */}
        <QuickAccessGridVivo data={blocks.quickAccess?.payload} isLoading={isLoading} />

        {/* ========================================
            FISCALIZA VIVO - Live Reports Card (CTA Cívico)
            ======================================== */}
        <div className="px-4">
          <FiscalizaVivo
            data={blocks.fiscaliza?.payload}
            isLoading={isLoading}
            hasError={hasBlockError('fiscaliza')}
          />
        </div>

        {/* ========================================
            NEAR YOU BENTO - Location-aware content
            Shows what's happening in user's bairro
            ======================================== */}
        {nearYouItems.length > 0 && (
          <NearYouBento
            bairroName={selectedBairro?.nome || 'Tijucas'}
            items={nearYouItems}
            isLoading={isLoading}
          />
        )}

        {/* ========================================
            EVENTS CAROUSEL - What's happening today
            Uses aggregator data when available
            ======================================== */}
        <EventsCarousel onNavigate={handleNavigate} data={aggregatorEvents} />

        {/* ========================================
            BOCA NO TROMBONE VIVO - Live Forum Card
            ======================================== */}
        <div className="px-4">
          <BocaNoTromboneVivo
            data={blocks.forum?.payload}
            isLoading={isLoading}
            hasError={hasBlockError('forum')}
          />
        </div>

        {/* ========================================
            TOURISM HIGHLIGHTS - Explore the city
            Uses aggregator data when available
            ======================================== */}
        <TourismHighlights onNavigate={handleNavigate} data={aggregatorTourism} />

        {/* ========================================
            HOJE SHARE CARD - Shareable daily summary
            ======================================== */}
        <HojeShareCard
          clima={blocks.weather?.payload}
          eventos={blocks.events?.payload?.events?.length || 0}
          denuncias={blocks.fiscaliza?.payload?.hoje || 0}
          forumPosts={blocks.forum?.payload?.comentarios_hoje || 0}
          usuarios={blocks.stats?.payload?.total || 0}
        />

        {/* ========================================
            META SHARE CARD - Community goal progress
            ======================================== */}
        {blocks.stats?.payload && (
          <MetaShareCard
            total={blocks.stats.payload.total}
            goal={blocks.stats.payload.goal.target}
            goalName={blocks.stats.payload.goal.message}
            verified={blocks.stats.payload.verified}
            newToday={blocks.stats.payload.new_today}
          />
        )}

        {/* ========================================
            TIJUCANOS COUNTER - Gamification Footer
            Always visible - shows skeleton when loading
            ======================================== */}
        <div className="px-4">
          <TijucanosCounter data={blocks.stats?.payload} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
