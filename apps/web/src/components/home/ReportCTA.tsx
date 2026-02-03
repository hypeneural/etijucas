// ReportCTA - Home Call-to-Action com KPIs Animados
// Mobile-first, offline-first, native-first

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  AlertTriangle,
  Lightbulb,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Zap,
  FileText,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/report.service';
import { QUERY_KEYS } from '@/api/config';
import { TabId } from '@/components/layout/BottomTabBar';

// ============================================
// ANIMATED COUNTER
// ============================================

function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const diff = value - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + diff * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{displayValue}</span>;
}

// ============================================
// KPI CARD
// ============================================

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2"
    >
      <div className={`p-1.5 rounded-lg ${color}`}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-none">
          <AnimatedCounter value={value} duration={1200} />
        </p>
        <p className="text-[10px] opacity-80 truncate">{label}</p>
      </div>
    </motion.div>
  );
}

// ============================================
// QUICK CATEGORIES
// ============================================

const quickCategories = [
  { id: 'buraco', label: 'Buraco', icon: AlertTriangle },
  { id: 'iluminacao', label: 'Iluminação', icon: Lightbulb },
  { id: 'lixo', label: 'Lixo', icon: Trash2 },
  { id: 'outros', label: 'Outros', icon: MoreHorizontal },
];

// ============================================
// MAIN COMPONENT
// ============================================

interface ReportCTAProps {
  onNavigate: (tab: TabId) => void;
}

export default function ReportCTA({ onNavigate }: ReportCTAProps) {
  const navigate = useNavigate();

  // Fetch stats for KPIs
  const { data: stats } = useQuery({
    queryKey: QUERY_KEYS.reports.stats(),
    queryFn: () => reportService.getReportsStats(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Navigate to wizard
  const handleCreateReport = () => {
    navigate('/denuncia/nova');
  };

  // Navigate to list
  const handleViewAll = () => {
    navigate('/denuncias');
  };

  return (
    <div className="px-4 py-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: 1,
          scale: [0.95, 1.02, 1],
        }}
        transition={{
          duration: 0.5,
          times: [0, 0.7, 1],
        }}
        className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-3xl p-5 text-white"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 20, 0],
              y: [0, -10, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4"
          />
          <motion.div
            animate={{
              x: [0, -15, 0],
              y: [0, 15, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4"
          />
        </div>

        <div className="relative z-10">
          {/* Header with pulse */}
          <div className="flex items-center gap-2 mb-3">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-2 bg-white/20 rounded-xl"
            >
              <Zap className="w-5 h-5" />
            </motion.div>
            <div>
              <h3 className="text-xl font-bold">Fiscaliza Tijucas</h3>
              <p className="text-xs opacity-80">Reporte problemas na cidade</p>
            </div>
          </div>

          {/* KPIs Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <KpiCard
              icon={FileText}
              label="Total"
              value={stats?.total || 0}
              color="bg-blue-500"
              delay={0.1}
            />
            <KpiCard
              icon={Clock}
              label="Em análise"
              value={stats?.byStatus?.em_analise || 0}
              color="bg-yellow-500"
              delay={0.2}
            />
            <KpiCard
              icon={CheckCircle2}
              label="Resolvidos"
              value={stats?.byStatus?.resolvido || 0}
              color="bg-green-500"
              delay={0.3}
            />
          </div>

          {/* Quick category pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {quickCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.92 }}
                  onClick={handleCreateReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium hover:bg-white/30 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </motion.button>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateReport}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-orange-600 font-semibold py-3 rounded-xl shadow-lg shadow-orange-900/20"
            >
              <Camera className="w-5 h-5" />
              Reportar agora
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleViewAll}
              className="flex items-center justify-center gap-1 bg-white/20 backdrop-blur-sm font-semibold py-3 px-4 rounded-xl hover:bg-white/30 transition-colors"
            >
              Ver
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Bottom stats bar */}
          {stats?.thisMonth && stats.thisMonth > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-white/20"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">
                <span className="font-bold">{stats.thisMonth}</span> denúncias este mês
                {stats.resolvedThisMonth && stats.resolvedThisMonth > 0 && (
                  <span className="opacity-80">
                    {' '}• {stats.resolvedThisMonth} resolvidas
                  </span>
                )}
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
