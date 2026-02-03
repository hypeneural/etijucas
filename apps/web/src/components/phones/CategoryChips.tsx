// ======================================================
// CategoryChips - Horizontal scrollable category filters
// ======================================================

import { useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Star,
    AlertTriangle,
    Shield,
    Heart,
    Building2,
    GraduationCap,
    Wrench,
    Map,
    Phone,
    Sparkles
} from 'lucide-react';
import { PhoneCategory } from '@/types';
import { cn } from '@/lib/utils';

interface CategoryChipsProps {
    selectedCategory: PhoneCategory | 'all' | 'favorites';
    onSelectCategory: (category: PhoneCategory | 'all' | 'favorites') => void;
    favoritesCount?: number;
}

interface ChipData {
    id: PhoneCategory | 'all' | 'favorites';
    label: string;
    icon: React.ElementType;
}

const chips: ChipData[] = [
    { id: 'all', label: 'Todos', icon: Sparkles },
    { id: 'favorites', label: 'Favoritos', icon: Star },
    { id: 'emergencias', label: 'Emergências', icon: AlertTriangle },
    { id: 'saude', label: 'Saúde', icon: Heart },
    { id: 'prefeitura', label: 'Prefeitura', icon: Building2 },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
    { id: 'utilidades', label: 'Utilidades', icon: Wrench },
    { id: 'educacao', label: 'Educação', icon: GraduationCap },
    { id: 'turismo', label: 'Turismo', icon: Map },
    { id: 'outros', label: 'Outros', icon: Phone },
];

export function CategoryChips({ selectedCategory, onSelectCategory, favoritesCount = 0 }: CategoryChipsProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    return (
        <div
            ref={scrollRef}
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            {chips.map((chip) => {
                const isSelected = selectedCategory === chip.id;
                const Icon = chip.icon;
                const showCount = chip.id === 'favorites' && favoritesCount > 0;

                return (
                    <motion.button
                        key={chip.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelectCategory(chip.id)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                            isSelected
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-muted/60 text-muted-foreground hover:bg-muted"
                        )}
                    >
                        <Icon className="w-4 h-4" />
                        <span>{chip.label}</span>
                        {showCount && (
                            <span className={cn(
                                "ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                                isSelected ? "bg-primary-foreground/20" : "bg-yellow-200 text-yellow-800"
                            )}>
                                {favoritesCount}
                            </span>
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
}
