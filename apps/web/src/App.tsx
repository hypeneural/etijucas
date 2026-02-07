import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import AppShell from "./components/layout/AppShell";
import { OfflineIndicator } from "./components/ui/OfflineIndicator";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { idbPersister } from "./lib/queryPersister";
import { PersistGate } from "./components/providers/PersistGate";

// Tenant Management
import { useTenantStore } from "./store/useTenantStore";
import { DEFAULT_CITY_SLUG } from "./constants/tenant";
import { ModuleRoute } from "./components/ModuleRoute";

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
const HomeScreen = lazy(() => import("./screens/HomeScreen"));
const VehicleConsultationPage = lazy(() => import("./pages/VehicleConsultationPage")); // Added


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
 * 
 * PersistGate blocks rendering until React Query cache is restored from IndexedDB.
 * This prevents the "Rendered more hooks than during the previous render" error (#310)
 * that can occur when components try to render while the cache is being restored.
 */
function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
    >
      <PersistGate>
        <TenantBootstrap>
          <TooltipProvider>
            <OfflineIndicator />
            <Toaster />
            <Sonner />
            {children}
          </TooltipProvider>
        </TenantBootstrap>
      </PersistGate>
    </PersistQueryClientProvider>
  );
}

/**
 * TenantBootstrap - Initializes tenant context on app load
 * Resolves city from URL (/uf/cidade) or defaults to Tijucas/SC
 */
