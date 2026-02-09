// ======================================================
// ForumCategoryTabs - Category filter tabs for feed
// ======================================================

import { motion } from 'framer-motion';
import { FileText, Lightbulb, HelpCircle, LayoutGrid } from 'lucide-react';

export type CategoryTab = 'todos' | 'relatos' | 'ideias' | 'perguntas';

interface ForumCategoryTabsProps {
    activeTab: CategoryTab;
    onChange: (tab: CategoryTab) => void;
}

const tabs = [
    { id: 'todos' as CategoryTab, label: 'Todos', icon: LayoutGrid },
    { id: 'relatos' as CategoryTab, label: 'Relatos', icon: FileText },
    { id: 'ideias' as CategoryTab, label: 'Ideias', icon: Lightbulb },
    { id: 'perguntas' as CategoryTab, label: 'Perguntas', icon: HelpCircle },
];

export function ForumCategoryTabs({ activeTab, onChange }: ForumCategoryTabsProps) {
    return (
        <div className="px-4 py-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <motion.button
                            key={tab.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onChange(tab.id)}
                            className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all min-h-[40px] ${isActive
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            {isActive && (
                                <motion.div
                                    layoutId="activeCategoryTab"
                                    className="absolute inset-0 bg-primary rounded-full -z-10"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

export default ForumCategoryTabs;

// Helper to map CategoryTab to TopicCategory array
export function getCategoriesForTab(tab: CategoryTab): string[] | null {
    switch (tab) {
        case 'relatos':
            return ['reclamacao', 'reclamacoes', 'alerta', 'comercio'];
        case 'ideias':
            return ['sugestao', 'elogio'];
        case 'perguntas':
            return ['duvida', 'outros'];
        case 'todos':
        default:
            return null; // No filter
    }
}
