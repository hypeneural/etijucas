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
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

// Feature pages
const MassesPage = lazy(() => import("./pages/MassesPage"));
const EventDetailsPage = lazy(() => import("./pages/EventDetailsPage"));
const TopicDetailPage = lazy(() => import("./pages/TopicDetailPage"));
const VoteDetailPage = lazy(() => import("./pages/VoteDetailPage"));
const VotesListPage = lazy(() => import("./pages/VotesListPage"));
const ReportWizardPage = lazy(() => import("./pages/ReportWizardPage"));
const TourismDetailPage = lazy(() => import("./pages/TourismDetailPage"));

// Feature screens (will become pages)
const UsefulPhonesScreen = lazy(() => import("./screens/UsefulPhonesScreen"));
const TrashScheduleScreen = lazy(() => import("./screens/TrashScheduleScreen"));
const ForumScreen = lazy(() => import("./screens/ForumScreen"));
const ReportScreen = lazy(() => import("./screens/ReportScreen"));
const AgendaScreen = lazy(() => import("./screens/AgendaScreen"));
const TourismScreen = lazy(() => import("./screens/TourismScreen"));

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
            {/* Home - AppShell with tabs */}
            <Route path="/" element={<AppShell />} />

            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<RegisterPage />} />
            <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
            <Route path="/perfil" element={<ProfilePage />} />

            {/* Agenda / Events */}
            <Route path="/agenda" element={<AgendaScreen />} />
            <Route path="/agenda/:eventId" element={<EventDetailsPage />} />
            <Route path="/evento/:eventId" element={<Navigate to="/agenda/:eventId" replace />} />

            {/* Forum - Boca no Trombone */}
            <Route path="/forum" element={<ForumScreen />} />
            <Route path="/boca-no-trombone" element={<Navigate to="/forum" replace />} />
            <Route path="/topico/:id" element={<TopicDetailPage />} />

            {/* Denúncias */}
            <Route path="/denuncias" element={<ReportScreen />} />
            <Route path="/denuncia/nova" element={<ReportWizardPage />} />

            {/* Coleta de Lixo */}
            <Route path="/coleta-lixo" element={<TrashScheduleScreen />} />
            <Route path="/coleta" element={<Navigate to="/coleta-lixo" replace />} />

            {/* Votações da Câmara */}
            <Route path="/votacoes" element={<VotesListPage />} />
            <Route path="/votacao/:id" element={<VoteDetailPage />} />

            {/* Missas */}
            <Route path="/missas" element={<MassesPage />} />

            {/* Telefones Úteis */}
            <Route path="/telefones" element={<UsefulPhonesScreen />} />
            <Route path="/telefones-uteis" element={<Navigate to="/telefones" replace />} />

            {/* Pontos Turísticos */}
            <Route path="/pontos-turisticos" element={<TourismScreen />} />
            <Route path="/ponto-turistico/:id" element={<TourismDetailPage />} />
            <Route path="/turismo" element={<Navigate to="/pontos-turisticos" replace />} />

            {/* Catch-all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProviders>
  );
};

export default App;
