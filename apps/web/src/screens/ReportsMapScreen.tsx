/**
 * ReportsMapScreen - Fullscreen interactive map with report pins
 * 
 * Mobile-first, native-first design with:
 * - Fullscreen Leaflet map
 * - Custom pins with category icons
 * - Bottom sheet preview
 * - Filter chips
 * - GPS recenter
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import { Icon } from '@iconify/react';
import {
    ArrowLeft,
    Plus,
    Crosshair,
    Filter,
    X,
    ChevronRight,
    Clock,
    MapPin,
    Share2,
    Loader2,
    Navigation,
    RefreshCw,
    Wifi,
    WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { CategoryIcon } from '@/components/report/CategoryIcon';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
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
    addressShort: string;
    thumbUrl: string | null;
    createdAt: string;
}

interface MapBounds {
    minLat: number;
    minLon: number;
    maxLat: number;
    maxLon: number;
}

// ============================================
// STATUS CONFIG
// ============================================

const statusConfig: Record<string, { label: string; color: string }> = {
    recebido: { label: 'Recebido', color: 'bg-blue-100 text-blue-700' },
    em_analise: { label: 'Em Análise', color: 'bg-amber-100 text-amber-700' },
    resolvido: { label: 'Resolvido', color: 'bg-green-100 text-green-700' },
    rejeitado: { label: 'Rejeitado', color: 'bg-red-100 text-red-700' },
};

// ============================================
// CREATE CUSTOM MARKER ICON
// ============================================

function createMarkerIcon(icon: string, color: string, isSelected: boolean = false): L.DivIcon {
    const size = isSelected ? 52 : 44;
    const iconSize = isSelected ? 24 : 20;

    const html = `
        <div style="
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${color};
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: transform 0.2s;
            ${isSelected ? 'transform: scale(1.1);' : ''}
        ">
            <span style="color: white; font-size: ${iconSize}px; line-height: 1;">
                ${renderToString(<Icon icon={icon} width={iconSize} height={iconSize} />)}
            </span>
        </div>
    `;

    return L.divIcon({
        html,
        className: 'custom-marker',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
}

// ============================================
// MAP EVENT HANDLER
// ============================================

function MapEventHandler({
    onBoundsChange,
    onZoomChange,
}: {
    onBoundsChange: (bounds: MapBounds) => void;
    onZoomChange: (zoom: number) => void;
}) {
    const map = useMapEvents({
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
// RECENTER BUTTON
// ============================================

function RecenterButton({ lat, lon }: { lat: number; lon: number }) {
    const map = useMap();

    useEffect(() => {
        if (lat && lon) {
            map.flyTo([lat, lon], 15, { duration: 1 });
        }
    }, [lat, lon, map]);

    return null;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ReportsMapScreen() {
    const navigate = useNavigate();

    // Map state
    const [bounds, setBounds] = useState<MapBounds | null>(null);
    const [zoom, setZoom] = useState(14);
    const [selectedReport, setSelectedReport] = useState<MapReport | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [recenterTo, setRecenterTo] = useState<{ lat: number; lon: number } | null>(null);

    // GPS state
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [isLocating, setIsLocating] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<string[]>([]);

    // Default center (Tijucas, SC)
    const defaultCenter: [number, number] = [-27.2381, -48.6356];

    // Build bbox string for API
    const bboxString = bounds
        ? `${bounds.minLat},${bounds.minLon},${bounds.maxLat},${bounds.maxLon}`
        : null;

    // Fetch reports for current viewport
    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['reports', 'map', bboxString, zoom, statusFilter, categoryFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (bboxString) params.set('bbox', bboxString);
            params.set('zoom', String(zoom));
            params.set('limit', '200');
            if (statusFilter.length) params.set('status', statusFilter.join(','));
            if (categoryFilter.length) params.set('category', categoryFilter.join(','));

            const response = await fetch(`/api/v1/reports/map?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch');
            return response.json();
        },
        enabled: !!bboxString,
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
    });

    const reports: MapReport[] = data?.reports || [];

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
            (error) => {
                setIsLocating(false);
                toast.error('Não foi possível obter sua localização');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    // Handle marker click
    const handleMarkerClick = (report: MapReport) => {
        setSelectedReport(report);
        setIsSheetOpen(true);
    };

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
            } catch { }
        } else {
            await navigator.clipboard.writeText(url);
            toast.success('Link copiado!');
        }
    };

    // Handle routes (open in maps)
    const handleRoutes = () => {
        if (!selectedReport) return;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedReport.lat},${selectedReport.lon}`;
        window.open(url, '_blank');
    };

    return (
        <div className="fixed inset-0 flex flex-col bg-background">
            {/* Header */}
            <div className="safe-top bg-white dark:bg-slate-900 border-b z-50 shrink-0">
                <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="font-semibold text-lg">Mapa de Denúncias</h1>
                    </div>
                    <div className="flex items-center gap-1">
                        {/* Status indicator */}
                        <div className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                            isFetching ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                        )}>
                            {isFetching ? (
                                <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Atualizando...</span>
                                </>
                            ) : (
                                <>
                                    <Wifi className="w-3 h-3" />
                                    <span>{reports.length} pins</span>
                                </>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleGetLocation} disabled={isLocating}>
                            {isLocating ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Crosshair className="w-5 h-5" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative">
                <MapContainer
                    center={userLocation ? [userLocation.lat, userLocation.lon] : defaultCenter}
                    zoom={14}
                    className="w-full h-full z-0"
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapEventHandler
                        onBoundsChange={setBounds}
                        onZoomChange={setZoom}
                    />

                    {recenterTo && (
                        <RecenterButton lat={recenterTo.lat} lon={recenterTo.lon} />
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
                                    <div style="
                                        width: 20px;
                                        height: 20px;
                                        background: #3b82f6;
                                        border: 3px solid white;
                                        border-radius: 50%;
                                        box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3);
                                    "></div>
                                `,
                                className: 'user-marker',
                                iconSize: [20, 20],
                                iconAnchor: [10, 10],
                            })}
                        />
                    )}
                </MapContainer>

                {/* FAB - Nova Denúncia */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate('/denuncia/nova')}
                    className="absolute bottom-24 right-4 z-20 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
                >
                    <Plus className="w-6 h-6" />
                </motion.button>

                {/* Loading overlay */}
                {isLoading && !reports.length && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Carregando denúncias...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Filter Bar */}
            <div className="shrink-0 bg-white dark:bg-slate-900 border-t px-3 py-2 flex gap-2 overflow-x-auto z-10">
                <Button
                    variant={statusFilter.length ? "default" : "outline"}
                    size="sm"
                    className="shrink-0 rounded-full"
                    onClick={() => setIsFilterOpen(true)}
                >
                    <Filter className="w-4 h-4 mr-1" />
                    Filtros
                    {(statusFilter.length + categoryFilter.length) > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                            {statusFilter.length + categoryFilter.length}
                        </Badge>
                    )}
                </Button>

                {/* Quick status filters */}
                {['recebido', 'em_analise', 'resolvido'].map((status) => (
                    <Button
                        key={status}
                        variant={statusFilter.includes(status) ? "default" : "outline"}
                        size="sm"
                        className="shrink-0 rounded-full"
                        onClick={() => {
                            setStatusFilter(prev =>
                                prev.includes(status)
                                    ? prev.filter(s => s !== status)
                                    : [...prev, status]
                            );
                        }}
                    >
                        {statusConfig[status]?.label}
                    </Button>
                ))}

                <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 rounded-full"
                    onClick={() => refetch()}
                >
                    <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
                </Button>
            </div>

            {/* Bottom Tab Bar */}
            <BottomTabBar />

            {/* Report Preview Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="bottom" className="rounded-t-3xl max-h-[70vh]">
                    {selectedReport && (
                        <div className="space-y-4">
                            {/* Header */}
                            <div className="flex items-start gap-3">
                                {selectedReport.thumbUrl ? (
                                    <img
                                        src={selectedReport.thumbUrl}
                                        alt=""
                                        className="w-20 h-20 rounded-xl object-cover bg-muted shrink-0"
                                    />
                                ) : (
                                    <CategoryIcon
                                        icon={selectedReport.category?.icon || 'mdi:dots-horizontal'}
                                        color={selectedReport.category?.color || '#64748b'}
                                        size="xl"
                                        withBackground
                                        className="shrink-0"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-lg line-clamp-2">{selectedReport.title}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge className={statusConfig[selectedReport.status]?.color}>
                                            {statusConfig[selectedReport.status]?.label}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {selectedReport.category?.name}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Address & Time */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{selectedReport.addressShort}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                        {formatDistanceToNow(new Date(selectedReport.createdAt), {
                                            addSuffix: true,
                                            locale: ptBR,
                                        })}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-2">
                                <Button onClick={handleViewDetails} className="h-12">
                                    Ver Detalhes
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                                <Button variant="outline" onClick={handleRoutes} className="h-12">
                                    <Navigation className="w-4 h-4 mr-2" />
                                    Rotas
                                </Button>
                            </div>

                            <Button
                                variant="ghost"
                                className="w-full"
                                onClick={handleShare}
                            >
                                <Share2 className="w-4 h-4 mr-2" />
                                Compartilhar
                            </Button>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Global CSS for markers */}
            <style>{`
                .custom-marker {
                    background: transparent !important;
                    border: none !important;
                }
                .user-marker {
                    background: transparent !important;
                    border: none !important;
                }
                .leaflet-container {
                    font-family: inherit;
                }
            `}</style>
        </div>
    );
}
