/**
 * ReportsFilterSheet - Advanced filter sheet for reports
 * 
 * Mobile-first draggable sheet with filters for:
 * - Status (situação)
 * - Category (categoria)
 * - Period (período)
 * - Protocol search
 * - Address search
 * - Title search
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Filter,
    X,
    Search,
    Calendar,
    Tag,
    MapPin,
    FileText,
    Hash,
    ChevronDown,
    RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useReportCategories } from '@/hooks/useReportCategories';
import { CategoryIcon } from './CategoryIcon';
import type { ReportStatus } from '@/types/report';

export interface ReportFilters {
    status?: ReportStatus | 'all';
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    protocol?: string;
    address?: string;
    title?: string;
}

interface ReportsFilterSheetProps {
    isOpen: boolean;
    onClose: () => void;
    filters: ReportFilters;
    onApplyFilters: (filters: ReportFilters) => void;
    showMyReportsOnly?: boolean;
}

const statusOptions: { value: ReportStatus | 'all'; label: string; color: string }[] = [
    { value: 'all', label: 'Todos', color: 'bg-gray-100 text-gray-700' },
    { value: 'recebido', label: 'Recebido', color: 'bg-blue-100 text-blue-700' },
    { value: 'em_analise', label: 'Em Análise', color: 'bg-amber-100 text-amber-700' },
    { value: 'resolvido', label: 'Resolvido', color: 'bg-green-100 text-green-700' },
    { value: 'rejeitado', label: 'Rejeitado', color: 'bg-red-100 text-red-700' },
];

const periodOptions = [
    { value: 'all', label: 'Qualquer período' },
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 3 meses' },
    { value: '365d', label: 'Último ano' },
    { value: 'custom', label: 'Personalizado' },
];

export function ReportsFilterSheet({
    isOpen,
    onClose,
    filters,
    onApplyFilters,
    showMyReportsOnly = false,
}: ReportsFilterSheetProps) {
    const { categories } = useReportCategories();

    // Local state for filters
    const [localFilters, setLocalFilters] = useState<ReportFilters>(filters);
    const [selectedPeriod, setSelectedPeriod] = useState('all');
    const [showCategories, setShowCategories] = useState(false);

    // Sync with external filters
    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const handleStatusChange = (status: ReportStatus | 'all') => {
        setLocalFilters(prev => ({ ...prev, status }));
    };

    const handleCategoryChange = (categoryId: string | undefined) => {
        setLocalFilters(prev => ({ ...prev, categoryId }));
        setShowCategories(false);
    };

    const handlePeriodChange = (period: string) => {
        setSelectedPeriod(period);

        const now = new Date();
        let startDate: string | undefined;

        switch (period) {
            case '7d':
                startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
                break;
            case '30d':
                startDate = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
                break;
            case '90d':
                startDate = new Date(now.setDate(now.getDate() - 90)).toISOString().split('T')[0];
                break;
            case '365d':
                startDate = new Date(now.setDate(now.getDate() - 365)).toISOString().split('T')[0];
                break;
            default:
                startDate = undefined;
        }

        setLocalFilters(prev => ({
            ...prev,
            startDate,
            endDate: period === 'all' ? undefined : new Date().toISOString().split('T')[0]
        }));
    };

    const handleApply = () => {
        onApplyFilters(localFilters);
        onClose();
    };

    const handleReset = () => {
        const resetFilters: ReportFilters = {
            status: 'all',
            categoryId: undefined,
            startDate: undefined,
            endDate: undefined,
            protocol: undefined,
            address: undefined,
            title: undefined,
        };
        setLocalFilters(resetFilters);
        setSelectedPeriod('all');
    };

    const activeFiltersCount = Object.entries(localFilters).filter(
        ([key, value]) => value && value !== 'all' && key !== 'status'
    ).length + (localFilters.status && localFilters.status !== 'all' ? 1 : 0);

    const selectedCategory = categories.find(c => c.id === localFilters.categoryId);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50"
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[85vh] overflow-hidden"
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-4 pb-4 border-b">
                            <div className="flex items-center gap-2">
                                <Filter className="h-5 w-5 text-primary" />
                                <h2 className="text-lg font-semibold">Filtros Avançados</h2>
                                {activeFiltersCount > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                        {activeFiltersCount}
                                    </Badge>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="rounded-full"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto max-h-[calc(85vh-180px)] px-4 py-4 space-y-6">
                            {/* Status Filter */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <Tag className="h-4 w-4 text-muted-foreground" />
                                    Situação
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {statusOptions.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleStatusChange(option.value)}
                                            className={cn(
                                                'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                                                localFilters.status === option.value
                                                    ? option.color + ' ring-2 ring-offset-2 ring-primary'
                                                    : 'bg-muted hover:bg-muted/80'
                                            )}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <Tag className="h-4 w-4 text-muted-foreground" />
                                    Categoria
                                </label>
                                <button
                                    onClick={() => setShowCategories(!showCategories)}
                                    className={cn(
                                        'w-full flex items-center justify-between p-3 rounded-xl border transition-all',
                                        showCategories ? 'border-primary bg-primary/5' : 'border-border'
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        {selectedCategory ? (
                                            <>
                                                <CategoryIcon
                                                    icon={selectedCategory.icon}
                                                    color={selectedCategory.color}
                                                    size="sm"
                                                />
                                                <span className="font-medium">{selectedCategory.name}</span>
                                            </>
                                        ) : (
                                            <span className="text-muted-foreground">Todas as categorias</span>
                                        )}
                                    </div>
                                    <ChevronDown className={cn(
                                        'h-5 w-5 text-muted-foreground transition-transform',
                                        showCategories && 'rotate-180'
                                    )} />
                                </button>

                                <AnimatePresence>
                                    {showCategories && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="grid grid-cols-2 gap-2 pt-2">
                                                <button
                                                    onClick={() => handleCategoryChange(undefined)}
                                                    className={cn(
                                                        'p-3 rounded-xl border text-left transition-all',
                                                        !localFilters.categoryId
                                                            ? 'border-primary bg-primary/5'
                                                            : 'border-border hover:border-primary/50'
                                                    )}
                                                >
                                                    <span className="text-sm font-medium">Todas</span>
                                                </button>
                                                {categories.map(cat => (
                                                    <button
                                                        key={cat.id}
                                                        onClick={() => handleCategoryChange(cat.id)}
                                                        className={cn(
                                                            'p-3 rounded-xl border text-left transition-all flex items-center gap-2',
                                                            localFilters.categoryId === cat.id
                                                                ? 'border-primary bg-primary/5'
                                                                : 'border-border hover:border-primary/50'
                                                        )}
                                                    >
                                                        <CategoryIcon
                                                            icon={cat.icon}
                                                            color={cat.color}
                                                            size="sm"
                                                        />
                                                        <span className="text-sm font-medium line-clamp-1">{cat.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Period Filter */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    Período
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {periodOptions.filter(o => o.value !== 'custom').map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => handlePeriodChange(option.value)}
                                            className={cn(
                                                'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                                                selectedPeriod === option.value
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted hover:bg-muted/80'
                                            )}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Text Searches */}
                            <div className="space-y-4">
                                {/* Protocol Search */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium">
                                        <Hash className="h-4 w-4 text-muted-foreground" />
                                        Protocolo
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar por protocolo..."
                                            value={localFilters.protocol || ''}
                                            onChange={(e) => setLocalFilters(prev => ({
                                                ...prev,
                                                protocol: e.target.value || undefined
                                            }))}
                                            className="pl-10 rounded-xl"
                                        />
                                    </div>
                                </div>

                                {/* Title Search */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        Título
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar por título..."
                                            value={localFilters.title || ''}
                                            onChange={(e) => setLocalFilters(prev => ({
                                                ...prev,
                                                title: e.target.value || undefined
                                            }))}
                                            className="pl-10 rounded-xl"
                                        />
                                    </div>
                                </div>

                                {/* Address Search */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        Endereço
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar por endereço..."
                                            value={localFilters.address || ''}
                                            onChange={(e) => setLocalFilters(prev => ({
                                                ...prev,
                                                address: e.target.value || undefined
                                            }))}
                                            className="pl-10 rounded-xl"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t p-4 flex gap-3 safe-bottom">
                            <Button
                                variant="outline"
                                size="lg"
                                className="flex-1 h-12 rounded-2xl"
                                onClick={handleReset}
                            >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Limpar
                            </Button>
                            <Button
                                size="lg"
                                className="flex-[2] h-12 rounded-2xl"
                                onClick={handleApply}
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                Aplicar Filtros
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default ReportsFilterSheet;