function TenantBootstrap({ children }: { children: React.ReactNode }) {
  const { bootstrap, isBootstrapped, isLoading, error, city } = useTenantStore();

  // Resolve city slug from URL or use default
  const getCitySlugFromLocation = () => {
    const path = window.location.pathname;

    // Match /uf/cidade pattern (e.g., /sc/tijucas)
    const match = path.match(/^\/([a-z]{2})\/([a-z0-9-]+)/i);
    if (match) {
      const [, uf, cidade] = match;
      return `${cidade.toLowerCase()}-${uf.toLowerCase()}`; // "tijucas-sc"
    }

    // Default fallback to Tijucas
    return DEFAULT_CITY_SLUG;
  };

  useEffect(() => {
    if (!isBootstrapped && !isLoading) {
      const citySlug = getCitySlugFromLocation();
      console.log('[TenantBootstrap] Bootstrapping city:', citySlug);
      bootstrap(citySlug);
    }
  }, [bootstrap, isBootstrapped, isLoading]);

  // Show loading only on first load (not on subsequent renders)
  if (!isBootstrapped && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Show error if bootstrap completely failed (network down, etc)
  if (!isBootstrapped && error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center gap-4">
        <p className="text-destructive font-medium">Erro ao carregar configuração</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => bootstrap(DEFAULT_CITY_SLUG)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return <>{children}</>;
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
              <Route path="/agenda" element={<ModuleRoute module="events"><AgendaScreen /></ModuleRoute>} />
              <Route path="/agenda/:eventId" element={<ModuleRoute module="events"><EventDetailsPage /></ModuleRoute>} />
              <Route path="/evento/:eventId" element={<Navigate to="/agenda/:eventId" replace />} />

              <Route path="/forum" element={<ModuleRoute module="forum"><ForumScreen /></ModuleRoute>} />
              <Route path="/boca-no-trombone" element={<Navigate to="/forum" replace />} />
              <Route path="/topico/:id" element={<ModuleRoute module="forum"><TopicDetailPage /></ModuleRoute>} />

              <Route path="/denuncias" element={<ModuleRoute module="denuncias"><ReportScreen /></ModuleRoute>} />
              <Route path="/denuncias/mapa" element={<ModuleRoute module="denuncias"><ReportsMapScreen /></ModuleRoute>} />
              <Route path="/denuncia/nova" element={<ModuleRoute module="denuncias"><ReportWizardPage /></ModuleRoute>} />
              <Route path="/denuncia/:id" element={<ModuleRoute module="denuncias"><ReportDetailPage /></ModuleRoute>} />
              <Route path="/minhas-denuncias" element={<ModuleRoute module="denuncias"><MyReportsPage /></ModuleRoute>} />

              <Route path="/coleta-lixo" element={<ModuleRoute module="coleta-lixo"><TrashScheduleScreen /></ModuleRoute>} />
              <Route path="/coleta" element={<Navigate to="/coleta-lixo" replace />} />

              <Route path="/votacoes" element={<ModuleRoute module="votacoes"><VotesListPage /></ModuleRoute>} />
              <Route path="/votacoes/:id" element={<ModuleRoute module="votacoes"><VoteDetailPage /></ModuleRoute>} />

              <Route path="/vereadores" element={<ModuleRoute module="votacoes"><VereadoresListPage /></ModuleRoute>} />
              <Route path="/vereadores/:slug" element={<ModuleRoute module="votacoes"><VereadorDetailPage /></ModuleRoute>} />

              <Route path="/missas" element={<ModuleRoute module="missas"><MassesPage /></ModuleRoute>} />

              <Route path="/telefones" element={<ModuleRoute module="telefones"><UsefulPhonesScreen /></ModuleRoute>} />
              <Route path="/telefones-uteis" element={<Navigate to="/telefones" replace />} />

              <Route path="/pontos-turisticos" element={<ModuleRoute module="turismo"><TourismScreen /></ModuleRoute>} />
              <Route path="/ponto-turistico/:id" element={<ModuleRoute module="turismo"><TourismDetailPage /></ModuleRoute>} />
              <Route path="/turismo" element={<Navigate to="/pontos-turisticos" replace />} />

              <Route path="/previsao" element={<ModuleRoute module="tempo"><WeatherPage /></ModuleRoute>} />
              <Route path="/tempo" element={<Navigate to="/previsao" replace />} />

              {/* Vehicle Consultation */}
              <Route path="/veiculos" element={<ModuleRoute module="veiculos"><VehicleConsultationPage /></ModuleRoute>} />
              <Route path="/consulta-veiculo" element={<Navigate to="/veiculos" replace />} />

            </Route>

            {/* City-prefixed routes: /:uf/:cidade/* */}
            <Route path="/:uf/:cidade" element={<MainLayout />}>
              <Route index element={<HomeScreen />} />
              <Route path="mais" element={<MoreScreen />} />
              <Route path="perfil" element={<ProfilePage />} />

              {/* Feature routes with city prefix */}
              <Route path="agenda" element={<ModuleRoute module="events"><AgendaScreen /></ModuleRoute>} />
              <Route path="agenda/:eventId" element={<ModuleRoute module="events"><EventDetailsPage /></ModuleRoute>} />

              <Route path="forum" element={<ModuleRoute module="forum"><ForumScreen /></ModuleRoute>} />
              <Route path="topico/:id" element={<ModuleRoute module="forum"><TopicDetailPage /></ModuleRoute>} />

              <Route path="denuncias" element={<ModuleRoute module="denuncias"><ReportScreen /></ModuleRoute>} />
              <Route path="denuncias/mapa" element={<ModuleRoute module="denuncias"><ReportsMapScreen /></ModuleRoute>} />
              <Route path="denuncia/nova" element={<ModuleRoute module="denuncias"><ReportWizardPage /></ModuleRoute>} />
              <Route path="denuncia/:id" element={<ModuleRoute module="denuncias"><ReportDetailPage /></ModuleRoute>} />
              <Route path="minhas-denuncias" element={<ModuleRoute module="denuncias"><MyReportsPage /></ModuleRoute>} />

              <Route path="coleta-lixo" element={<ModuleRoute module="coleta-lixo"><TrashScheduleScreen /></ModuleRoute>} />

              <Route path="votacoes" element={<ModuleRoute module="votacoes"><VotesListPage /></ModuleRoute>} />
              <Route path="votacoes/:id" element={<ModuleRoute module="votacoes"><VoteDetailPage /></ModuleRoute>} />

              <Route path="vereadores" element={<ModuleRoute module="votacoes"><VereadoresListPage /></ModuleRoute>} />
              <Route path="vereadores/:slug" element={<ModuleRoute module="votacoes"><VereadorDetailPage /></ModuleRoute>} />

              <Route path="missas" element={<ModuleRoute module="missas"><MassesPage /></ModuleRoute>} />

              <Route path="telefones" element={<ModuleRoute module="telefones"><UsefulPhonesScreen /></ModuleRoute>} />

              <Route path="pontos-turisticos" element={<ModuleRoute module="turismo"><TourismScreen /></ModuleRoute>} />
              <Route path="ponto-turistico/:id" element={<ModuleRoute module="turismo"><TourismDetailPage /></ModuleRoute>} />

              <Route path="previsao" element={<ModuleRoute module="tempo"><WeatherPage /></ModuleRoute>} />

              <Route path="veiculos" element={<ModuleRoute module="veiculos"><VehicleConsultationPage /></ModuleRoute>} />
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
