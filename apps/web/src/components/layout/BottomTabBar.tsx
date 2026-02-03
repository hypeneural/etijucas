import React from 'react';
import { motion } from 'framer-motion';
import { Home, AlertTriangle, Megaphone, Calendar, MoreHorizontal } from 'lucide-react';

export type TabId = 'home' | 'reportar' | 'forum' | 'agenda' | 'mais';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const tabs: Tab[] = [
  { id: 'home', label: 'Início', icon: Home },
  { id: 'reportar', label: 'Fiscaliza', icon: AlertTriangle },
  { id: 'forum', label: 'Trombone', icon: Megaphone },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'mais', label: 'Mais', icon: MoreHorizontal },
];

interface BottomTabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[420px] -translate-x-1/2 pb-safe-bottom">
      <nav className="glass mx-3 mb-2 rounded-2xl shadow-elevated">
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center justify-center w-16 h-14 rounded-xl"
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
                    className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'
                      }`}
                  />
                </motion.div>
                <span
                  className={`text-[10px] font-medium mt-1 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'
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
