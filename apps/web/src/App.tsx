import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import AppShell from "./components/layout/AppShell";
import { OfflineIndicator } from "./components/ui/OfflineIndicator";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { idbPersister } from "./lib/queryPersister";

// ======================================================
// Lazy-loaded pages for smaller initial bundle
// ======================================================

// Auth pages
const LoginPage = lazy(() => import("./pages/LoginPage"));
const WhatsAppLoginPage = lazy(() => import("./pages/WhatsAppLoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

// Feature pages
const MassesPage = lazy(() => import("./pages/MassesPage"));
const EventDetailsPage = lazy(() => import("./pages/EventDetailsPage"));
const TopicDetailPage = lazy(() => import("./pages/TopicDetailPage"));
const VoteDetailPage = lazy(() => import("./pages/VoteDetailPage"));
const VotesListPage = lazy(() => import("./pages/VotesListPage"));
const VereadoresListPage = lazy(() => import("./pages/VereadoresListPage"));
const VereadorDetailPage = lazy(() => import("./pages/VereadorDetailPage"));
const ReportWizardPage = lazy(() => import("./pages/ReportWizardPage"));
const MyReportsPage = lazy(() => import("./pages/MyReportsPage"));
const ReportDetailPage = lazy(() => import("./pages/ReportDetailPage"));
const TourismDetailPage = lazy(() => import("./pages/TourismDetailPage"));
const WeatherPage = lazy(() => import("./pages/WeatherPage"));

// Feature screens (will become pages)
const UsefulPhonesScreen = lazy(() => import("./screens/UsefulPhonesScreen"));
const TrashScheduleScreen = lazy(() => import("./screens/TrashScheduleScreen"));
const ForumScreen = lazy(() => import("./screens/ForumScreen"));
const ReportScreen = lazy(() => import("./screens/ReportScreen"));
const ReportsMapScreen = lazy(() => import("./screens/ReportsMapScreen"));
const AgendaScreen = lazy(() => import("./screens/AgendaScreen"));
const TourismScreen = lazy(() => import("./screens/TourismScreen"));
const MoreScreen = lazy(() => import("./screens/MoreScreen"));
const HomeScreen = lazy(() => import("./screens/HomeScreen")); // Added import

// Layout
const MainLayout = lazy(() => import("./components/layout/MainLayout"));

// Simple loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Configure QueryClient for offline-first behavior
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 5 minutes
      staleTime: 1000 * 60 * 5,
      // Cache data for 24 hours (longer for persistence)
      gcTime: 1000 * 60 * 60 * 24,
      // Retry failed requests 2 times
      retry: 2,
      // Don't refetch on window focus in mobile context
      refetchOnWindowFocus: false,
      // Enable offline-first mode
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Enable offline-first for mutations
      networkMode: 'offlineFirst',
    },
  },
});

// Persist options for IndexedDB storage
const persistOptions = {
  persister: idbPersister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
  buster: 'v1', // Increment to invalidate cache on breaking changes
};

/**
 * AppProviders - Wrapper component that contains hooks
 * Hooks must be inside React component and inside QueryClientProvider
 */
function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
    >
      <TooltipProvider>
        <OfflineIndicator />
        <Toaster />
        <Sonner />
        {children}
      </TooltipProvider>
    </PersistQueryClientProvider>
  );
}

const App = () => {
  return (
    <AppProviders>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Auth routes (no footer) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/login/otp" element={<WhatsAppLoginPage />} />
            <Route path="/cadastro" element={<RegisterPage />} />
            <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />

            {/* Main Layout routes (with footer) */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/mais" element={<MoreScreen />} />
              <Route path="/perfil" element={<ProfilePage />} />

              {/* Feature routes */}
              <Route path="/agenda" element={<AgendaScreen />} />
              <Route path="/agenda/:eventId" element={<EventDetailsPage />} />
              <Route path="/evento/:eventId" element={<Navigate to="/agenda/:eventId" replace />} />

              <Route path="/forum" element={<ForumScreen />} />
              <Route path="/boca-no-trombone" element={<Navigate to="/forum" replace />} />
              <Route path="/topico/:id" element={<TopicDetailPage />} />

              <Route path="/denuncias" element={<ReportScreen />} />
              <Route path="/denuncias/mapa" element={<ReportsMapScreen />} />
              <Route path="/denuncia/nova" element={<ReportWizardPage />} />
              <Route path="/denuncia/:id" element={<ReportDetailPage />} />
              <Route path="/minhas-denuncias" element={<MyReportsPage />} />

              <Route path="/coleta-lixo" element={<TrashScheduleScreen />} />
              <Route path="/coleta" element={<Navigate to="/coleta-lixo" replace />} />

              <Route path="/votacoes" element={<VotesListPage />} />
              <Route path="/votacoes/:id" element={<VoteDetailPage />} />

              <Route path="/vereadores" element={<VereadoresListPage />} />
              <Route path="/vereadores/:slug" element={<VereadorDetailPage />} />

              <Route path="/missas" element={<MassesPage />} />

              <Route path="/telefones" element={<UsefulPhonesScreen />} />
              <Route path="/telefones-uteis" element={<Navigate to="/telefones" replace />} />

              <Route path="/pontos-turisticos" element={<TourismScreen />} />
              <Route path="/ponto-turistico/:id" element={<TourismDetailPage />} />
              <Route path="/turismo" element={<Navigate to="/pontos-turisticos" replace />} />

              <Route path="/previsao" element={<WeatherPage />} />
              <Route path="/tempo" element={<Navigate to="/previsao" replace />} />
            </Route>

            {/* Catch-all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProviders>
  );
};

export default App;
