import React, { Suspense, useState, useRef, useCallback, useLayoutEffect, useEffect, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BottomTabBar, TabId } from './BottomTabBar';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { ScreenSkeleton } from '@/components/ui/ScreenSkeleton';
import { OnboardingSheet } from '@/components/auth/OnboardingSheet';
import { bairroService } from '@/services/bairro.service';

// Lazy load screens for code splitting

// Lazy load screens for code splitting
const HomeScreen = lazy(() => import('@/screens/HomeScreen'));
const ReportScreen = lazy(() => import('@/screens/ReportScreen'));
const ForumScreen = lazy(() => import('@/screens/ForumScreen'));
const AgendaScreen = lazy(() => import('@/screens/AgendaScreen'));
const MoreScreen = lazy(() => import('@/screens/MoreScreen'));

const pageVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
      duration: 0.22,
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
    transition: {
      duration: 0.18,
    },
  }),
};

const tabs: TabId[] = ['home', 'reportar', 'forum', 'agenda', 'mais'];

// Map tabs to skeleton variants
const skeletonVariants: Record<TabId, 'home' | 'list' | 'detail' | 'grid'> = {
  home: 'home',
  reportar: 'list',
  forum: 'list',
  agenda: 'list',
  mais: 'grid',
};

export default function AppShell() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeTab, setActiveTab, scrollPositions, setScrollPosition } = useAppStore();
  const { isAuthenticated, user, updateUser, needsOnboarding } = useAuthStore();
  const [direction, setDirection] = useState(0);
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Fetch bairros for onboarding
  const { data: bairros = [] } = useQuery({
    queryKey: ['bairros'],
    queryFn: bairroService.getAll,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Check if user needs onboarding on mount
  useEffect(() => {
    if (needsOnboarding()) {
      setShowOnboarding(true);
    }
  }, [isAuthenticated, user]);

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Read ?tab= query param on mount for PWA shortcuts
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabs.includes(tabParam as TabId)) {
      setActiveTab(tabParam as TabId);
    }
  }, []); // Only run on mount

  const handleTabChange = useCallback((newTab: TabId) => {
    const currentIndex = tabs.indexOf(activeTab);
    const newIndex = tabs.indexOf(newTab);
    setDirection(newIndex > currentIndex ? 1 : -1);

    // Save current scroll position
    const currentScrollRef = scrollRefs.current[activeTab];
    if (currentScrollRef) {
      setScrollPosition(activeTab, currentScrollRef.scrollTop);
    }

    setActiveTab(newTab);
  }, [activeTab, setScrollPosition]);

  // Restore scroll position after layout
  useLayoutEffect(() => {
    const scrollRef = scrollRefs.current[activeTab];
    const savedPosition = scrollPositions[activeTab];

    if (scrollRef && savedPosition !== undefined) {
      scrollRef.scrollTop = savedPosition;
    }
  }, [activeTab, scrollPositions]);

  const setScrollRef = useCallback((tab: TabId) => (el: HTMLDivElement | null) => {
    scrollRefs.current[tab] = el;
  }, []);

  const renderScreen = () => {
    const fallback = <ScreenSkeleton variant={skeletonVariants[activeTab]} />;

    switch (activeTab) {
      case 'home':
        return (
          <Suspense fallback={fallback}>
            <HomeScreen scrollRef={setScrollRef('home')} onNavigate={handleTabChange} />
          </Suspense>
        );
      case 'reportar':
        return (
          <Suspense fallback={fallback}>
            <ReportScreen scrollRef={setScrollRef('reportar')} />
          </Suspense>
        );
      case 'forum':
        return (
          <Suspense fallback={fallback}>
            <ForumScreen scrollRef={setScrollRef('forum')} />
          </Suspense>
        );
      case 'agenda':
        return (
          <Suspense fallback={fallback}>
            <AgendaScreen scrollRef={setScrollRef('agenda')} />
          </Suspense>
        );
      case 'mais':
        return (
          <Suspense fallback={fallback}>
            <MoreScreen scrollRef={setScrollRef('mais')} />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={fallback}>
            <HomeScreen scrollRef={setScrollRef('home')} onNavigate={handleTabChange} />
          </Suspense>
        );
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-muted/50">
      <div className="relative w-full max-w-[420px] h-full bg-background overflow-hidden shadow-elevated">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>

        <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Onboarding Sheet for new users */}
        <OnboardingSheet
          isOpen={showOnboarding}
          onComplete={handleOnboardingComplete}
          bairros={bairros}
        />
      </div>
    </div>
  );
}
