// ======================================================
// ForumFiltersChips - Collapsible filter row
// ======================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, Image, Calendar, MapPin } from 'lucide-react';
import { TopicCategory } from '@/types';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { bairros } from '@/constants/bairros';

const categoryOptions: { value: TopicCategory; label: string; color: string }[] = [
    { value: 'reclamacao', label: 'Reclamação', color: 'bg-red-100 text-red-700 border-red-200' },
    { value: 'sugestao', label: 'Sugestão', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'duvida', label: 'Dúvida', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { value: 'alerta', label: 'Alerta', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { value: 'elogio', label: 'Elogio', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'outros', label: 'Outros', color: 'bg-gray-100 text-gray-700 border-gray-200' },
];

const periodOptions = [
    { value: 'hoje', label: 'Hoje' },
    { value: '7dias', label: '7 dias' },
    { value: '30dias', label: '30 dias' },
    { value: 'todos', label: 'Todos' },
];

export interface ForumFilters {
    categoria?: TopicCategory;
    bairroId?: string;
    comFoto?: boolean;
    periodo?: string;
    meuBairro?: boolean;
}

interface ForumFiltersChipsProps {
    filters: ForumFilters;
    onChange: (filters: ForumFilters) => void;
    userBairroId?: string;
}

export function ForumFiltersChips({ filters, onChange, userBairroId }: ForumFiltersChipsProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const activeFiltersCount = Object.values(filters).filter(Boolean).length;

    const updateFilter = <K extends keyof ForumFilters>(key: K, value: ForumFilters[K]) => {
        onChange({ ...filters, [key]: value });
    };

    const clearFilter = (key: keyof ForumFilters) => {
        const newFilters = { ...filters };
        delete newFilters[key];
        onChange(newFilters);
    };

    const clearAll = () => {
        onChange({});
    };

    return (
        <div className="px-4 pb-3">
            {/* Toggle button + Active filters preview */}
            <div className="flex items-center gap-2 mb-2">
                <motion.button
                    onClick={() => setIsExpanded(!isExpanded)}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] ${isExpanded || activeFiltersCount > 0
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                        }`}
                >
                    <span>Filtros</span>
                    {activeFiltersCount > 0 && (
                        <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full text-xs flex items-center justify-center">
                            {activeFiltersCount}
                        </span>
                    )}
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="w-4 h-4" />
                    </motion.div>
                </motion.button>

                {/* Quick active filters */}
                <div className="flex-1 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-1.5">
                        {filters.categoria && (
                            <ActiveChip
                                label={categoryOptions.find(c => c.value === filters.categoria)?.label || ''}
                                onRemove={() => clearFilter('categoria')}
                            />
                        )}
                        {filters.comFoto && (
                            <ActiveChip
                                label="Com foto"
                                icon={<Image className="w-3 h-3" />}
                                onRemove={() => clearFilter('comFoto')}
                            />
                        )}
                        {filters.meuBairro && (
                            <ActiveChip
                                label="Meu bairro"
                                icon={<MapPin className="w-3 h-3" />}
                                onRemove={() => clearFilter('meuBairro')}
                            />
                        )}
                    </div>
                </div>

                {activeFiltersCount > 0 && (
                    <button
                        onClick={clearAll}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                    >
                        Limpar
                    </button>
                )}
            </div>

            {/* Expanded filters */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-3 py-2">
                            {/* Categoria */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                    Categoria
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {categoryOptions.map((cat) => (
                                        <motion.button
                                            key={cat.value}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() =>
                                                updateFilter('categoria', filters.categoria === cat.value ? undefined : cat.value)
                                            }
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all min-h-[36px] ${filters.categoria === cat.value
                                                ? `${cat.color} border-current`
                                                : 'bg-background border-border text-muted-foreground hover:border-foreground/30'
                                                }`}
                                        >
                                            {cat.label}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Bairro + Período row */}
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                        Bairro
                                    </label>
                                    <Select
                                        value={filters.bairroId || '__all__'}
                                        onValueChange={(val) => updateFilter('bairroId', val === '__all__' ? undefined : val)}
                                    >
                                        <SelectTrigger className="h-11 rounded-xl">
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__all__">Todos</SelectItem>
                                            {bairros.map((b) => (
                                                <SelectItem key={b.id} value={b.id}>
                                                    {b.nome}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex-1">
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                        Período
                                    </label>
                                    <Select
                                        value={filters.periodo || '__all__'}
                                        onValueChange={(val) => updateFilter('periodo', val === '__all__' ? undefined : val)}
                                    >
                                        <SelectTrigger className="h-11 rounded-xl">
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__all__">Todos</SelectItem>
                                            {periodOptions.map((p) => (
                                                <SelectItem key={p.value} value={p.value}>
                                                    {p.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="flex gap-2">
                                <ToggleChip
                                    label="Só com foto"
                                    icon={<Image className="w-4 h-4" />}
                                    active={!!filters.comFoto}
                                    onClick={() => updateFilter('comFoto', !filters.comFoto)}
                                />
                                {userBairroId && (
                                    <ToggleChip
                                        label="Meu bairro"
                                        icon={<MapPin className="w-4 h-4" />}
                                        active={!!filters.meuBairro}
                                        onClick={() => updateFilter('meuBairro', !filters.meuBairro)}
                                    />
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Helper components
function ActiveChip({ label, icon, onRemove }: {
    label: string;
    icon?: React.ReactNode;
    onRemove: () => void;
}) {
    return (
        <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
        >
            {icon}
            {label}
            <button
                onClick={onRemove}
                className="ml-0.5 p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                aria-label={`Remover filtro ${label}`}
            >
                <X className="w-3 h-3" />
            </button>
        </motion.span>
    );
}

function ToggleChip({
    label,
    icon,
    active,
    onClick
}: {
    label: string;
    icon: React.ReactNode;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all min-h-[44px] ${active
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted-foreground/10'
                }`}
        >
            {icon}
            {label}
        </motion.button>
    );
}

export default ForumFiltersChips;
