/**
 * LocationMap - Real Leaflet Map Component for StepLocation
 * Features:
 * - Draggable marker
 * - Click to move pin
 * - Reverse geocode only on dragend/click
 * - Offline fallback
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navigation, MapPin, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Fix for default marker icon in Leaflet + Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

interface LocationMapProps {
    latitude: number;
    longitude: number;
    zoom?: number;
    onLocationChange: (lat: number, lon: number) => void;
    onCenterGPS?: () => void;
    hasGPS?: boolean;
    className?: string;
}

// Component to handle map events
function MapEventHandler({
    onLocationChange
}: {
    onLocationChange: (lat: number, lon: number) => void;
}) {
    useMapEvents({
        click: (e) => {
            onLocationChange(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

// Component to recenter map
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    const prevCenter = useRef(center);

    useEffect(() => {
        if (
            prevCenter.current[0] !== center[0] ||
            prevCenter.current[1] !== center[1]
        ) {
            map.flyTo(center, zoom, { duration: 0.5 });
            prevCenter.current = center;
        }
    }, [center, zoom, map]);

    return null;
}


// Draggable Marker Component
function DraggableMarker({
    position,
    onDragEnd,
    readOnly = false,
}: {
    position: [number, number];
    onDragEnd: (lat: number, lon: number) => void;
    readOnly?: boolean;
}) {
    const markerRef = useRef<L.Marker>(null);

    const eventHandlers = {
        dragend: () => {
            if (readOnly) return;
            const marker = markerRef.current;
            if (marker) {
                const { lat, lng } = marker.getLatLng();
                onDragEnd(lat, lng);
            }
        },
    };

    return (
        <Marker
            draggable={!readOnly}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
        />
    );
}

export function LocationMap({
    latitude,
    longitude,
    zoom = 16,
    onLocationChange,
    onCenterGPS,
    hasGPS = false,
    className,
    readOnly = false,
}: LocationMapProps & { readOnly?: boolean }) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const position: [number, number] = [latitude, longitude];

    // Online/offline detection
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleMarkerDragEnd = useCallback(
        (lat: number, lon: number) => {
            if (!readOnly) onLocationChange(lat, lon);
        },
        [onLocationChange, readOnly]
    );

    const handleMapClick = useCallback(
        (lat: number, lon: number) => {
            if (!readOnly) onLocationChange(lat, lon);
        },
        [onLocationChange, readOnly]
    );

    // Offline fallback
    if (!isOnline) {
        return (
            <Card className={cn('overflow-hidden', className)}>
                <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex flex-col items-center justify-center p-6 text-center">
                    <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-3">
                        <WifiOff className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="font-medium text-sm">Sem conexão</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        O mapa estará disponível quando você voltar online
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>
                            {latitude.toFixed(4)}, {longitude.toFixed(4)}
                        </span>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className={cn('overflow-hidden', className)}>
            <div className="relative">
                <MapContainer
                    center={position}
                    zoom={zoom}
                    scrollWheelZoom={true}
                    className="h-48 w-full z-0"
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <DraggableMarker
                        position={position}
                        onDragEnd={handleMarkerDragEnd}
                        readOnly={readOnly}
                    />
                    <MapEventHandler onLocationChange={handleMapClick} />
                    <MapController center={position} zoom={zoom} />
                </MapContainer>

                {/* GPS Button */}
                {hasGPS && onCenterGPS && (
                    <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2 z-10 shadow-md"
                        onClick={onCenterGPS}
                    >
                        <Navigation className="h-4 w-4" />
                    </Button>
                )}

                {/* Instructions */}
                <div className="absolute bottom-2 left-2 right-2 z-10">
                    <div className="bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-center text-muted-foreground">
                        Arraste o marcador ou toque para ajustar a posição
                    </div>
                </div>
            </div>
        </Card>
    );
}
