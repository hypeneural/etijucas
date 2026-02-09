import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Filter,
  Search,
  MapPin,
  ChevronRight,
  TrendingUp,
  XCircle,
  RefreshCw,
  Map,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useTenantNavigate } from '@/hooks';
import { usePublicReports, useReportsStats } from '@/hooks/useMyReports';
import type { ReportStatus, ReportCategory } from '@/types/report';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { CategoryIcon } from '@/components/report/CategoryIcon';
import { useCityName } from '@/hooks/useCityName';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  recebido: { label: 'Recebido', color: 'bg-blue-100 text-blue-700', icon: Clock },
  em_analise: { label: 'Em verificação', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  resolvido: { label: 'Melhoria concluída', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejeitado: { label: 'Arquivado', color: 'bg-slate-100 text-slate-700', icon: XCircle },
};

interface ReportScreenProps {
  scrollRef?: (el: HTMLDivElement | null) => void;
}

export default function ReportScreen({ scrollRef }: ReportScreenProps) {
  const navigate = useTenantNavigate();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { name: cityName } = useCityName();

  // Hooks
  const { stats, isLoading: statsLoading } = useReportsStats();
  const { reports, isLoading: reportsLoading, refetch } = usePublicReports({
    status: filterStatus === 'all' ? undefined : filterStatus,
    search: searchQuery || undefined,
  });

  const handleCreateReport = () => {
    navigate('/observacao/nova');
  };

  const handleReportClick = (id: string) => {
    // Navigate to public report detail
    navigate(`/observacao/${id}`);
  };

  const handleTabChange = (tab: string) => {
    navigate(`/?tab=${tab}`);
  };

  return (
    <div ref={scrollRef} className="relative min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="pb-32">
        {/* Header & KPIs */}
        <div className="bg-white dark:bg-slate-900 border-b pb-6 rounded-b-[2rem] shadow-sm relative z-10">
          <div className="px-4 pt-4 pb-2 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Observa {cityName}
              </h1>
              <p className="text-sm text-muted-foreground">
                Acompanhe as melhorias na cidade
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/observacoes/mapa')}
              className="shrink-0 gap-1.5"
            >
              <Map className="w-4 h-4" />
              Mapa
            </Button>
          </div>

          {/* KPIs Grid */}
          <div className="grid grid-cols-2 gap-3 px-4 mt-2">
            <Card className="p-3 bg-gradient-to-br from-blue-50 to-white border-blue-100 dark:from-blue-950/30 dark:to-slate-900 dark:border-blue-900 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <FileText className="w-12 h-12 text-blue-600" />
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider">Total</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {statsLoading ? '...' : stats.total}
                </span>
                <span className="text-[10px] text-blue-600/80 mb-1 font-medium">observações</span>
              </div>
            </Card>

            <Card className="p-3 bg-gradient-to-br from-green-50 to-white border-green-100 dark:from-green-950/30 dark:to-slate-900 dark:border-green-900 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wider">Resolvidas</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {statsLoading ? '...' : stats.byStatus.resolvido}
                </span>
                <span className="text-[10px] text-green-600/80 mb-1 font-medium">casos</span>
              </div>
            </Card>
          </div>

          {/* Interactive KPI Filter Bar */}
          <div className="flex gap-2 px-4 mt-4 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setFilterStatus('em_analise')}
              title="A comunidade está confirmando as informações."
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
                filterStatus === 'em_analise'
                  ? "bg-amber-100 border-amber-200 text-amber-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              Em verificação ({statsLoading ? '-' : stats.byStatus.em_analise})
            </button>

            <button
              onClick={() => setFilterStatus('rejeitado')}
              title="Faltaram detalhes, era duplicado, ou não foi possível confirmar."
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
                filterStatus === 'rejeitado'
                  ? "bg-slate-100 border-slate-200 text-slate-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <div className="w-2 h-2 rounded-full bg-slate-500" />
              Arquivado ({statsLoading ? '-' : stats.byStatus.rejeitado})
            </button>

            <button
              onClick={() => setFilterStatus('recebido')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
                filterStatus === 'recebido'
                  ? "bg-blue-100 border-blue-200 text-blue-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              Recebidos ({statsLoading ? '-' : stats.byStatus.recebido})
            </button>

            <button
              onClick={() => setFilterStatus('resolvido')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
                filterStatus === 'resolvido'
                  ? "bg-green-100 border-green-200 text-green-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Melhoria concluída ({statsLoading ? '-' : stats.byStatus.resolvido})
            </button>
          </div>

          {/* Big Action Button */}
          <div className="px-4 mt-4">
            <Button
              size="lg"
              className="w-full h-14 text-lg font-semibold shadow-lg shadow-primary/20 rounded-xl flex items-center justify-between px-6 transition-transform active:scale-[0.98]"
              onClick={handleCreateReport}
            >
              <span className="flex items-center gap-2">
                <Plus className="w-6 h-6" />
                Nova Observação
              </span>
              <div className="bg-white/20 p-1.5 rounded-lg">
                <ChevronRight className="w-5 h-5" />
              </div>
            </Button>
          </div>
        </div>

        {/* Reports List Section */}
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Últimas Atualizações
            </h2>

            {filterStatus !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterStatus('all')}
                className="text-xs h-8 text-muted-foreground hover:text-foreground"
              >
                Limpar Filtros
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por protocolo, bairro ou título..."
              className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Loading State */}
          {reportsLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Carregando observações...</p>
            </div>
          )}

          {/* Empty State */}
          {!reportsLoading && reports.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-base font-medium text-slate-900 dark:text-slate-100">
                Nenhuma observação encontrada
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Tente mudar os filtros ou faça uma nova observação.
              </p>
            </div>
          )}

          {/* List */}
          <div className="space-y-4">
            {reports.map((report) => {
              const status = statusConfig[report.status] || statusConfig.recebido;
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleReportClick(report.id)}
                >
                  <Card className="overflow-hidden border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-slate-900">
                    {/* Header with Category and Date */}
                    <div className="p-3 flex items-start justify-between border-b border-slate-50 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <CategoryIcon
                          icon={report.category?.icon || 'mdi:dots-horizontal'}
                          color={report.category?.color || '#64748b'}
                          size="sm"
                          withBackground
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {report.category?.name || 'Outros'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(report.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>

                    {/* Content with optional Thumbnail */}
                    <div className="p-3 flex gap-3">
                      {/* Thumbnail */}
                      {report.media && report.media.length > 0 && (
                        <div className="shrink-0">
                          <img
                            src={report.media[0].thumbUrl || report.media[0].url}
                            alt="Foto da observação"
                            className="w-16 h-16 rounded-lg object-cover bg-slate-100 dark:bg-slate-800"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 line-clamp-2">
                          {report.title}
                        </h3>

                        {/* Location Badge */}
                        {report.addressText && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="line-clamp-1">{report.addressText}</span>
                          </div>
                        )}

                        {/* Status and Protocol */}
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className={cn("text-[10px] px-2 h-5 font-normal", status.color)}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                          <span className="text-[10px] font-mono text-slate-400">
                            #{report.protocol}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Tab Bar (Fixed) */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomTabBar
          activeTab="reportar"
          onTabChange={handleTabChange}
        />
      </div>
    </div>
  );
}
