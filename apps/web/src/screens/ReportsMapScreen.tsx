/**
 * ReportsMapScreen - Fullscreen interactive map with report pins
 * 
 * Mobile-first, native-first design with:
 * - Fullscreen Leaflet map
 * - Custom pins with category icons (SVG)
 * - Bottom sheet preview with full details
 * - Advanced filter drawer
 * - GPS recenter
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTenantNavigate } from '@/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
    ArrowLeft,
    Plus,
    Crosshair,
    SlidersHorizontal,
    ChevronRight,
    ChevronLeft,
    Clock,
    MapPin,
    Share2,
    Loader2,
    Navigation,
    RefreshCw,
    FileText,
    Calendar,
    Tag,
    CheckCircle2,
    Hash,
    AlignLeft,
    X,
    Sparkles,
    Map as MapIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from '@/components/ui/drawer';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { CategoryIcon } from '@/components/report/CategoryIcon';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { useReportsStats } from '@/hooks/useMyReports';
import { reportService } from '@/services/report.service';
import { useTenantStore } from '@/store/useTenantStore';
import 'leaflet/dist/leaflet.css';

// ============================================
// TYPES
// ============================================

interface MapReport {
    id: string;
    lat: number;
    lon: number;
    category: {
        slug: string;
        name: string;
        icon: string;
        color: string;
    } | null;
    status: string;
    title: string;
    description: string | null;
    protocol: string | null;
    address: string | null;
    addressShort: string;
    images: { url: string; thumb: string }[];
    thumbUrl: string | null;
    createdAt: string;
}

interface MapBounds {
    minLat: number;
    minLon: number;
    maxLat: number;
    maxLon: number;
}

interface ReportCategory {
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
}

// ============================================
// STATUS CONFIG
// ============================================

const statusConfig: Record<string, { label: string; color: string; bgClass: string }> = {
    recebido: { label: 'Recebido', color: '#3b82f6', bgClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
    em_analise: { label: 'Em Análise', color: '#f59e0b', bgClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
    resolvido: { label: 'Resolvido', color: '#10b981', bgClass: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
    rejeitado: { label: 'Rejeitado', color: '#ef4444', bgClass: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' },
};

// ============================================
// DATE PERIOD CONFIG
// ============================================

const periodConfig = [
    { id: 'all', label: 'Todos os períodos', getRange: () => null },
    { id: 'today', label: 'Hoje', getRange: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
    { id: 'week', label: 'Última semana', getRange: () => ({ from: subWeeks(new Date(), 1), to: new Date() }) },
    { id: 'month', label: 'Último mês', getRange: () => ({ from: subMonths(new Date(), 1), to: new Date() }) },
    { id: '3months', label: 'Últimos 3 meses', getRange: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
];

// ============================================
// MDI ICON PATHS
// ============================================

const mdiIconPaths: Record<string, string> = {
    'mdi:road-variant': 'M7 4V2H17V4H19V6H17V8H22V11.3L20.3 20H3.7L2 11.3V8H7V6H5V4H7M9 7V4H15V7L12 11L9 7M4.6 10L6 17H18L19.4 10H4.6Z',
    'mdi:lightbulb-on-outline': 'M12 6C8.69 6 6 8.69 6 12C6 14.22 7.21 16.15 9 17.19V19C9 19.55 9.45 20 10 20H14C14.55 20 15 19.55 15 19V17.19C16.79 16.15 18 14.22 18 12C18 8.69 15.31 6 12 6M14.5 15H9.5V14L12 12L14.5 14V15M12 8C14.21 8 16 9.79 16 12C16 13.5 15.2 14.77 14 15.46V16H10V15.46C8.8 14.77 8 13.5 8 12C8 9.79 9.79 8 12 8Z',
    'mdi:trash-can-outline': 'M9 3V4H4V6H5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V6H20V4H15V3H9M7 6H17V19H7V6M9 8V17H11V8H9M13 8V17H15V8H13Z',
    'mdi:walk': 'M14.12 10H19V8.2H15.38L13.38 4.87C13.08 4.37 12.54 4 11.92 4C11.74 4 11.58 4.04 11.42 4.08L6 5.8V11H7.8V7.33L9.91 6.67L6 22H7.8L10.67 13.89L13 17V22H14.8V15.59L12.31 11.05L13.04 8.18L14.12 10M14 3.8C15 3.8 15.8 3 15.8 2C15.8 1 15 .2 14 .2C13 .2 12.2 1 12.2 2C12.2 3 13 3.8 14 3.8Z',
    'mdi:tree': 'M11 21V15H6L11 3H13L18 15H13V21H11Z',
    'mdi:pipe': 'M22 14V16H20V14H16V16H14V14H10V16H8V14H4V16H2V14C2 12.9 2.9 12 4 12H8V10C8 8.9 8.9 8 10 8H14C15.1 8 16 8.9 16 10V12H20C21.1 12 22 12.9 22 14Z',
    'mdi:parking': 'M13 3H6V21H9V14H13C16.31 14 19 11.31 19 8S16.31 3 13 3M13 11H9V6H13C14.65 6 16 7.35 16 9S14.65 11 13 11Z',
    'mdi:volume-high': 'M14 3.23V5.29C16.89 6.15 19 8.83 19 12C19 15.17 16.89 17.84 14 18.7V20.77C18 19.86 21 16.28 21 12C21 7.72 18 4.14 14 3.23M16.5 12C16.5 10.23 15.5 8.71 14 7.97V16C15.5 15.29 16.5 13.76 16.5 12M3 9V15H7L12 20V4L7 9H3Z',
    'mdi:dots-horizontal': 'M16 12C16 10.9 16.9 10 18 10S20 10.9 20 12 19.1 14 18 14 16 13.1 16 12M10 12C10 10.9 10.9 10 12 10S14 10.9 14 12 13.1 14 12 14 10 13.1 10 12M4 12C4 10.9 4.9 10 6 10S8 10.9 8 12 7.1 14 6 14 4 13.1 4 12Z',
};

function getIconPath(icon: string): string {
    return mdiIconPaths[icon] || mdiIconPaths['mdi:dots-horizontal'];
}

// ============================================
// CREATE CUSTOM MARKER ICON
// ============================================

function createMarkerIcon(icon: string, color: string, isSelected: boolean = false): L.DivIcon {
    const size = isSelected ? 56 : 48;
    const iconPath = getIconPath(icon);

    const html = `
        <div class="marker-pin ${isSelected ? 'marker-selected' : ''}" style="
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${color};
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 16px rgba(0,0,0,0.35);
            transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        ">
            <svg viewBox="0 0 24 24" width="${size * 0.5}" height="${size * 0.5}" fill="white">
                <path d="${iconPath}" />
            </svg>
        </div>
    `;

    return L.divIcon({
        html,
        className: 'custom-marker-wrapper',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
}

// ============================================
// MAP INITIALIZER
// ============================================

function MapInitializer({ onBoundsChange, onZoomChange }: {
    onBoundsChange: (bounds: MapBounds) => void;
    onZoomChange: (zoom: number) => void;
}) {
    const map = useMap();

    useEffect(() => {
        const bounds = map.getBounds();
        onBoundsChange({
            minLat: bounds.getSouth(),
            minLon: bounds.getWest(),
            maxLat: bounds.getNorth(),
            maxLon: bounds.getEast(),
        });
        onZoomChange(map.getZoom());
    }, [map, onBoundsChange, onZoomChange]);

    useMapEvents({
        moveend: () => {
            const bounds = map.getBounds();
            onBoundsChange({
                minLat: bounds.getSouth(),
                minLon: bounds.getWest(),
                maxLat: bounds.getNorth(),
                maxLon: bounds.getEast(),
            });
            onZoomChange(map.getZoom());
        },
        zoomend: () => {
            onZoomChange(map.getZoom());
        },
    });

    return null;
}

// ============================================
// RECENTER CONTROL
// ============================================

function RecenterControl({ lat, lon }: { lat: number; lon: number }) {
    const map = useMap();

    useEffect(() => {
        if (lat && lon) {
            map.flyTo([lat, lon], 16, { duration: 1.2 });
        }
    }, [lat, lon, map]);

    return null;
}

// ============================================
// PREVIEW DRAWER CONTENT
// ============================================

function ReportPreviewContent({
    report,
    statusConfig,
    onViewDetails,
    onRoutes,
    onShare
}: {
    report: MapReport;
    statusConfig: typeof statusConfig;
    onViewDetails: () => void;
    onRoutes: () => void;
    onShare: () => void;
}) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % report.images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + report.images.length) % report.images.length);
    };

    return (
        <div className="px-4 pb-6 space-y-5 overflow-y-auto h-full">
            {/* Header with Title & Badges */}
            <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <Badge className={cn(statusConfig[report.status]?.bgClass, "mb-2")}>
                            {statusConfig[report.status]?.label}
                        </Badge>
                        <h3 className="font-bold text-xl leading-tight text-slate-900 dark:text-slate-100">
                            {report.title}
                        </h3>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="font-medium shrink-0">
                            {report.category?.name || 'Outros'}
                        </Badge>
                        {report.protocol && (
                            <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                #{report.protocol}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Carousel (if images exist) */}
            {report.images.length > 0 ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm group">
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={currentImageIndex}
                            src={report.images[currentImageIndex].url}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full h-full object-cover"
                            alt={`Evidência ${currentImageIndex + 1}`}
                        />
                    </AnimatePresence>

                    {report.images.length > 1 && (
                        <>
                            <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" className="h-8 w-8 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {report.images.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "w-1.5 h-1.5 rounded-full transition-all shadow-sm",
                                            idx === currentImageIndex ? "bg-white w-3" : "bg-white/50"
                                        )}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${report.category?.color || '#64748b'}20` }}
                    >
                        <CategoryIcon
                            icon={report.category?.icon || 'mdi:dots-horizontal'}
                            color={report.category?.color || '#64748b'}
                            size="lg"
                        />
                    </div>
                    <p className="text-sm text-muted-foreground italic">
                        Esta denúncia não possui fotos anexadas.
                    </p>
                </div>
            )}

            {/* Info Cards */}
            <div className="grid gap-3">
                {/* Description */}
                {report.description && (
                    <div className="bg-muted/30 rounded-xl p-3.5 border border-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                            <AlignLeft className="w-4 h-4 text-primary" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição</h4>
                        </div>
                        <p className="text-sm text-foreground/90 leading-relaxed">
                            {report.description}
                        </p>
                    </div>
                )}

                {/* Meta Data Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 rounded-xl p-3 border border-muted/50">
                        <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[10px] font-bold uppercase text-muted-foreground">Local</span>
                        </div>
                        <p className="text-xs font-medium line-clamp-2" title={report.address || report.addressShort}>
                            {report.address || report.addressShort}
                        </p>
                    </div>

                    <div className="bg-muted/30 rounded-xl p-3 border border-muted/50">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[10px] font-bold uppercase text-muted-foreground">Data</span>
                        </div>
                        <p className="text-xs font-medium">
                            {format(new Date(report.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                            há {formatDistanceToNow(new Date(report.createdAt), { locale: ptBR })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
                <Button
                    onClick={onViewDetails}
                    className="w-full h-12 font-semibold shadow-md bg-gradient-to-r from-primary to-primary/90 hover:to-primary"
                    size="lg"
                >
                    <FileText className="w-5 h-5 mr-2" />
                    Ver Detathes Completos
                    <ChevronRight className="w-5 h-5 ml-auto opacity-50" />
                </Button>

                <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={onRoutes} className="h-11 border-muted-foreground/20 hover:bg-muted/50">
                        <Navigation className="w-4 h-4 mr-2 text-blue-500" />
                        Rotas
                    </Button>
                    <Button variant="outline" onClick={onShare} className="h-11 border-muted-foreground/20 hover:bg-muted/50">
                        <Share2 className="w-4 h-4 mr-2 text-green-600" />
                        Compartilhar
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ReportsMapScreen() {
    const navigate = useTenantNavigate();
    const tenantCacheScope = useTenantStore((state) => state.tenantKey ?? state.city?.slug ?? 'global');

    // Map state
    const [bounds, setBounds] = useState<MapBounds | null>(null);
    const [zoom, setZoom] = useState(14);
    const [selectedReport, setSelectedReport] = useState<MapReport | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [recenterTo, setRecenterTo] = useState<{ lat: number; lon: number } | null>(null);

    // GPS state
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [isLocating, setIsLocating] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
    const [periodFilter, setPeriodFilter] = useState<string>('all');
    const statusFilterKey = useMemo(() => [...statusFilter].sort().join(','), [statusFilter]);
    const categoryFilterKey = useMemo(() => [...categoryFilter].sort().join(','), [categoryFilter]);

    // Default center (Tijucas, SC)
    const defaultCenter: [number, number] = [-27.2381, -48.6356];

    // Get total stats
    const { stats } = useReportsStats();
    const totalReports = stats?.total ?? 0;

    // Fetch categories
    const { data: categoriesData = [] } = useQuery({
        queryKey: ['reports', tenantCacheScope, 'categories'],
        queryFn: () => reportService.getCategories(),
        staleTime: 5 * 60 * 1000,
    });
    const categories: ReportCategory[] = categoriesData;

    // Build bbox string for API
    const bboxString = bounds
        ? `${bounds.minLat},${bounds.minLon},${bounds.maxLat},${bounds.maxLon}`
        : null;

    // Memoize callbacks
    const handleBoundsChange = useCallback((newBounds: MapBounds) => {
        setBounds(newBounds);
    }, []);

    const handleZoomChange = useCallback((newZoom: number) => {
        setZoom(newZoom);
    }, []);

    // Fetch reports for current viewport
    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['reports', tenantCacheScope, 'map', bboxString, zoom, statusFilterKey, categoryFilterKey, periodFilter],
        queryFn: () =>
            reportService.getReportsMap({
                bbox: bboxString ?? undefined,
                zoom,
                limit: 300,
                status: statusFilter,
                category: categoryFilter,
            }),
        enabled: !!bboxString,
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
    });

    // Filter by period on client side (for now)
    const reports: MapReport[] = useMemo(() => {
        let filtered = data?.reports || [];

        if (periodFilter !== 'all') {
            const period = periodConfig.find(p => p.id === periodFilter);
            const range = period?.getRange();
            if (range) {
                filtered = filtered.filter((r: MapReport) => {
                    const date = new Date(r.createdAt);
                    return date >= range.from && date <= range.to;
                });
            }
        }

        return filtered;
    }, [data?.reports, periodFilter]);

    // Count active filters
    const activeFiltersCount = statusFilter.length + categoryFilter.length + (periodFilter !== 'all' ? 1 : 0);

    // Clear all filters
    const clearFilters = () => {
        setStatusFilter([]);
        setCategoryFilter([]);
        setPeriodFilter('all');
    };

    // Get user location
    const handleGetLocation = useCallback(() => {
        if (!navigator.geolocation) {
            toast.error('Geolocalização não suportada');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, lon: longitude });
                setRecenterTo({ lat: latitude, lon: longitude });
                setIsLocating(false);
                toast.success('Localização encontrada!');
            },
            () => {
                setIsLocating(false);
                toast.error('Não foi possível obter sua localização');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    // Handle marker click
    const handleMarkerClick = useCallback((report: MapReport) => {
        setSelectedReport(report);
        setIsDrawerOpen(true);
    }, []);

    // Handle view details
    const handleViewDetails = () => {
        if (selectedReport) {
            navigate(`/denuncia/${selectedReport.id}`);
        }
    };

    // Handle share
    const handleShare = async () => {
        if (!selectedReport) return;
        const url = `${window.location.origin}/denuncia/${selectedReport.id}`;

        if (navigator.share) {
            try {
                await navigator.share({ title: selectedReport.title, url });
            } catch (error) {
                console.debug('[ReportsMapScreen] Share flow interrupted:', error);
            }
        } else {
            await navigator.clipboard.writeText(url);
            toast.success('Link copiado!');
        }
    };

    // Handle routes
    const handleRoutes = () => {
        if (!selectedReport) return;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedReport.lat},${selectedReport.lon}`;
        window.open(url, '_blank');
    };

    return (
        <div className="fixed inset-0 flex flex-col bg-background">
            {/* Header */}
            <header className="safe-top bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b z-50 shrink-0">
                <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 -ml-1">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <motion.div
                                initial={{ rotate: -10, scale: 0.8 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                            >
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md">
                                    <MapIcon className="w-5 h-5 text-white" />
                                </div>
                            </motion.div>
                            <div>
                                <h1 className="font-bold text-lg leading-tight flex items-center gap-1.5">
                                    Mapa
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                </h1>
                                <p className="text-xs text-muted-foreground">
                                    {isFetching ? (
                                        <span className="flex items-center gap-1">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Atualizando...
                                        </span>
                                    ) : (
                                        <span>
                                            <strong>{reports.length}</strong> de <strong>{totalReports}</strong> denúncias
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant={activeFiltersCount > 0 ? "default" : "ghost"}
                            size="icon"
                            onClick={() => setIsFilterOpen(true)}
                            className="relative"
                        >
                            <SlidersHorizontal className="w-5 h-5" />
                            {activeFiltersCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-bold">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleGetLocation}
                            disabled={isLocating}
                        >
                            {isLocating ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Crosshair className="w-5 h-5" />
                            )}
                        </Button>
                    </div>
                </div>
            </header>

            {/* Map Container */}
            <div className="flex-1 relative">
                <MapContainer
                    center={defaultCenter}
                    zoom={14}
                    className="w-full h-full z-0"
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; OSM'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapInitializer
                        onBoundsChange={handleBoundsChange}
                        onZoomChange={handleZoomChange}
                    />

                    {recenterTo && (
                        <RecenterControl lat={recenterTo.lat} lon={recenterTo.lon} />
                    )}

                    {/* Report Markers */}
                    {reports.map((report) => (
                        <Marker
                            key={report.id}
                            position={[report.lat, report.lon]}
                            icon={createMarkerIcon(
                                report.category?.icon || 'mdi:dots-horizontal',
                                report.category?.color || '#64748b',
                                selectedReport?.id === report.id
                            )}
                            eventHandlers={{
                                click: () => handleMarkerClick(report),
                            }}
                        />
                    ))}

                    {/* User location marker */}
                    {userLocation && (
                        <Marker
                            position={[userLocation.lat, userLocation.lon]}
                            icon={L.divIcon({
                                html: `
                                    <div class="user-location-marker">
                                        <div class="pulse-ring"></div>
                                        <div class="center-dot"></div>
                                    </div>
                                `,
                                className: 'user-marker-wrapper',
                                iconSize: [24, 24],
                                iconAnchor: [12, 12],
                            })}
                        />
                    )}
                </MapContainer>

                {/* FAB - Nova Denúncia */}
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate('/denuncia/nova')}
                    className="absolute bottom-24 right-4 z-20 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center"
                >
                    <Plus className="w-7 h-7" />
                </motion.button>

                {/* Loading overlay */}
                <AnimatePresence>
                    {isLoading && !reports.length && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-10"
                        >
                            <div className="flex flex-col items-center gap-3 p-6 bg-card rounded-2xl shadow-lg">
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                <span className="text-sm font-medium">Carregando denúncias...</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Quick Filter Bar */}
            <div className="shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t px-3 py-2.5 flex gap-2 overflow-x-auto z-10">
                {Object.entries(statusConfig).map(([status, config]) => (
                    <Button
                        key={status}
                        variant={statusFilter.includes(status) ? "default" : "outline"}
                        size="sm"
                        className={cn(
                            "shrink-0 rounded-full font-medium transition-all",
                            statusFilter.includes(status) && "shadow-md"
                        )}
                        onClick={() => {
                            setStatusFilter(prev =>
                                prev.includes(status)
                                    ? prev.filter(s => s !== status)
                                    : [...prev, status]
                            );
                        }}
                    >
                        {config.label}
                    </Button>
                ))}

                <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 rounded-full ml-auto"
                    onClick={() => refetch()}
                    disabled={isFetching}
                >
                    <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
                </Button>
            </div>

            {/* Bottom Tab Bar */}
            <BottomTabBar />

            {/* Advanced Filter Sheet */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl">
                    <SheetHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <SlidersHorizontal className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <SheetTitle className="text-lg">Filtros Avançados</SheetTitle>
                                    <SheetDescription>
                                        {activeFiltersCount > 0
                                            ? `${activeFiltersCount} filtro${activeFiltersCount > 1 ? 's' : ''} ativo${activeFiltersCount > 1 ? 's' : ''}`
                                            : 'Nenhum filtro ativo'
                                        }
                                    </SheetDescription>
                                </div>
                            </div>
                            {activeFiltersCount > 0 && (
                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                    <X className="w-4 h-4 mr-1" />
                                    Limpar
                                </Button>
                            )}
                        </div>
                    </SheetHeader>

                    <div className="space-y-6 pb-6 overflow-y-auto">
                        {/* Status Filter */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                                <h3 className="font-semibold">Situação</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(statusConfig).map(([status, config]) => (
                                    <label
                                        key={status}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                                            statusFilter.includes(status)
                                                ? "border-primary bg-primary/5"
                                                : "border-muted bg-muted/30 hover:border-muted-foreground/30"
                                        )}
                                    >
                                        <Checkbox
                                            checked={statusFilter.includes(status)}
                                            onCheckedChange={(checked) => {
                                                setStatusFilter(prev =>
                                                    checked
                                                        ? [...prev, status]
                                                        : prev.filter(s => s !== status)
                                                );
                                            }}
                                        />
                                        <span className="font-medium text-sm">{config.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Tag className="w-4 h-4 text-muted-foreground" />
                                <h3 className="font-semibold">Categoria</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {categories.map((cat) => (
                                    <label
                                        key={cat.id}
                                        className={cn(
                                            "flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all",
                                            categoryFilter.includes(cat.slug)
                                                ? "border-primary bg-primary/5"
                                                : "border-muted bg-muted/30 hover:border-muted-foreground/30"
                                        )}
                                    >
                                        <Checkbox
                                            checked={categoryFilter.includes(cat.slug)}
                                            onCheckedChange={(checked) => {
                                                setCategoryFilter(prev =>
                                                    checked
                                                        ? [...prev, cat.slug]
                                                        : prev.filter(s => s !== cat.slug)
                                                );
                                            }}
                                        />
                                        <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                                        <span className="font-medium text-sm truncate">{cat.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Period Filter */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <h3 className="font-semibold">Período</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {periodConfig.map((period) => (
                                    <Button
                                        key={period.id}
                                        variant={periodFilter === period.id ? "default" : "outline"}
                                        size="sm"
                                        className="rounded-full"
                                        onClick={() => setPeriodFilter(period.id)}
                                    >
                                        {period.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Apply Button */}
                        <Button
                            className="w-full h-12 text-base font-semibold"
                            onClick={() => setIsFilterOpen(false)}
                        >
                            Aplicar Filtros
                            {activeFiltersCount > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                    {activeFiltersCount}
                                </Badge>
                            )}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Report Preview Drawer */}
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent className="max-h-[90vh]">
                    <DrawerHeader className="pb-0 pt-2">
                        <DrawerTitle className="sr-only">Detalhes da Denúncia</DrawerTitle>
                        <DrawerDescription className="sr-only">Preview da denúncia selecionada</DrawerDescription>
                    </DrawerHeader>

                    {selectedReport && (
                        <ReportPreviewContent
                            report={selectedReport}
                            statusConfig={statusConfig}
                            onViewDetails={handleViewDetails}
                            onRoutes={handleRoutes}
                            onShare={handleShare}
                        />
                    )}
                </DrawerContent>
            </Drawer>

            {/* Global CSS for markers */}
            <style>{`
                .custom-marker-wrapper {
                    background: transparent !important;
                    border: none !important;
                }
                .marker-pin {
                    animation: marker-pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                @keyframes marker-pop-in {
                    0% { transform: scale(0); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .marker-selected {
                    animation: marker-pulse 1.5s infinite;
                }
                @keyframes marker-pulse {
                    0%, 100% { box-shadow: 0 4px 16px rgba(0,0,0,0.35); }
                    50% { box-shadow: 0 4px 24px rgba(0,0,0,0.5), 0 0 0 8px rgba(0,0,0,0.1); }
                }
                .user-marker-wrapper {
                    background: transparent !important;
                    border: none !important;
                }
                .user-location-marker {
                    position: relative;
                    width: 24px;
                    height: 24px;
                }
                .user-location-marker .center-dot {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 14px;
                    height: 14px;
                    background: #3b82f6;
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                }
                .user-location-marker .pulse-ring {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 40px;
                    height: 40px;
                    background: rgba(59, 130, 246, 0.25);
                    border-radius: 50%;
                    animation: pulse-ring 2s infinite;
                }
                @keyframes pulse-ring {
                    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
                }
                .leaflet-container {
                    font-family: inherit;
                }
            `}</style>
        </div>
    );
}
