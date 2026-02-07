import React, { useState, lazy, Suspense } from 'react';
import { useTenantNavigate } from '@/hooks';

import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Church,
  Phone,
  FileText,
  Map,
  ChevronRight,
  Star,
  Clock,
  ExternalLink,
  ArrowLeft,
  Trash2,
  User,
  LogOut,
  Vote,
  Car,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// TODO: Replace with offline services when backend is ready
import { tourismSpots, massSchedules, usefulPhones, myReports } from '@/data/mockData';
import { bairros } from '@/constants/bairros';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { PhoneCategory } from '@/types';
import { ScreenSkeleton } from '@/components/ui/ScreenSkeleton';
import { InstallMenuItem } from '@/components/ui/InstallBanner';
import { useCityName } from '@/hooks/useCityName';

// Lazy load TrashScheduleScreen
const TrashScheduleScreen = lazy(() => import('@/screens/TrashScheduleScreen'));

type ScreenView = 'menu' | 'turismo' | 'missas' | 'telefones' | 'envios' | 'lixo';

const phoneCategoryLabels: Record<PhoneCategory, string> = {
  emergencias: '🚨 Emergências',
  seguranca: '🛡️ Segurança',
  saude: '🏥 Saúde',
  prefeitura: '🏛️ Prefeitura',
  educacao: '📚 Educação',
  utilidades: '🔧 Utilidades',
  turismo: '🏖️ Turismo',
  defesa_civil: '🆘 Defesa Civil',
  servicos: '🔨 Serviços',
  outros: '📞 Outros',
};

interface MoreScreenProps {
  scrollRef?: (el: HTMLDivElement | null) => void;
}

