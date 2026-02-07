// ======================================================
// UsefulPhonesScreen - Smart City Dialer
// ======================================================

import { useState, useMemo, useCallback } from 'react';
import { useTenantNavigate } from '@/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Search,
    X,
    ChevronDown,
    ChevronUp,
    SlidersHorizontal,
    AlertTriangle,
    Shield,
    Heart,
    Building2,
    GraduationCap,
    Wrench,
    Map,
    Phone
} from 'lucide-react';
import { PhoneCategory, PhoneContact } from '@/types';
import { phoneContacts, phoneCategoryLabels } from '@/data/phoneContacts';
import { ContactCard } from '@/components/phones/ContactCard';
import { CategoryChips } from '@/components/phones/CategoryChips';
import { EmptyState } from '@/components/phones/EmptyState';
import { SkeletonList } from '@/components/phones/SkeletonList';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { cleanPhoneNumber } from '@/lib/phoneFormat';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useState(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    });

    // Immediate update for this simple case
    if (debouncedValue !== value) {
        setDebouncedValue(value);
    }

    return debouncedValue;
}

export default function UsefulPhonesScreen() {
    const navigate = useTenantNavigate();
    const { favoritePhones = [], toggleFavoritePhone, setActiveTab } = useAppStore();

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<PhoneCategory | 'all' | 'favorites'>('all');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['emergencias', 'saude']));
    const [isLoading, setIsLoading] = useState(false);

    // Debounced search
    const debouncedSearch = useDebounce(searchQuery, 300);

    // Toggle category expansion
    const toggleCategory = useCallback((category: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    }, []);

    // Filter contacts
    const filteredContacts = useMemo(() => {
        let result = [...phoneContacts];

        // Category filter
        if (selectedCategory === 'favorites') {
            result = result.filter(c => favoritePhones.includes(c.id));
        } else if (selectedCategory !== 'all') {
            result = result.filter(c => c.category === selectedCategory);
        }

        // Search filter
        if (debouncedSearch.trim()) {
            const query = debouncedSearch.toLowerCase();
            const queryDigits = cleanPhoneNumber(debouncedSearch);

            result = result.filter(contact => {
                // Name match
                if (contact.name.toLowerCase().includes(query)) return true;

                // Phone match (digits only)
                if (queryDigits && contact.phone.includes(queryDigits)) return true;

                // Description match
                if (contact.description?.toLowerCase().includes(query)) return true;

                // Tags match (synonyms)
                if (contact.tags?.some(tag => tag.toLowerCase().includes(query))) return true;

                // Subcategory match
                if (contact.subcategory?.toLowerCase().includes(query)) return true;

                // Neighborhood match
                if (contact.neighborhood?.toLowerCase().includes(query)) return true;

                return false;
            });
        }

        // Sort by priority within category
        result.sort((a, b) => (a.priority || 99) - (b.priority || 99));

        return result;
    }, [debouncedSearch, selectedCategory, favoritePhones]);

    // Group contacts by category
    const groupedContacts = useMemo(() => {
        const groups: Record<string, PhoneContact[]> = {};

        filteredContacts.forEach(contact => {
            if (!groups[contact.category]) {
                groups[contact.category] = [];
            }
            groups[contact.category].push(contact);
        });

        // Sort categories by importance
        const categoryOrder: PhoneCategory[] = [
            'emergencias', 'saude', 'seguranca', 'prefeitura',
            'utilidades', 'educacao', 'turismo', 'outros'
        ];

        const sortedGroups: [string, PhoneContact[]][] = categoryOrder
            .filter(cat => groups[cat]?.length > 0)
            .map(cat => [cat, groups[cat]]);

        return sortedGroups;
    }, [filteredContacts]);

    // Clear search
    const handleClearSearch = () => {
        setSearchQuery('');
    };

    // Clear all filters
    const handleClearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
    };

    // Check if has active filters
    const hasActiveFilters = searchQuery.trim() || selectedCategory !== 'all';

    // Handle tab change for bottom navigation
    const handleTabChange = (tab: 'home' | 'reportar' | 'forum' | 'agenda' | 'mais') => {
        setActiveTab(tab);
        navigate('/');
    };

    // Category icons mapping
    const categoryIcons: Record<PhoneCategory, React.ElementType> = {
        emergencias: AlertTriangle,
        seguranca: Shield,
        saude: Heart,
        prefeitura: Building2,
        educacao: GraduationCap,
        utilidades: Wrench,
        turismo: Map,
        defesa_civil: AlertTriangle,
        servicos: Wrench,
        outros: Phone,
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border safe-top">
                <div className="px-4 py-3">
                    {/* Top row */}
                    <div className="flex items-center gap-3 mb-3">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 rounded-full hover:bg-muted"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </motion.button>
                        <div className="flex-1">
                            <h1 className="text-lg font-bold text-foreground">Telefones Úteis</h1>
                            <p className="text-xs text-muted-foreground">Ligue com 1 toque</p>
                        </div>
                    </div>

                    {/* Search bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Buscar SAMU, UPA, Prefeitura, 3263..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-10 h-12 rounded-xl bg-muted/50 border-0 text-base"
                        />
                        {searchQuery && (
                            <button
                                onClick={handleClearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
                            >
                                <X className="w-4 h-4 text-muted-foreground" />
                            </button>
                        )}
                    </div>

                    {/* Category chips */}
                    <div className="mt-3">
                        <CategoryChips
                            selectedCategory={selectedCategory}
                            onSelectCategory={setSelectedCategory}
                            favoritesCount={favoritePhones.length}
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 pb-24 pt-4">
                {/* Loading state */}
                {isLoading && <SkeletonList count={5} />}

                {/* Empty states */}
                {!isLoading && filteredContacts.length === 0 && (
                    <EmptyState
                        variant={selectedCategory === 'favorites' ? 'no-favorites' : 'no-results'}
                        searchQuery={searchQuery}
                        onClearFilters={hasActiveFilters ? handleClearFilters : undefined}
                    />
                )}

                {/* Results */}
                {!isLoading && filteredContacts.length > 0 && (
                    <AnimatePresence mode="popLayout">
                        {/* If searching, show flat list */}
                        {debouncedSearch.trim() ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-3"
                            >
                                <p className="text-sm text-muted-foreground mb-2">
                                    {filteredContacts.length} resultado{filteredContacts.length !== 1 ? 's' : ''}
                                </p>
                                {filteredContacts.map(contact => (
                                    <ContactCard
                                        key={contact.id}
                                        contact={contact}
                                        isFavorite={favoritePhones.includes(contact.id)}
                                        onToggleFavorite={toggleFavoritePhone}
                                    />
                                ))}
                            </motion.div>
                        ) : (
                            /* Grouped by category with accordion */
                            <div className="space-y-4">
                                {groupedContacts.map(([category, contacts]) => {
                                    const isExpanded = expandedCategories.has(category);
                                    const categoryInfo = phoneCategoryLabels[category] || { label: category, emoji: '📞' };

                                    return (
                                        <motion.div
                                            key={category}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            {/* Category header */}
                                            <button
                                                onClick={() => toggleCategory(category)}
                                                className="w-full flex items-center justify-between py-2 mb-2"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {(() => {
                                                        const IconComponent = categoryIcons[category as PhoneCategory] || Phone;
                                                        return <IconComponent className="w-5 h-5 text-primary" />;
                                                    })()}
                                                    <h2 className="font-semibold text-foreground">
                                                        {categoryInfo.label}
                                                    </h2>
                                                    <span className="text-sm text-muted-foreground">
                                                        ({contacts.length})
                                                    </span>
                                                </div>
                                                {isExpanded ? (
                                                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                                )}
                                            </button>

                                            {/* Category contacts */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="space-y-3 overflow-hidden"
                                                    >
                                                        {contacts.map(contact => (
                                                            <ContactCard
                                                                key={contact.id}
                                                                contact={contact}
                                                                isFavorite={favoritePhones.includes(contact.id)}
                                                                onToggleFavorite={toggleFavoritePhone}
                                                            />
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </AnimatePresence>
                )}
            </div>

            {/* Fixed Bottom Tab Bar */}
            <BottomTabBar activeTab="mais" onTabChange={handleTabChange} />
        </div>
    );
}
