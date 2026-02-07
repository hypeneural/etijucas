import React from 'react';
import { motion } from 'framer-motion';
import { Home, AlertTriangle, Megaphone, Calendar, MoreHorizontal, MapPin } from 'lucide-react';
import { useCityName } from '@/hooks/useCityName';
import { useTenantStore } from '@/store/useTenantStore';

export type TabId = 'home' | 'reportar' | 'forum' | 'agenda' | 'mais';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const tabs: Tab[] = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'reportar', label: 'Fiscaliza', icon: AlertTriangle },
  { id: 'forum', label: 'Trombone', icon: Megaphone },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'mais', label: 'Mais', icon: MoreHorizontal },
];

const tabModuleRequirements: Partial<Record<TabId, string>> = {
  reportar: 'reports',
  forum: 'forum',
  agenda: 'events',
};

interface BottomTabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function filterTabsByModules(
  sourceTabs: Tab[],
  isModuleEnabled: (moduleKey: string) => boolean
): Tab[] {
  return sourceTabs.filter((tab) => {
    const moduleKey = tabModuleRequirements[tab.id];
    if (!moduleKey) {
      return true;
    }

    return isModuleEnabled(moduleKey);
  });
}

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  const { name: cityName, uf } = useCityName();
  const isModuleEnabled = useTenantStore((state) => state.isModuleEnabled);
  const visibleTabs = filterTabsByModules(tabs, isModuleEnabled);

  return (
    <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[420px] -translate-x-1/2 pb-safe-bottom">
      <nav className="glass mx-3 mb-2 rounded-2xl shadow-elevated">
        <div className="flex items-center justify-center gap-1 pt-1.5 pb-0.5">
          <MapPin className="w-3 h-3 text-primary" />
          <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">
            {cityName}/{uf}
          </span>
        </div>

        <div className="flex items-center justify-around h-14 px-2">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center justify-center w-16 h-12 rounded-xl"
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                </motion.div>
                <span
                  className={`text-[10px] font-medium mt-0.5 transition-colors duration-200 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

