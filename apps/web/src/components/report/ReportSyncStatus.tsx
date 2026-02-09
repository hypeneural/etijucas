import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CloudUpload, Loader2, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    getReportOutboxStatus,
    retryFailedReportOutbox,
    syncReportOutbox,
    type SyncStatusInfo,
} from '@/services/reportOutbox.service';

const POLL_INTERVAL_MS = 5000;

export function ReportSyncStatus() {
    const [status, setStatus] = useState<SyncStatusInfo | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshStatus = useCallback(async () => {
        try {
            const nextStatus = await getReportOutboxStatus();
            setStatus(nextStatus);
        } catch (error) {
            console.error('[ReportSyncStatus] Failed to refresh sync status:', error);
        }
    }, []);

    useEffect(() => {
        void refreshStatus();

        const intervalId = window.setInterval(() => {
            void refreshStatus();
        }, POLL_INTERVAL_MS);

        window.addEventListener('online', refreshStatus);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener('online', refreshStatus);
        };
    }, [refreshStatus]);

    if (!status || status.pendingCount <= 0) {
        return null;
    }

    const failedCount = status.failedWithRetryInfo.filter((item) => item.attempts > 0).length;
    const canSyncNow = status.isOnline && !isRefreshing;

    const handleSyncNow = async () => {
        if (!canSyncNow) return;

        setIsRefreshing(true);
        try {
            await syncReportOutbox();
            await refreshStatus();
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleRetryFailed = async () => {
        if (!canSyncNow || failedCount <= 0) return;

        setIsRefreshing(true);
        try {
            await retryFailedReportOutbox();
            await refreshStatus();
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <Card className="mb-4 p-4 border-dashed">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        {status.isOnline ? (
                            <CloudUpload className="h-4 w-4 text-primary" />
                        ) : (
                            <WifiOff className="h-4 w-4 text-amber-600" />
                        )}
                        <p className="text-sm font-medium">Pendências de envio</p>
                        <Badge variant="secondary">{status.pendingCount}</Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        {status.isOnline
                            ? status.isSyncing
                                ? 'Sincronizando observações em segundo plano.'
                                : 'Observações salvas offline aguardando sincronização.'
                            : 'Sem conexão. As observações serão enviadas quando a internet voltar.'}
                    </p>

                    {failedCount > 0 && (
                        <p className="text-xs text-amber-700 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {failedCount} item(ns) com falha de envio.
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                    <Button
                        size="sm"
                        className={cn(!canSyncNow && 'opacity-60')}
                        onClick={handleSyncNow}
                        disabled={!canSyncNow}
                    >
                        {isRefreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                        Enviar agora
                    </Button>

                    {failedCount > 0 && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRetryFailed}
                            disabled={!canSyncNow}
                        >
                            Tentar falhas
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}

