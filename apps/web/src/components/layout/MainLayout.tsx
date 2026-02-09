import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTenantNavigate } from '@/hooks';
import { useQuery } from '@tanstack/react-query';
import { BottomTabBar, TabId } from './BottomTabBar';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { OnboardingSheet } from '@/components/auth/OnboardingSheet';
import { bairroService } from '@/services/bairro.service';

export default function MainLayout() {
    const location = useLocation();
    const navigate = useTenantNavigate();
    const { setActiveTab } = useAppStore();
    const { isAuthenticated, user, needsOnboarding } = useAuthStore();
    const [showOnboarding, setShowOnboarding] = useState(false);

    // Fetch bairros for onboarding (moved from AppShell)
    const { data: bairros = [] } = useQuery({
        queryKey: ['bairros'],
        queryFn: bairroService.getAll,
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    // Check onboarding
    useEffect(() => {
        if (needsOnboarding()) {
            setShowOnboarding(true);
        }
    }, [isAuthenticated, user]);

    const handleOnboardingComplete = () => {
        setShowOnboarding(false);
    };

    // Determine active tab based on path
    const getActiveTab = (path: string): TabId => {
        const normalizedPath = normalizeTenantPath(path);

        if (normalizedPath === '/') return 'home';
        if (normalizedPath.startsWith('/observacao') || normalizedPath.startsWith('/minhas-observacoes') || normalizedPath.startsWith('/observacoes')) return 'reportar';
        if (normalizedPath.startsWith('/forum') || normalizedPath.startsWith('/topico')) return 'forum';
        if (normalizedPath.startsWith('/agenda') || normalizedPath.startsWith('/evento')) return 'agenda';
        if (
            normalizedPath.startsWith('/telefones') ||
            normalizedPath.startsWith('/coleta-lixo') ||
            normalizedPath.startsWith('/pontos-turisticos') ||
            normalizedPath.startsWith('/ponto-turistico') ||
            normalizedPath.startsWith('/missas') ||
            normalizedPath.startsWith('/votacoes') ||
            normalizedPath.startsWith('/vereadores') ||
            normalizedPath.startsWith('/perfil')
        ) return 'mais';

        return 'home'; // Fallback
    };

    const activeTab = getActiveTab(location.pathname);

    // Update store when tab changes (optional, but good for syncing if needed elsewhere)
    useEffect(() => {
        setActiveTab(activeTab);
    }, [activeTab, setActiveTab]);

    const handleTabChange = (tab: TabId) => {
        switch (tab) {
            case 'home':
                navigate('/');
                break;
            case 'reportar':
                navigate('/observacoes');
                break;
            case 'forum':
                navigate('/forum');
                break;
            case 'agenda':
                navigate('/agenda');
                break;
            case 'mais':
                navigate('/mais');
                break;
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-muted/50">
            <div className="relative w-full max-w-[420px] h-full bg-background overflow-hidden shadow-elevated">
                <div className="absolute inset-0 overflow-y-auto scrollbar-hide pb-20">
                    <Outlet />
                </div>

                <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />

                <OnboardingSheet
                    isOpen={showOnboarding}
                    onComplete={handleOnboardingComplete}
                    bairros={bairros}
                />
            </div>
        </div>
    );
}

export function normalizeTenantPath(path: string): string {
    const normalized = path.replace(/^\/[a-z]{2}\/[a-z0-9-]+(?=\/|$)/i, '');
    return normalized === '' ? '/' : normalized;
}
