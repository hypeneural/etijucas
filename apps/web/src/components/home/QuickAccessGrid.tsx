import React, { useMemo } from 'react';
import { useTenantNavigate, useCityName } from '@/hooks';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Church, Phone, FileText, Trash2 } from 'lucide-react';
import { useTenantStore } from '@/store/useTenantStore';

interface ServiceItem {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  route: string;
  moduleKey?: string;
}

// Services will use dynamic city name
const getServices = (cityName: string): ServiceItem[] => [
  { id: 'agenda', label: 'Agenda de Eventos', icon: Calendar, color: 'bg-secondary/10 text-secondary', route: '/agenda' },
  { id: 'turismo', label: 'Pontos Turísticos', icon: MapPin, color: 'bg-green-100 text-green-600', route: '/pontos-turisticos' },
  { id: 'missas', label: 'Horários das Missas', icon: Church, color: 'bg-primary/10 text-primary', route: '/missas' },
  { id: 'telefones', label: 'Telefones Úteis', icon: Phone, color: 'bg-accent/10 text-accent', route: '/telefones' },
  { id: 'coleta', label: 'Coleta de Lixo', icon: Trash2, color: 'bg-emerald-100 text-emerald-600', route: '/coleta-lixo' },
  { id: 'envios', label: `Observa ${cityName}`, icon: FileText, color: 'bg-purple-100 text-purple-600', route: '/denuncias', moduleKey: 'reports' },
];

// Map service IDs to module keys for filtering
const serviceModuleMap: Record<string, string> = {
  agenda: 'events',
  turismo: 'tourism',
  missas: 'masses',
  telefones: 'phones',
  coleta: 'trash',
  envios: 'reports',
};

interface QuickAccessGridProps {
  onNavigate?: (tab: string) => void; // Keep for backward compatibility
}

export default function QuickAccessGrid({ onNavigate }: QuickAccessGridProps) {
  const navigate = useTenantNavigate();
  const { name: cityName } = useCityName();
  const isModuleEnabled = useTenantStore((state) => state.isModuleEnabled);

  // Filter services based on enabled modules
  const services = useMemo(() => {
    return getServices(cityName).filter(service => {
      const moduleKey = serviceModuleMap[service.id];
      if (!moduleKey) return true; // Show if no mapping (backwards compat)
      return isModuleEnabled(moduleKey);
    });
  }, [cityName, isModuleEnabled]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    show: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 24,
      },
    },
  };

  const handleClick = (item: ServiceItem) => {
    navigate(item.route);
  };

  return (
    <div className="px-4 py-4">
      <h2 className="text-lg font-bold text-foreground mb-3">Serviços</h2>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3"
      >
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <motion.button
              key={service.id}
              variants={itemVariants}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleClick(service)}
              className="bento-card flex items-center gap-3 text-left"
            >
              <div className={`w-10 h-10 rounded-xl ${service.color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-foreground leading-tight">
                {service.label}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
