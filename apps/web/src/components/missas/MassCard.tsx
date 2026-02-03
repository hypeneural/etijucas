import { Mass } from "@/types/masses";
import { motion } from "framer-motion";
import { MapPin, Heart, Navigation, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MassCardProps {
    mass: Mass;
    isFavorite: boolean;
    onToggleFavorite: (id: string) => void;
    highlight?: boolean;
}

export default function MassCard({ mass, isFavorite, onToggleFavorite, highlight }: MassCardProps) {
    const location = mass.location!;
    const typeLabel = location.type === "MATRIZ" ? "Matriz" : location.type === "CAPELA" ? "Capela" : "Comunidade";

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (navigator.share) {
            navigator.share({
                title: `Missa na ${location.name}`,
                text: `Horário de missa: ${mass.time} - ${location.name} (${location.neighborhood})`,
                url: window.location.href,
            }).catch(() => { });
        }
    };

    const openMap = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Use geo if available, else search query
        const query = location.geo
            ? `${location.geo.lat},${location.geo.lng}`
            : `${location.name}, ${location.neighborhood}, Tijucas - SC`;
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-colors",
                highlight ? "border-primary/50 bg-primary/5 shadow-md" : "border-border/50"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "text-3xl font-bold tracking-tight text-foreground",
                            highlight && "text-primary"
                        )}>
                            {mass.time}
                        </span>
                        <Badge variant="secondary" className="h-6 px-2 text-[10px] uppercase tracking-wide">
                            {typeLabel}
                        </Badge>
                        {highlight && (
                            <Badge className="h-6 px-2 text-[10px] uppercase tracking-wide bg-primary text-primary-foreground">
                                Próxima
                            </Badge>
                        )}
                    </div>
                    <h3 className="mt-1 font-semibold text-card-foreground leading-tight">
                        {location.name}
                    </h3>
                    <div className="mt-1 flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-1 h-3.5 w-3.5" />
                        {location.neighborhood || "Bairro não informado"}
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-8 w-8 rounded-full transition-colors",
                        isFavorite ? "text-red-500 hover:text-red-600 hover:bg-red-50" : "text-muted-foreground"
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(location.id);
                    }}
                >
                    <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
                </Button>
            </div>

            <div className="mt-4 flex items-center gap-2">
                <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 flex-1 text-xs font-medium"
                    onClick={openMap}
                >
                    <Navigation className="mr-2 h-3.5 w-3.5" />
                    Como chegar
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handleShare}
                >
                    <Share2 className="h-4 w-4" />
                </Button>
            </div>

            {mass.note && (
                <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    Observação: {mass.note}
                </div>
            )}
        </motion.div>
    );
}
