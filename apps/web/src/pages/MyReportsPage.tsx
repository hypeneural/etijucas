import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Plus,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronRight,
    RefreshCw,
    FileText,
    MapPin,
    Filter,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMyReports } from '@/hooks/useMyReports';
import { useAuthStore } from '@/store/useAuthStore';
import { LoginRequired } from '@/components/auth/LoginRequired';
import type { CitizenReport } from '@/types/report';

const statusConfig: Record<string, { icon: React.ComponentType<{ className?: string }>, color: string, label: string }> = {
    recebido: { icon: Clock, color: 'text-blue-600 bg-blue-100', label: 'Recebido' },
    em_analise: { icon: AlertCircle, color: 'text-amber-600 bg-amber-100', label: 'Em Análise' },
    em_andamento: { icon: RefreshCw, color: 'text-purple-600 bg-purple-100', label: 'Em Andamento' },
    resolvido: { icon: CheckCircle2, color: 'text-green-600 bg-green-100', label: 'Resolvido' },
    nao_procede: { icon: XCircle, color: 'text-red-600 bg-red-100', label: 'Não Procede' },
};

function ReportCard({ report }: { report: CitizenReport }) {
    const navigate = useNavigate();
    const status = statusConfig[report.status] || statusConfig.recebido;
    const StatusIcon = status.icon;

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
        >
            <Card
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/reports/${report.id}`)}
            >
                <div className="flex items-start gap-3">
                    {/* Category Emoji */}
                    <div
                        className="p-3 rounded-xl text-2xl shrink-0"
                        style={{ backgroundColor: report.category?.color + '20' }}
                    >
                        {report.category?.icon || '📋'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold line-clamp-1">{report.title}</h3>
                            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                            {report.category?.name}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                            <Badge
                                variant="secondary"
                                className={cn('text-xs', status.color)}
                            >
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {report.statusLabel || status.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                {formatDate(report.createdAt)}
                            </span>
                        </div>

                        {report.addressText && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span className="line-clamp-1">{report.addressText}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Protocol */}
                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Protocolo</span>
                    <code className="text-xs font-mono font-medium">{report.protocol}</code>
                </div>
            </Card>
        </motion.div>
    );
}

export default function MyReportsPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();

    // Auth gate - require login to view reports
    if (!isAuthenticated) {
        return (
            <LoginRequired
                title="Entrar para ver denúncias"
                message="Faça login para ver e acompanhar suas denúncias."
                returnUrl="/minhas-denuncias"
            />
        );
    }

    const { reports, isLoading, error, refetch } = useMyReports();
    const [filter, setFilter] = useState<string | null>(null);

    const filteredReports = filter
        ? reports.filter(r => r.status === filter)
        : reports;

    const statusCounts = reports.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const isError = !!error;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b safe-top">
                <div className="flex items-center justify-between px-4 py-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="rounded-full"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="font-semibold text-lg">Minhas Denúncias</h1>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => refetch()}
                        className="rounded-full"
                    >
                        <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </header>

            {/* Content */}
            <main className="p-4 pb-32">
                {/* Stats */}
                {reports.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
                        <Button
                            variant={filter === null ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter(null)}
                            className="shrink-0"
                        >
                            Todas ({reports.length})
                        </Button>
                        {Object.entries(statusCounts).map(([status, count]) => {
                            const config = statusConfig[status];
                            if (!config) return null;
                            return (
                                <Button
                                    key={status}
                                    variant={filter === status ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilter(filter === status ? null : status)}
                                    className="shrink-0"
                                >
                                    {config.label} ({count})
                                </Button>
                            );
                        })}
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Carregando denúncias...</p>
                    </div>
                )}

                {/* Error State */}
                {isError && (
                    <Card className="p-6 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">Erro ao carregar</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Não foi possível carregar suas denúncias.
                        </p>
                        <Button onClick={() => refetch()}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Tentar novamente
                        </Button>
                    </Card>
                )}

                {/* Empty State */}
                {!isLoading && !isError && reports.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16"
                    >
                        <div className="p-6 rounded-full bg-muted/50 inline-block mb-6">
                            <FileText className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Nenhuma denúncia</h3>
                        <p className="text-muted-foreground mb-6">
                            Você ainda não enviou nenhuma denúncia.
                        </p>
                        <Button onClick={() => navigate('/report')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Fazer primeira denúncia
                        </Button>
                    </motion.div>
                )}

                {/* Reports List */}
                {!isLoading && !isError && filteredReports.length > 0 && (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {filteredReports.map((report, index) => (
                                <motion.div
                                    key={report.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <ReportCard report={report} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* No Results for Filter */}
                {!isLoading && !isError && reports.length > 0 && filteredReports.length === 0 && (
                    <div className="text-center py-12">
                        <Filter className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                            Nenhuma denúncia com esse status.
                        </p>
                        <Button
                            variant="ghost"
                            onClick={() => setFilter(null)}
                            className="mt-2"
                        >
                            Limpar filtro
                        </Button>
                    </div>
                )}
            </main>

            {/* FAB - New Report */}
            <div className="fixed bottom-24 right-4 z-50">
                <motion.div whileTap={{ scale: 0.95 }}>
                    <Button
                        size="lg"
                        className="h-14 w-14 rounded-full shadow-lg"
                        onClick={() => navigate('/report')}
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </motion.div>
            </div>
        </div>
    );
}
