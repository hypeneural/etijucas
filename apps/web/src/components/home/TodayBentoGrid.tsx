import React from 'react';
import { useTenantNavigate } from '@/hooks';
import { motion } from 'framer-motion';
import { Calendar, Clock, AlertCircle, MapPin } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useCityName } from '@/hooks/useCityName';
import { hapticFeedback } from '@/hooks/useHaptics';
import { SkeletonBentoGrid } from './SkeletonCards';

// Offline-first data hooks
import { useUpcomingOfflineEvents } from '@/hooks/useOfflineEvents';
import { alerts as mockAlerts, tourismSpots, massSchedules } from '@/data/mockData';

interface TodayBentoGridProps {
  onNavigate?: (tab: string) => void; // Keep for backward compatibility
}

export default function TodayBentoGrid({ onNavigate }: TodayBentoGridProps) {
  const navigate = useTenantNavigate();
  const { selectedBairro } = useAppStore();
  const { name: cityName } = useCityName();

  // Use offline-first events hook
  const { data: upcomingEvents, isLoading } = useUpcomingOfflineEvents(5);

  // Get today's events
  const todayEvents = React.useMemo(() => {
    if (!upcomingEvents) return [];
    const today = new Date();
    return upcomingEvents.filter(e => {
      const eventDate = new Date(e.dateTime);
      return eventDate.toDateString() === today.toDateString();
    });
  }, [upcomingEvents]);

  // TODO: Replace with offline-first hooks when available
  const nextMass = massSchedules.find(m => m.bairroId === selectedBairro.id);
  const featuredSpot = tourismSpots[0];
  const activeAlert = mockAlerts[0];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 24,
      },
    },
  };

  const handleCardTap = (route: string) => {
    hapticFeedback('selection');
    navigate(route);
  };

  if (isLoading) {
    return <SkeletonBentoGrid />;
  }

  return (
    <div className="px-4 py-2">
      <h2 className="text-lg font-bold text-foreground mb-3">Hoje em {cityName}</h2>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3"
      >
        {/* Eventos hoje */}
        <motion.button
          layoutId="bento-eventos"
          variants={itemVariants}
          whileTap={{ scale: 0.96 }}
          onClick={() => handleCardTap('/agenda')}
          className="bento-card flex flex-col items-start gap-2 text-left relative overflow-hidden"
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent pointer-events-none" />

          <motion.div
            layoutId="bento-eventos-icon"
            className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center relative z-10"
          >
            <Calendar className="w-5 h-5 text-secondary" />
          </motion.div>
          <div className="relative z-10">
            <p className="text-2xl font-bold text-foreground">{todayEvents.length}</p>
            <p className="text-sm text-muted-foreground">Eventos hoje</p>
          </div>
          {todayEvents.length > 0 && (
            <p className="text-xs text-secondary font-medium relative z-10">
              {new Date(todayEvents[0].dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {todayEvents[0].titulo}
            </p>
          )}
        </motion.button>

        {/* Missas */}
        <motion.button
          layoutId="bento-missas"
          variants={itemVariants}
          whileTap={{ scale: 0.96 }}
          onClick={() => handleCardTap('/missas')}
          className="bento-card flex flex-col items-start gap-2 text-left relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

          <motion.div
            layoutId="bento-missas-icon"
            className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center relative z-10"
          >
            <Clock className="w-5 h-5 text-primary" />
          </motion.div>
          <div className="relative z-10">
            <p className="text-lg font-bold text-foreground">
              {nextMass ? nextMass.horarios[0] : '—'}
            </p>
            <p className="text-sm text-muted-foreground">Próxima missa</p>
          </div>
          <p className="text-xs text-primary font-medium relative z-10">
            {nextMass ? nextMass.igrejaNome.slice(0, 20) + '...' : 'Sem horários'}
          </p>
        </motion.button>

        {/* Alertas */}
        <motion.button
          layoutId="bento-alertas"
          variants={itemVariants}
          whileTap={{ scale: 0.96 }}
          className="bento-card flex flex-col items-start gap-2 text-left relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />

          <motion.div
            layoutId="bento-alertas-icon"
            className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center relative z-10"
            animate={activeAlert ? {
              scale: [1, 1.05, 1],
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AlertCircle className="w-5 h-5 text-accent" />
          </motion.div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-foreground">
              {activeAlert?.titulo || 'Sem alertas'}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {activeAlert?.descricao || 'Tudo tranquilo por aqui'}
            </p>
          </div>
        </motion.button>

        {/* Destaque turístico */}
        <motion.button
          layoutId="bento-turismo"
          variants={itemVariants}
          whileTap={{ scale: 0.96 }}
          onClick={() => handleCardTap('/pontos-turisticos')}
          className="bento-card flex flex-col items-start gap-2 text-left overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent pointer-events-none" />

          <motion.div
            layoutId="bento-turismo-icon"
            className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center relative z-10"
          >
            <MapPin className="w-5 h-5 text-secondary" />
          </motion.div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-foreground">
              {featuredSpot.titulo}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {featuredSpot.descCurta}
            </p>
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
}