export default function MoreScreen({ scrollRef }: MoreScreenProps) {
  const navigate = useTenantNavigate();
  const [view, setView] = useState<ScreenView>('menu');
  const { selectedBairro, reports } = useAppStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { name: cityName } = useCityName();

  const menuItems = [
    { id: 'perfil' as const, label: 'Meu Perfil', icon: User, color: 'bg-primary/10 text-primary', isLink: true },
    { id: 'lixo' as ScreenView, label: 'Coleta de Lixo', icon: Trash2, color: 'bg-emerald-100 text-emerald-600', badge: 'Novo' },
    { id: 'veiculos' as const, label: 'Consultar Veículos', icon: Car, color: 'bg-blue-100 text-blue-600', isLink: true, badge: 'Novo' },
    { id: 'votacoes' as const, label: 'Votações da Câmara', icon: Vote, color: 'bg-indigo-100 text-indigo-600', isLink: true, badge: 'Novo' },
    { id: 'turismo' as ScreenView, label: 'Pontos Turísticos', icon: MapPin, color: 'bg-secondary/10 text-secondary' },
    { id: 'missas' as ScreenView, label: 'Horários das Missas', icon: Church, color: 'bg-primary/10 text-primary' },
    { id: 'telefones' as ScreenView, label: 'Telefones Úteis', icon: Phone, color: 'bg-accent/10 text-accent' },
    { id: 'vereadores' as const, label: 'Vereadores', icon: User, color: 'bg-blue-100 text-blue-600', isLink: true },
    { id: 'envios' as ScreenView, label: `Fiscaliza ${cityName}`, icon: FileText, color: 'bg-purple-100 text-purple-600' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getBairroName = (bairroId: string) => {
    return bairros.find(b => b.id === bairroId)?.nome || cityName;
  };

  const getDayName = (day: number) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[day];
  };

  const statusColors = {
    recebido: 'bg-blue-100 text-blue-700',
    em_analise: 'bg-yellow-100 text-yellow-700',
    resolvido: 'bg-green-100 text-green-700',
  };

  const statusLabels = {
    recebido: 'Recebido',
    em_analise: 'Em análise',
    resolvido: 'Resolvido',
  };

  if (view === 'lixo') {
    return (
      <div className="h-full overflow-hidden bg-background relative">
        {/* Back button overlay */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setView('menu')}
          className="absolute top-4 left-4 z-50 p-2 bg-white/90 backdrop-blur rounded-full shadow-md"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>

        <Suspense fallback={<ScreenSkeleton variant="list" />}>
          <TrashScheduleScreen />
        </Suspense>
      </div>
    );
  }

  if (view !== 'menu') {
    return (
      <div ref={scrollRef} className="h-full overflow-y-auto bg-background">
        {/* Sub-screen header */}
        <div className="sticky top-0 z-20 bg-background safe-top border-b border-border">
          <div className="flex items-center gap-3 px-4 py-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setView('menu')}
              className="p-2 -ml-2 rounded-full hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <h1 className="text-lg font-bold text-foreground">
              {menuItems.find(m => m.id === view)?.label}
            </h1>
          </div>
        </div>

        <div className="px-4 pb-24">
          <AnimatePresence mode="wait">
            {/* Turismo */}
            {view === 'turismo' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 mt-4"
              >
                {tourismSpots.map((spot, index) => (
                  <motion.div
                    key={spot.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-2xl overflow-hidden shadow-card"
                  >
                    {spot.imageUrl && (
                      <img
                        src={spot.imageUrl}
                        alt={spot.titulo}
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground mb-1">{spot.titulo}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{spot.descCurta}</p>
                      <div className="flex gap-1">
                        {spot.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Missas */}
            {view === 'missas' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="mt-4"
              >
                <div className="bg-primary/5 rounded-xl p-3 mb-4">
                  <p className="text-sm text-primary font-medium">
                    Mostrando missas em: {selectedBairro.nome}
                  </p>
                </div>

                <div className="space-y-3">
                  {massSchedules
                    .filter(m => m.bairroId === selectedBairro.id)
                    .map((schedule, index) => (
                      <motion.div
                        key={schedule.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-card rounded-2xl p-4 shadow-card"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Church className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{schedule.igrejaNome}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {getDayName(schedule.diaSemana)}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {schedule.horarios.map(horario => (
                                <span
                                  key={horario}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-xs font-medium"
                                >
                                  <Clock className="w-3 h-3" />
                                  {horario}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                  {massSchedules.filter(m => m.bairroId === selectedBairro.id).length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma igreja cadastrada neste bairro.
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Telefones */}
            {view === 'telefones' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="mt-4 space-y-6"
              >
                {Object.keys(phoneCategoryLabels).map((category) => {
                  const categoryPhones = usefulPhones.filter(p => p.categoria === category);
                  if (categoryPhones.length === 0) return null;

                  return (
                    <div key={category}>
                      <h3 className="font-semibold text-foreground mb-3">
                        {phoneCategoryLabels[category as PhoneCategory]}
                      </h3>
                      <div className="space-y-2">
                        {categoryPhones.map((phone) => (
                          <motion.a
                            key={phone.id}
                            href={`tel:${phone.numero}`}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-3 bg-card rounded-xl p-3 shadow-card"
                          >
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                              <Phone className="w-5 h-5 text-accent" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{phone.nome}</p>
                              <p className="text-sm text-muted-foreground">{phone.numero}</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </motion.a>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* Meus envios */}
            {view === 'envios' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="mt-4 space-y-3"
              >
                {reports.map((report, index) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-2xl p-4 shadow-card"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={statusColors[report.status]}>
                        {statusLabels[report.status]}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground">
                        #{report.protocolo}
                      </span>
                    </div>
                    <p className="text-foreground mb-2">{report.texto}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="capitalize">{report.categoria}</span>
                      <span>•</span>
                      <span>{getBairroName(report.bairroId)}</span>
                      <span>•</span>
                      <span>{new Date(report.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </motion.div>
                ))}

                {reports.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Você ainda não fez nenhum envio.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background safe-top border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Mais</h1>
          <p className="text-sm text-muted-foreground">Explore {cityName}</p>
        </div>
      </div>

      <div className="px-4 pb-24 mt-4 space-y-3">
        {/* Install App Item */}
        <InstallMenuItem />

        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (item.id === 'perfil') {
                  navigate(isAuthenticated ? '/perfil' : '/login');
                } else if (item.id === 'missas') {
                  navigate('/missas');
                } else if (item.id === 'telefones') {
                  navigate('/telefones');
                } else if (item.id === 'votacoes') {
                  navigate('/votacoes');
                } else if (item.id === 'lixo') {
                  navigate('/coleta-lixo');
                } else if (item.id === 'veiculos') {
                  navigate('/veiculos');
                } else if (item.id === 'turismo') {
                  navigate('/pontos-turisticos');
                } else if (item.id === 'envios') {
                  navigate('/denuncias');
                } else if (item.id === 'vereadores') {
                  navigate('/vereadores');
                } else {
                  setView(item.id as ScreenView);
                }
              }}
              className="w-full flex items-center gap-4 bg-card rounded-2xl p-4 shadow-card text-left"
            >
              <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-foreground">{item.label}</span>
                {'badge' in item && item.badge && (
                  <Badge className="ml-2 bg-emerald-500 text-white text-[10px] px-1.5 py-0">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          );
        })}

        {/* Logout button at the bottom */}
        {isAuthenticated && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: menuItems.length * 0.1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center gap-4 bg-red-50 dark:bg-red-950/30 rounded-2xl p-4 text-left border border-red-200 dark:border-red-800"
          >
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/50 text-red-600 flex items-center justify-center">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <span className="font-medium text-red-600 dark:text-red-400">Sair da conta</span>
            </div>
          </motion.button>
        )}
      </div>
    </div>
  );
}
