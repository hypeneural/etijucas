import React from 'react';
import { motion } from 'framer-motion';
import { Search, AlertTriangle, Heart, Calendar, Clock, Phone, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TabId } from '@/components/layout/BottomTabBar';

interface SmartChip {
  id: string;
  label: string;
  icon: React.ElementType;
  action?: TabId | 'filter';
  color?: string;
}

const smartChips: SmartChip[] = [
  { id: 'reportar', label: 'Reportar', icon: AlertTriangle, action: 'reportar', color: 'accent' },
  { id: 'curtidos', label: 'Mais curtidos', icon: Heart, action: 'filter' },
  { id: 'eventos', label: 'Eventos hoje', icon: Calendar, action: 'agenda' },
  { id: 'missas', label: 'Missas hoje', icon: Clock, action: 'mais' },
  { id: 'telefones', label: 'Telefones úteis', icon: Phone, action: 'mais' },
  { id: 'turismo', label: 'Turismo', icon: MapPin, action: 'mais' },
];

interface SearchBarProps {
  onNavigate: (tab: TabId) => void;
}

export default function SearchBar({ onNavigate }: SearchBarProps) {
  const handleChipClick = (chip: SmartChip) => {
    if (chip.action && chip.action !== 'filter') {
      onNavigate(chip.action);
    }
  };

  return (
    <div className="px-4 py-4 space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar observações, eventos, missas, lugares…"
          className="pl-12 pr-4 h-12 rounded-2xl bg-card border-0 shadow-card text-base placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Smart chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
        {smartChips.map((chip, index) => {
          const Icon = chip.icon;
          const isAccent = chip.color === 'accent';

          return (
            <motion.button
              key={chip.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleChipClick(chip)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${isAccent
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-card text-foreground shadow-card'
                }`}
            >
              <Icon className="w-4 h-4" />
              {chip.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
