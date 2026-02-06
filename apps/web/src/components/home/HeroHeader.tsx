import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Bell, ChevronDown, User } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useBairros } from '@/hooks';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import WelcomeGreeting from './WelcomeGreeting';
import LivePulse from './LivePulse';

interface HeroHeaderProps {
  scrollRef: React.RefObject<HTMLDivElement>;
  todayEventsCount?: number;
  hasActiveAlert?: boolean;
  streakDays?: number;
}

export default function HeroHeader({
  scrollRef,
  todayEventsCount = 0,
  hasActiveAlert = false,
  streakDays = 0,
}: HeroHeaderProps) {
  const navigate = useNavigate();
  const { selectedBairro, setSelectedBairro } = useAppStore();
  const { user, isAuthenticated } = useAuthStore();
  const [bairroSheetOpen, setBairroSheetOpen] = useState(false);
  const { data: bairros = [] } = useBairros();

  const { scrollY } = useScroll({
    container: scrollRef,
  });

  const headerHeight = useTransform(scrollY, [0, 80], [160, 80]);
  const titleScale = useTransform(scrollY, [0, 80], [1, 0.85]);
  const subtitleOpacity = useTransform(scrollY, [0, 50], [1, 0]);

  const handleProfileClick = () => {
    if (isAuthenticated) {
      navigate('/perfil');
    } else {
      navigate('/login');
    }
  };

  return (
    <motion.header
      style={{ height: headerHeight }}
      className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-dark"
    >
      {/* Animated wave background */}
      <div className="absolute inset-0 overflow-hidden">
        <svg
          className="absolute w-[200%] h-full opacity-20 animate-wave"
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
        >
          <path
            d="M0,100 C150,150 350,50 500,100 C650,150 850,50 1000,100 C1150,150 1200,100 1200,100 L1200,200 L0,200 Z"
            fill="currentColor"
            className="text-primary-foreground"
          />
        </svg>
        <svg
          className="absolute w-[200%] h-full opacity-10 animate-wave-slow"
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
        >
          <path
            d="M0,120 C200,80 400,160 600,120 C800,80 1000,160 1200,120 L1200,200 L0,200 Z"
            fill="currentColor"
            className="text-primary-foreground"
          />
        </svg>

        {/* Floating dots */}
        <motion.div
          className="absolute top-4 right-8 w-2 h-2 rounded-full bg-secondary/40"
          animate={{ y: [0, -10, 0], x: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-12 right-20 w-3 h-3 rounded-full bg-accent/30"
          animate={{ y: [0, 8, 0], x: [0, -8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div
          className="absolute top-8 left-16 w-1.5 h-1.5 rounded-full bg-secondary/50"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      {/* Header content */}
      <div className="relative z-10 flex flex-col h-full px-4 pt-safe-top">
        {/* Top row */}
        <div className="flex items-center justify-between py-3">
          <motion.div style={{ scale: titleScale }} className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-primary-foreground">
              eTijucas
            </h1>
            <LivePulse />
          </motion.div>

          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="relative p-2 rounded-full bg-primary-foreground/10"
            >
              <Bell className="w-5 h-5 text-primary-foreground" />
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center text-[10px]"
              >
                2
              </Badge>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleProfileClick}
              className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center overflow-hidden"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.nome} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-primary-foreground" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Greeting + Bairro selector */}
        <motion.div style={{ opacity: subtitleOpacity }} className="space-y-2">
          <WelcomeGreeting
            todayEventsCount={todayEventsCount}
            hasActiveAlert={hasActiveAlert}
            streakDays={streakDays}
          />

          <Sheet open={bairroSheetOpen} onOpenChange={setBairroSheetOpen}>
            <SheetTrigger asChild>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-foreground/15 text-primary-foreground text-sm font-medium"
              >
                <span className="text-xs opacity-80">📍</span>
                <span>{selectedBairro.nome}</span>
                <ChevronDown className="w-4 h-4" />
              </motion.button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader>
                <SheetTitle>Selecione seu bairro</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-2 mt-4 pb-8">
                {bairros.map((bairro) => (
                  <motion.button
                    key={bairro.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedBairro(bairro);
                      setBairroSheetOpen(false);
                    }}
                    className={`p-3 rounded-xl text-left font-medium transition-colors ${selectedBairro.id === bairro.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                      }`}
                  >
                    {bairro.nome}
                  </motion.button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </motion.div>
      </div>
    </motion.header>
  );
}
