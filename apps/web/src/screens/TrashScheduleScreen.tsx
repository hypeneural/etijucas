import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trash2,
    Star,
    ChevronDown,
    Info,
    SlidersHorizontal,
    Recycle,
    X,
    Bell,
    ChevronRight,
    MapPin,
    Truck,
    Calendar,
    Clock,
    Lightbulb,
    AlertCircle
} from 'lucide-react';
import { useTrashSchedule } from '@/hooks/useTrashSchedule';
import { getNextCollection } from '@/services/trash.service';
import {
    TrashNeighborhood,
    Weekday,
    SERVICE_TYPE_LABELS,
    CADENCE_LABELS,
} from '@/types/trash.types';
import { cn } from '@/lib/utils';

// Day chips for filtering
const DAYS: { key: 'TODAY' | Weekday; label: string }[] = [
    { key: 'TODAY', label: 'Hoje' },
    { key: 'MON', label: 'Seg' },
    { key: 'TUE', label: 'Ter' },
    { key: 'WED', label: 'Qua' },
    { key: 'THU', label: 'Qui' },
    { key: 'FRI', label: 'Sex' },
    { key: 'SAT', label: 'Sáb' },
    { key: 'SUN', label: 'Dom' },
];

// Service type toggle options
const SERVICE_TYPES = [
    { key: 'COMMON' as const, label: 'Comum', icon: Trash2 },
    { key: 'SELECTIVE' as const, label: 'Seletiva', icon: Recycle },
    { key: 'BOTH' as const, label: 'Ambas', icon: null },
];

// Animation variants
const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        transition: { duration: 0.2 }
    },
    tap: { scale: 0.97 }
};

const staggerContainer = {
    visible: {
        transition: {
            staggerChildren: 0.06
        }
    }
};

// Neighborhood Card Component - Using forwardRef to fix React warning
interface NeighborhoodCardProps {
    neighborhood: TrashNeighborhood;
    isFavorite: boolean;
    onFavorite: () => void;
    onSelect: () => void;
    serviceType: 'COMMON' | 'SELECTIVE' | 'BOTH';
}

const NeighborhoodCard = forwardRef<HTMLDivElement, NeighborhoodCardProps>(
    ({ neighborhood, isFavorite, onFavorite, onSelect, serviceType }, ref) => {
        const nextCollection = getNextCollection(neighborhood, serviceType);
        const isToday = nextCollection && nextCollection.date.toDateString() === new Date().toDateString();

        return (
            <motion.div
                ref={ref}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                whileTap="tap"
                layout
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer"
                onClick={onSelect}
            >
                <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <h3 className="font-semibold text-gray-900 text-lg">{neighborhood.name}</h3>
                            </div>
                            {neighborhood.collections.common.cadence === 'BIWEEKLY' && (
                                <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-1">
                                    <Clock className="w-3 h-3" />
                                    Quinzenal
                                </span>
                            )}
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.8 }}
                            whileHover={{ scale: 1.1 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onFavorite();
                            }}
                            className="p-2 -mr-2 -mt-1"
                        >
                            <motion.div
                                animate={isFavorite ? { rotate: [0, -15, 15, 0], scale: [1, 1.2, 1] } : {}}
                                transition={{ duration: 0.4 }}
                            >
                                <Star
                                    className={cn(
                                        "w-5 h-5 transition-colors",
                                        isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                    )}
                                />
                            </motion.div>
                        </motion.button>
                    </div>

                    {/* Collection chips */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {(serviceType === 'COMMON' || serviceType === 'BOTH') && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-xl text-sm"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="font-medium">{neighborhood.collections.common.human}</span>
                            </motion.div>
                        )}
                        {(serviceType === 'SELECTIVE' || serviceType === 'BOTH') && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.05 }}
                                className="flex items-center gap-1.5 bg-cyan-50 text-cyan-700 px-2.5 py-1.5 rounded-xl text-sm"
                            >
                                <Recycle className="w-3.5 h-3.5" />
                                <span className="font-medium">{neighborhood.collections.selective.human}</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Next collection badge */}
                    {nextCollection && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className={cn(
                                "flex items-center justify-between p-3 rounded-xl",
                                isToday
                                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30"
                                    : "bg-gray-50 text-gray-700"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <motion.div
                                    animate={isToday ? { rotate: [0, -10, 10, 0] } : {}}
                                    transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                                >
                                    {nextCollection.type === 'COMMON' ? (
                                        <Trash2 className="w-5 h-5" />
                                    ) : (
                                        <Recycle className="w-5 h-5" />
                                    )}
                                </motion.div>
                                <span className="font-semibold">
                                    {isToday ? 'Coleta hoje!' : `Próxima: ${nextCollection.dayLabel}`}
                                </span>
                            </div>
                            <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-medium",
                                isToday ? "bg-white/25" : "bg-gray-200"
                            )}>
                                {SERVICE_TYPE_LABELS[nextCollection.type]}
                            </span>
                        </motion.div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                    <span className="text-sm text-primary font-medium flex items-center gap-1">
                        Ver detalhes
                        <ChevronRight className="w-4 h-4" />
                    </span>
                </div>
            </motion.div>
        );
    }
);

