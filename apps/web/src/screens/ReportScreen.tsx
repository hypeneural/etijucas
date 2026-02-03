import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  AlertTriangle,
  Lightbulb,
  Trash2,
  Car,
  Volume2,
  Droplets,
  Heart,
  MoreHorizontal,
  Megaphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VirtualList } from '@/components/ui/VirtualList';
import { useAppStore, type SyncStatus } from '@/store/useAppStore';
import { useMyOfflineReports, useDeleteOfflineReport } from '@/hooks/useOfflineReports';
import { bairros } from '@/constants/bairros';
import { ReportCategory } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { SwipeableListItem } from '@/components/ui/SwipeableListItem';
import { hapticFeedback } from '@/hooks/useHaptics';

// Import the new wizard
import ReportWizardPage from '@/pages/ReportWizardPage';

// Icon mapping for categories
const categoryConfig: Record<ReportCategory, { label: string; icon: React.ElementType; color: string }> = {
  buraco: { label: 'Buraco', icon: AlertTriangle, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  iluminacao: { label: 'Iluminação', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' },
  lixo: { label: 'Lixo', icon: Trash2, color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  transito: { label: 'Trânsito', icon: Car, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  barulho: { label: 'Barulho', icon: Volume2, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  alagamento: { label: 'Alagamento', icon: Droplets, color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400' },
  saude: { label: 'Saúde', icon: Heart, color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' },
  outros: { label: 'Outros', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400' },
};

// Sync status UI helpers
const syncStatusConfig: Record<SyncStatus, { label: string; color: string; icon: React.ElementType }> = {
  synced: { label: 'Enviado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  syncing: { label: 'Sincronizando', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Loader2 },
  error: { label: 'Erro', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle },
};

interface ReportScreenProps {
  scrollRef?: (el: HTMLDivElement | null) => void;
}

type ViewMode = 'list' | 'wizard';

export default function ReportScreen({ scrollRef }: ReportScreenProps) {
  // Use new offline-first hooks
  const { data: reports = [], refetch } = useMyOfflineReports();
  const deleteMutation = useDeleteOfflineReport();

  // Keep retryReport from store for now (sync queue functionality)
  const { retryReport } = useAppStore();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const getBairroName = (bairroId: string) => {
    return bairros.find(b => b.id === bairroId)?.nome || 'Tijucas';
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
    hapticFeedback('success');
    toast({
      title: "Denúncia removida",
      description: "Sua denúncia foi excluída.",
    });
  };

  const handleRetry = (id: string) => {
    retryReport(id);
    hapticFeedback('medium');
    toast({
      title: "Tentando novamente",
      description: "Sua denúncia será enviada quando online.",
    });
  };

  // If wizard mode, show the full wizard
  if (viewMode === 'wizard') {
    return (
      <div className="h-full">
        <ReportWizardPage />
      </div>
    );
  }

  const pendingCount = reports.filter(r => r.syncStatus !== 'synced').length;

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b safe-top">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Denúncias</h1>
              <p className="text-sm text-muted-foreground">
                Ajude a melhorar Tijucas
              </p>
            </div>
            {pendingCount > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <Clock className="h-3 w-3 mr-1" />
                {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* New Report CTA */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setViewMode('wizard')}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/20">
                <Plus className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-lg">Enviar Denúncia</p>
                <p className="text-sm opacity-90">Reportar um problema na cidade</p>
              </div>
            </div>
            <div className="p-2 rounded-full bg-white/20">
              <Megaphone className="h-6 w-6" />
            </div>
          </motion.button>
        </div>
      </div>

      {/* Reports List */}
      <div className="p-4 pb-24">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          Minhas Denúncias
        </h2>

        {reports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="p-4 rounded-full bg-muted inline-flex mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">
              Você ainda não fez nenhuma denúncia.
            </p>
            <p className="text-sm text-muted-foreground">
              Toque no botão acima para reportar um problema.
            </p>
          </motion.div>
        ) : (
          <VirtualList
            items={reports}
            estimatedItemSize={200}
            overscan={3}
            gap={12}
            className="h-full"
            getItemKey={(report) => report.id || report.tempId || String(Math.random())}
            renderItem={(report) => {
              const statusConfig = syncStatusConfig[report.syncStatus ?? 'pending'];
              const StatusIcon = statusConfig.icon;
              const categoryInfo = categoryConfig[report.categoria as ReportCategory];
              const CategoryIcon = categoryInfo?.icon || MoreHorizontal;

              return (
                <SwipeableListItem
                  onDelete={() => handleDelete(report.id || report.tempId!)}
                  className="bg-card rounded-2xl shadow-card overflow-hidden"
                >
                  <Card className="p-4 border-0 shadow-none">
                    {/* Header with status */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${categoryInfo?.color || 'bg-muted'}`}>
                          <CategoryIcon className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{categoryInfo?.label || 'Denúncia'}</span>
                      </div>
                      <Badge className={statusConfig.color}>
                        <StatusIcon className={`w-3 h-3 mr-1 ${report.syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {/* Content */}
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {report.texto || 'Sem descrição'}
                    </p>

                    {/* Photo preview if exists */}
                    {report.fotoUrl && (
                      <img
                        src={report.fotoUrl}
                        alt="Denúncia"
                        className="w-full h-24 object-cover rounded-xl mb-3"
                      />
                    )}

                    {/* Meta info */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                        #{report.protocolo}
                      </span>
                      <span>•</span>
                      <span>{getBairroName(report.bairroId)}</span>
                      <span>•</span>
                      <span>{new Date(report.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>

                    {/* Error message and retry button */}
                    {report.syncStatus === 'error' && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-start gap-2 text-sm text-destructive mb-2">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>{report.errorMessage || 'Falha ao sincronizar'}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetry(report.id || report.tempId!)}
                          className="w-full"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Tentar Novamente
                        </Button>
                      </div>
                    )}
                  </Card>
                </SwipeableListItem>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
