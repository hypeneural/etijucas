import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, AlertTriangle, Lightbulb, Trash2, MoreHorizontal, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TabId } from '@/components/layout/BottomTabBar';
import { ReportCategory } from '@/types';

const quickCategories: { id: ReportCategory; label: string; icon: React.ElementType }[] = [
  { id: 'buraco', label: 'Buraco', icon: AlertTriangle },
  { id: 'iluminacao', label: 'Iluminação', icon: Lightbulb },
  { id: 'lixo', label: 'Lixo', icon: Trash2 },
  { id: 'outros', label: 'Outros', icon: MoreHorizontal },
];

interface ReportCTAProps {
  onNavigate: (tab: TabId) => void;
}

export default function ReportCTA({ onNavigate }: ReportCTAProps) {
  const [hasAnimated, setHasAnimated] = useState(false);

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
        onAnimationComplete={() => setHasAnimated(true)}
        className="relative overflow-hidden bg-gradient-to-br from-accent via-accent to-orange-600 rounded-3xl p-5 text-accent-foreground"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-1">Reportar agora</h3>
          <p className="text-sm opacity-90 mb-4">
            Tira foto, escolhe categoria e pronto.
          </p>
          
          {/* Quick category pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {quickCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onNavigate('reportar')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium"
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
              onClick={() => onNavigate('reportar')}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-accent font-semibold py-3 rounded-xl"
            >
              <Camera className="w-5 h-5" />
              Tirar foto
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('reportar')}
              className="flex items-center justify-center gap-2 bg-white/20 font-semibold py-3 px-4 rounded-xl"
            >
              Sem foto
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