NeighborhoodCard.displayName = 'NeighborhoodCard';

// Neighborhood Details Bottom Sheet
function NeighborhoodDetailsSheet({
    neighborhood,
    isOpen,
    onClose,
    isFavorite,
    onFavorite,
}: {
    neighborhood: TrashNeighborhood | null;
    isOpen: boolean;
    onClose: () => void;
    isFavorite: boolean;
    onFavorite: () => void;
}) {
    if (!neighborhood) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        onClick={onClose}
                    />

                    {/* Sheet - Higher z-index and more bottom padding */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[100] max-h-[90vh] overflow-auto"
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-white">
                            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                        </div>

                        <div className="px-5 pb-32">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl">
                                        <MapPin className="w-6 h-6 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">{neighborhood.name}</h2>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
                                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </motion.button>
                            </div>

                            {/* Common Collection */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="mb-6"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-3 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/30">
                                        <Trash2 className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">Coleta Comum</h3>
                                        <p className="text-sm text-gray-500">Lixo orgânico e rejeitos</p>
                                    </div>
                                </div>

                                <div className="bg-emerald-50 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>Dias:</span>
                                        </div>
                                        <span className="font-semibold text-emerald-700">{neighborhood.collections.common.human}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Clock className="w-4 h-4" />
                                            <span>Frequência:</span>
                                        </div>
                                        <span className="font-semibold text-emerald-700">
                                            {CADENCE_LABELS[neighborhood.collections.common.cadence]}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Selective Collection */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="mb-8"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-3 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl shadow-lg shadow-cyan-500/30">
                                        <Recycle className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">Coleta Seletiva</h3>
                                        <p className="text-sm text-gray-500">Recicláveis: papel, plástico, metal, vidro</p>
                                    </div>
                                </div>

                                <div className="bg-cyan-50 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>Dias:</span>
                                        </div>
                                        <span className="font-semibold text-cyan-700">{neighborhood.collections.selective.human}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Clock className="w-4 h-4" />
                                            <span>Frequência:</span>
                                        </div>
                                        <span className="font-semibold text-cyan-700">
                                            {CADENCE_LABELS[neighborhood.collections.selective.cadence]}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Actions - Fixed at bottom with safe area */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex gap-3"
                            >
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onFavorite}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-2xl font-semibold transition-all",
                                        isFavorite
                                            ? "bg-yellow-100 text-yellow-700 shadow-lg shadow-yellow-500/20"
                                            : "bg-gray-100 text-gray-700"
                                    )}
                                >
                                    <Star className={cn("w-5 h-5", isFavorite && "fill-current")} />
                                    {isFavorite ? 'Favoritado' : 'Favoritar'}
                                </motion.button>

                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    className="flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-2xl font-semibold bg-gradient-to-r from-primary to-teal-500 text-white shadow-lg shadow-primary/30"
                                    onClick={() => {
                                        alert('Lembretes por notificação em breve!');
                                    }}
                                >
                                    <Bell className="w-5 h-5" />
                                    Lembrete
                                </motion.button>
                            </motion.div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Info Modal
function InfoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-4 m-auto max-w-sm h-fit bg-white rounded-3xl z-[100] p-6 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <Info className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-bold">Como funciona?</h3>
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="p-2 rounded-full bg-gray-100"
                            >
                                <X className="w-4 h-4" />
                            </motion.button>
                        </div>

                        <div className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex gap-3"
                            >
                                <div className="p-2.5 bg-emerald-100 rounded-xl h-fit">
                                    <Trash2 className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-emerald-700">Coleta Comum</h4>
                                    <p className="text-sm text-gray-600">
                                        Lixo orgânico, restos de comida, rejeitos não recicláveis.
                                        Sacos pretos ou cinzas.
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex gap-3"
                            >
                                <div className="p-2.5 bg-cyan-100 rounded-xl h-fit">
                                    <Recycle className="w-5 h-5 text-cyan-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-cyan-700">Coleta Seletiva</h4>
                                    <p className="text-sm text-gray-600">
                                        Materiais recicláveis: papel, plástico, metal e vidro.
                                        Sacos azuis ou identificados.
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex gap-3 bg-amber-50 p-3 rounded-xl"
                            >
                                <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                <p className="text-sm text-amber-800">
                                    <strong>Dica:</strong> Coloque o lixo na calçada até às 7h da manhã do dia de coleta.
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Advanced Filters Sheet
function AdvancedFiltersSheet({
    isOpen,
    onClose,
    filters,
    setCadenceFilter,
    setSort,
    resetFilters,
}: {
    isOpen: boolean;
    onClose: () => void;
    filters: ReturnType<typeof useTrashSchedule>['filters'];
    setCadenceFilter: (c: 'ALL' | 'WEEKLY' | 'BIWEEKLY') => void;
    setSort: (s: 'NEXT' | 'AZ') => void;
    resetFilters: () => void;
}) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[100]"
                    >
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                        </div>

                        <div className="px-5 pb-32">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal className="w-5 h-5 text-primary" />
                                    <h3 className="text-lg font-bold">Filtros Avançados</h3>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
                                    className="p-2 rounded-full bg-gray-100"
                                >
                                    <X className="w-5 h-5" />
                                </motion.button>
                            </div>

                            {/* Cadence Filter */}
                            <div className="mb-6">
                                <label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Frequência
                                </label>
                                <div className="flex gap-2">
                                    {(['ALL', 'WEEKLY', 'BIWEEKLY'] as const).map(c => (
                                        <motion.button
                                            key={c}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setCadenceFilter(c)}
                                            className={cn(
                                                "flex-1 py-3 px-3 rounded-xl text-sm font-medium transition-all",
                                                filters.cadenceFilter === c
                                                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                                                    : "bg-gray-100 text-gray-700"
                                            )}
                                        >
                                            {c === 'ALL' ? 'Todas' : CADENCE_LABELS[c]}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Sort */}
                            <div className="mb-8">
                                <label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Ordenar por
                                </label>
                                <div className="flex gap-2">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setSort('NEXT')}
                                        className={cn(
                                            "flex-1 py-3 px-3 rounded-xl text-sm font-medium transition-all",
                                            filters.sort === 'NEXT'
                                                ? "bg-primary text-white shadow-lg shadow-primary/30"
                                                : "bg-gray-100 text-gray-700"
                                        )}
                                    >
                                        Próxima coleta
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setSort('AZ')}
                                        className={cn(
                                            "flex-1 py-3 px-3 rounded-xl text-sm font-medium transition-all",
                                            filters.sort === 'AZ'
                                                ? "bg-primary text-white shadow-lg shadow-primary/30"
                                                : "bg-gray-100 text-gray-700"
                                        )}
                                    >
                                        A-Z
                                    </motion.button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={resetFilters}
                                    className="flex-1 py-4 rounded-2xl font-semibold bg-gray-100 text-gray-700"
                                >
                                    Limpar filtros
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onClose}
                                    className="flex-1 py-4 rounded-2xl font-semibold bg-gradient-to-r from-primary to-teal-500 text-white shadow-lg shadow-primary/30"
                                >
                                    Aplicar
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Neighborhood Select Dropdown
function NeighborhoodSelect({
    neighborhoods,
    value,
    onChange,
}: {
    neighborhoods: TrashNeighborhood[];
    value: string;
    onChange: (id: string) => void;
}) {
    return (
        <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-gray-100 rounded-xl text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
                <option value="">Todos os bairros</option>
                {neighborhoods.map(n => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
    );
}

// Main Screen Component
export default function TrashScheduleScreen() {
    const {
        neighborhoods,
        allNeighborhoods,
        filters,
        dynamicSubtitle,
        stats,
        selectedNeighborhood,
        setSelectedNeighborhood,
        setServiceType,
        setSelectedDay,
        setQuery,
        toggleOnlyFavorites,
        setCadenceFilter,
        setSort,
        resetFilters,
        toggleFavorite,
        isFavorite,
    } = useTrashSchedule();

    const [showInfo, setShowInfo] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [selectedBairroId, setSelectedBairroId] = useState('');

    // Handle bairro select
    const handleBairroSelect = (id: string) => {
        setSelectedBairroId(id);
        if (id) {
            const bairro = allNeighborhoods.find(n => n.id === id);
            if (bairro) {
                setQuery(bairro.name);
            }
        } else {
            setQuery('');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-28">
            {/* Header - Fixed with gradient */}
            <div className="sticky top-0 z-40 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white pt-safe-top">
                <div className="px-4 py-5">
                    {/* Title row */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <motion.div
                                initial={{ rotate: -10 }}
                                animate={{ rotate: [0, -5, 5, 0] }}
                                transition={{ repeat: Infinity, duration: 4, repeatDelay: 2 }}
                                className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm"
                            >
                                <Truck className="w-6 h-6" />
                            </motion.div>
                            <div>
                                <h1 className="text-xl font-bold">Coleta de Lixo</h1>
                                <p className="text-white/70 text-xs">Tijucas/SC</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => toggleOnlyFavorites()}
                                className={cn(
                                    "p-2.5 rounded-xl transition-all",
                                    filters.onlyFavorites
                                        ? "bg-yellow-400 shadow-lg shadow-yellow-500/30"
                                        : "bg-white/20 backdrop-blur-sm"
                                )}
                            >
                                <Star className={cn(
                                    "w-5 h-5",
                                    filters.onlyFavorites ? "text-yellow-800 fill-current" : "text-white"
                                )} />
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowInfo(true)}
                                className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl"
                            >
                                <Info className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </div>

                    {/* Dynamic subtitle */}
                    <p className="text-white/80 text-sm">{dynamicSubtitle}</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="sticky top-[100px] z-30 bg-white border-b border-gray-100 shadow-sm">
                <div className="px-4 py-4 space-y-3">
                    {/* Service Type Toggle */}
                    <div className="flex bg-gray-100 rounded-xl p-1">
                        {SERVICE_TYPES.map(({ key, label, icon: Icon }) => (
                            <motion.button
                                key={key}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setServiceType(key)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all",
                                    filters.serviceType === key
                                        ? "bg-white text-primary shadow-md"
                                        : "text-gray-600"
                                )}
                            >
                                {Icon && <Icon className="w-4 h-4" />}
                                {label}
                            </motion.button>
                        ))}
                    </div>

                    {/* Day Chips - Horizontal scroll */}
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
                        {DAYS.map(({ key, label }) => (
                            <motion.button
                                key={key}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedDay(key)}
                                className={cn(
                                    "flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all",
                                    filters.selectedDay === key
                                        ? "bg-primary text-white shadow-md shadow-primary/30"
                                        : "bg-gray-100 text-gray-700"
                                )}
                            >
                                {label}
                            </motion.button>
                        ))}
                    </div>

                    {/* Neighborhood Select + Advanced */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <NeighborhoodSelect
                                neighborhoods={allNeighborhoods}
                                value={selectedBairroId}
                                onChange={handleBairroSelect}
                            />
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowAdvancedFilters(true)}
                            className="p-3 bg-gray-100 rounded-xl"
                        >
                            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Results count */}
            <div className="px-4 py-3 flex items-center justify-between text-sm">
                <span className="text-gray-500">
                    {stats.filtered} de {stats.total} bairros
                </span>
                {stats.collectingToday > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1.5 text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full"
                    >
                        <Truck className="w-4 h-4" />
                        {stats.collectingToday} com coleta hoje
                    </motion.span>
                )}
            </div>

            {/* Neighborhood List */}
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="px-4 space-y-3"
            >
                <AnimatePresence mode="popLayout">
                    {neighborhoods.length > 0 ? (
                        neighborhoods.map((n) => (
                            <NeighborhoodCard
                                key={n.id}
                                neighborhood={n}
                                isFavorite={isFavorite(n.id)}
                                onFavorite={() => toggleFavorite(n.id)}
                                onSelect={() => setSelectedNeighborhood(n)}
                                serviceType={filters.serviceType}
                            />
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-12"
                        >
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MapPin className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">Nenhum bairro encontrado</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Tente mudar os filtros ou selecionar outro bairro
                            </p>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={resetFilters}
                                className="text-primary font-semibold px-4 py-2 bg-primary/10 rounded-xl"
                            >
                                Limpar filtros
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Bottom Sheets & Modals */}
            <NeighborhoodDetailsSheet
                neighborhood={selectedNeighborhood}
                isOpen={!!selectedNeighborhood}
                onClose={() => setSelectedNeighborhood(null)}
                isFavorite={selectedNeighborhood ? isFavorite(selectedNeighborhood.id) : false}
                onFavorite={() => selectedNeighborhood && toggleFavorite(selectedNeighborhood.id)}
            />

            <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />

            <AdvancedFiltersSheet
                isOpen={showAdvancedFilters}
                onClose={() => setShowAdvancedFilters(false)}
                filters={filters}
                setCadenceFilter={setCadenceFilter}
                setSort={setSort}
                resetFilters={resetFilters}
            />
        </div>
    );
}
