// ReportDetailPage - Detalhes da Denúncia Pública
// Mobile-first, offline-first, native-first

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Share2,
    MapPin,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Copy,
    X,
    ChevronRight,
    FileText,
    Loader2,
    WifiOff,
    Camera,
    Calendar,
    Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/report.service';
import { QUERY_KEYS } from '@/api/config';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

interface StatusHistoryItem {
    status: string;
    note?: string;
    at: string;
    by?: string;
}

// ============================================
// STATUS CONFIG
// ============================================

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof CheckCircle2 }> = {
    recebido: {
        label: 'Recebido',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        icon: FileText,
    },
    em_analise: {
        label: 'Em Análise',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        icon: Clock,
    },
    resolvido: {
        label: 'Resolvido',
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        icon: CheckCircle2,
    },
    rejeitado: {
        label: 'Rejeitado',
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        icon: AlertTriangle,
    },
};

// ============================================
// SUB-COMPONENTS
// ============================================

function ImageGallery({ images, onImageClick }: {
    images: Array<{ id: string; thumbUrl: string; url: string }>;
    onImageClick: (index: number) => void;
}) {
    if (!images || images.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 bg-muted/50 rounded-2xl">
                <div className="text-center text-muted-foreground">
                    <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Sem fotos</p>
                </div>
            </div>
        );
    }

    if (images.length === 1) {
        return (
            <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => onImageClick(0)}
                className="cursor-pointer"
            >
                <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-2xl">
                    <img
                        src={images[0].thumbUrl || images[0].url}
                        alt="Foto da denúncia"
                        className="w-full h-full object-cover"
                    />
                </AspectRatio>
            </motion.div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-2">
            {images.slice(0, 4).map((img, index) => (
                <motion.div
                    key={img.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onImageClick(index)}
                    className={cn(
                        "cursor-pointer overflow-hidden rounded-xl relative",
                        index === 0 && images.length > 2 && "col-span-2"
                    )}
                >
                    <AspectRatio ratio={index === 0 ? 16 / 9 : 1}>
                        <img
                            src={img.thumbUrl || img.url}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </AspectRatio>
                    {index === 3 && images.length > 4 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-lg font-semibold">
                                +{images.length - 4}
                            </span>
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
}

function StatusTimeline({ history }: { history: StatusHistoryItem[] }) {
    if (!history || history.length === 0) return null;

    // Sort by date descending (most recent first)
    const sorted = [...history].sort((a, b) =>
        new Date(b.at).getTime() - new Date(a.at).getTime()
    );

    return (
        <div className="space-y-0">
            {sorted.map((item, index) => {
                const config = statusConfig[item.status] || statusConfig.recebido;
                const Icon = config.icon;
                const isFirst = index === 0;
                const isLast = index === sorted.length - 1;

                return (
                    <div key={index} className="flex gap-3">
                        {/* Timeline line and dot */}
                        <div className="flex flex-col items-center">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                isFirst ? config.bgColor : "bg-muted"
                            )}>
                                <Icon className={cn("w-4 h-4", isFirst ? config.color : "text-muted-foreground")} />
                            </div>
                            {!isLast && (
                                <div className="w-0.5 flex-1 bg-border min-h-[24px]" />
                            )}
                        </div>

                        {/* Content */}
                        <div className={cn("pb-4", isLast && "pb-0")}>
                            <p className={cn(
                                "font-medium",
                                isFirst ? config.color : "text-muted-foreground"
                            )}>
                                {config.label}
                            </p>
                            {item.note && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {item.note}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(item.at), "d 'de' MMMM, HH:mm", { locale: ptBR })}
                                {item.by && ` • ${item.by}`}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function FullscreenGallery({
    images,
    initialIndex,
    onClose
}: {
    images: Array<{ url: string }>;
    initialIndex: number;
    onClose: () => void;
}) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
        >
            {/* Header */}
            <div className="safe-top flex items-center justify-between p-4">
                <Button variant="ghost" size="icon" onClick={onClose} className="text-white">
                    <X className="w-6 h-6" />
                </Button>
                <span className="text-white text-sm">
                    {currentIndex + 1} / {images.length}
                </span>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Image */}
            <div className="flex-1 flex items-center justify-center p-4">
                <img
                    src={images[currentIndex].url}
                    alt={`Foto ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="safe-bottom flex gap-2 p-4 overflow-x-auto">
                    {images.map((img, index) => (
                        <motion.button
                            key={index}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                "w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2",
                                index === currentIndex ? "border-white" : "border-transparent opacity-50"
                            )}
                        >
                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </motion.button>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

// ============================================
// LOADING SKELETON
// ============================================

function LoadingSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <div className="safe-top bg-background border-b">
                <div className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                </div>
            </div>
            <div className="p-4 space-y-4">
                <Skeleton className="h-48 w-full rounded-2xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-24 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                </div>
            </div>
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ReportDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryIndex, setGalleryIndex] = useState(0);

    // Fetch report details
    const { data: report, isLoading, error } = useQuery({
        queryKey: QUERY_KEYS.reports.detail(id || ''),
        queryFn: () => reportService.getReportById(id || ''),
        enabled: !!id,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Memoized status info
    const statusInfo = useMemo(() => {
        if (!report) return statusConfig.recebido;
        return statusConfig[report.status] || statusConfig.recebido;
    }, [report]);

    // Copy protocol to clipboard
    const handleCopyProtocol = () => {
        if (report?.protocol) {
            navigator.clipboard.writeText(report.protocol);
            toast.success('Protocolo copiado!');
        }
    };

    // Share report
    const handleShare = async () => {
        const url = `${window.location.origin}/denuncia/${id}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: report?.title || 'Denúncia',
                    text: `Acompanhe esta denúncia em Tijucas: ${report?.title}`,
                    url,
                });
            } catch (e) {
                // User cancelled
            }
        } else {
            navigator.clipboard.writeText(url);
            toast.success('Link copiado!');
        }
    };

    // Open gallery
    const handleImageClick = (index: number) => {
        setGalleryIndex(index);
        setGalleryOpen(true);
    };

    // Loading state
    if (isLoading) {
        return <LoadingSkeleton />;
    }

    // Error state
    if (error || !report) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <div className="safe-top bg-background border-b">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="font-semibold">Denúncia</h1>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <WifiOff className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h2 className="text-lg font-semibold mb-2">Não foi possível carregar</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            Verifique sua conexão e tente novamente
                        </p>
                        <Button onClick={() => navigate(-1)}>Voltar</Button>
                    </div>
                </div>
            </div>
        );
    }

    const StatusIcon = statusInfo.icon;

    return (
        <>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
                {/* Header */}
                <div className="safe-top bg-white dark:bg-slate-900 border-b sticky top-0 z-20">
                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground truncate">
                                    Protocolo
                                </p>
                                <p className="font-mono text-sm font-medium truncate">
                                    {report.protocol}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={handleCopyProtocol}>
                                <Copy className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleShare}>
                                <Share2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Status Badge */}
                    <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                        statusInfo.bgColor,
                        statusInfo.color
                    )}>
                        <StatusIcon className="w-4 h-4" />
                        {statusInfo.label}
                    </div>

                    {/* Image Gallery */}
                    <ImageGallery
                        images={report.media || []}
                        onImageClick={handleImageClick}
                    />

                    {/* Title & Description */}
                    <Card className="p-4">
                        <h1 className="text-xl font-bold mb-2">{report.title}</h1>
                        <p className="text-muted-foreground">{report.description}</p>
                    </Card>

                    {/* Category & Date */}
                    <div className="flex flex-wrap gap-2">
                        {report.category && (
                            <Badge variant="secondary" className="gap-1.5">
                                {report.category.icon && <span>{report.category.icon}</span>}
                                {report.category.name}
                            </Badge>
                        )}
                        <Badge variant="outline" className="gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {formatDistanceToNow(new Date(report.createdAt), {
                                addSuffix: true,
                                locale: ptBR
                            })}
                        </Badge>
                    </div>

                    {/* Location */}
                    {report.addressText && (
                        <Card className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium">Localização</p>
                                    <p className="text-sm text-muted-foreground">
                                        {report.addressText}
                                    </p>
                                    {report.bairro?.nome && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {report.bairro.nome}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Mini Map - Placeholder for now */}
                            {report.latitude && report.longitude && (
                                <div className="mt-4">
                                    <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                                        <a
                                            href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-primary text-sm font-medium"
                                        >
                                            <MapPin className="w-4 h-4" />
                                            Ver no Google Maps
                                            <ChevronRight className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Status Timeline */}
                    {report.history && report.history.length > 0 && (
                        <Card className="p-4">
                            <h2 className="font-semibold mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                Histórico
                            </h2>
                            <StatusTimeline history={report.history} />
                        </Card>
                    )}

                    {/* Resolved date */}
                    {report.resolvedAt && (
                        <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <div>
                                    <p className="font-medium text-green-700 dark:text-green-400">
                                        Resolvido
                                    </p>
                                    <p className="text-sm text-green-600/80 dark:text-green-400/80">
                                        {format(new Date(report.resolvedAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* Fullscreen Gallery */}
            <AnimatePresence>
                {galleryOpen && report.media && (
                    <FullscreenGallery
                        images={report.media}
                        initialIndex={galleryIndex}
                        onClose={() => setGalleryOpen(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
