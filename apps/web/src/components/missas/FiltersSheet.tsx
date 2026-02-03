import { useState, useEffect, useMemo } from 'react';
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Filters, getFilteredMasses } from "@/hooks/useMassFilters";
import { Mass, LocationType } from "@/types/masses";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FiltersSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: Filters;
    applyFilters: (filters: Filters) => void;
    availableSuburbs: string[];
    allMasses: Mass[];
    favorites: string[];
}

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const TYPES: LocationType[] = ["MATRIZ", "COMUNIDADE", "CAPELA"];

export default function FiltersSheet({
    open,
    onOpenChange,
    filters,
    applyFilters,
    availableSuburbs,
    allMasses,
    favorites
}: FiltersSheetProps) {

    // Local state for preview
    const [localFilters, setLocalFilters] = useState<Filters>(filters);

    // Reset local state when opening
    useEffect(() => {
        if (open) setLocalFilters(filters);
    }, [open, filters]);

    const previewCount = useMemo(() => {
        return getFilteredMasses(allMasses, localFilters, favorites).length;
    }, [allMasses, localFilters, favorites]);

    const toggleWeekday = (day: number) => {
        setLocalFilters(prev => ({
            ...prev,
            weekdays: prev.weekdays.includes(day)
                ? prev.weekdays.filter(d => d !== day)
                : [...prev.weekdays, day]
        }));
    };

    const toggleSuburb = (suburb: string) => {
        setLocalFilters(prev => ({
            ...prev,
            suburbs: prev.suburbs.includes(suburb)
                ? prev.suburbs.filter(s => s !== suburb)
                : [...prev.suburbs, suburb]
        }));
    };

    const toggleType = (type: LocationType) => {
        setLocalFilters(prev => ({
            ...prev,
            types: prev.types.includes(type)
                ? prev.types.filter(t => t !== type)
                : [...prev.types, type]
        }));
    };

    const handleClear = () => {
        setLocalFilters({
            ...filters,
            weekdays: [],
            suburbs: [],
            types: []
        });
    };

    const handleApply = () => {
        applyFilters(localFilters);
        onOpenChange(false);
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[85vh]">
                <DrawerHeader>
                    <DrawerTitle>Filtros</DrawerTitle>
                </DrawerHeader>

                <ScrollArea className="h-full overflow-y-auto px-4 pb-4">
                    <div className="space-y-6">

                        {/* Weekdays */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium leading-none">Dias da Semana</h3>
                            <div className="flex flex-wrap gap-2">
                                {WEEKDAYS.map((day, idx) => {
                                    const isSelected = localFilters.weekdays.includes(idx);
                                    return (
                                        <Badge
                                            key={day}
                                            variant="outline"
                                            className={cn(
                                                "cursor-pointer px-3 py-1.5 transition-all",
                                                isSelected
                                                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                                                    : "hover:bg-accent"
                                            )}
                                            onClick={() => toggleWeekday(idx)}
                                        >
                                            {day}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Types */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium leading-none">Tipo de Local</h3>
                            <div className="flex gap-2">
                                {TYPES.map((type) => {
                                    const isSelected = localFilters.types.includes(type);
                                    return (
                                        <Badge
                                            key={type}
                                            variant="outline"
                                            className={cn(
                                                "cursor-pointer px-3 py-1.5 transition-all text-xs capitalize",
                                                isSelected
                                                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                                                    : "hover:bg-accent"
                                            )}
                                            onClick={() => toggleType(type)}
                                        >
                                            {type.toLowerCase()}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Neighborhoods */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium leading-none">Bairros</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {availableSuburbs.map(suburb => {
                                    const isSelected = localFilters.suburbs.includes(suburb);
                                    return (
                                        <div
                                            key={suburb}
                                            className={cn(
                                                "flex items-center space-x-2 rounded-lg border p-2 cursor-pointer transition-colors",
                                                isSelected ? "bg-accent border-primary/50" : "hover:bg-accent/50"
                                            )}
                                            onClick={() => toggleSuburb(suburb)}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleSuburb(suburb)}
                                                className="pointer-events-none" // Handled by parent div
                                            />
                                            <span className="text-sm">{suburb}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                </ScrollArea>

                <DrawerFooter className="border-t pt-4">
                    <Button onClick={handleApply}>
                        Aplicar filtros ({previewCount})
                    </Button>
                    <Button variant="outline" onClick={handleClear}>
                        Limpar filtros
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
