// ======================================================
// ForumSortSegmented - iOS-style segmented control
// ======================================================

import { motion } from 'framer-motion';
import { TrendingUp, Clock, MapPin } from 'lucide-react';

export type SortOption = 'curtidos' | 'recentes' | 'perto';

const sortOptions = [
    { id: 'curtidos' as SortOption, label: 'Mais curtidos', icon: TrendingUp },
    { id: 'recentes' as SortOption, label: 'Recentes', icon: Clock },
    { id: 'perto' as SortOption, label: 'Perto de mim', icon: MapPin },
];

interface ForumSortSegmentedProps {
    value: SortOption;
    onChange: (value: SortOption) => void;
}

export function ForumSortSegmented({ value, onChange }: ForumSortSegmentedProps) {
    return (
        <div className="px-4 pb-3">
            <div className="relative flex bg-muted/60 rounded-xl p-1">
                {/* Sliding background indicator */}
                <motion.div
                    className="absolute inset-y-1 bg-background rounded-lg shadow-sm"
                    initial={false}
                    animate={{
                        x: `${sortOptions.findIndex(o => o.id === value) * 100}%`,
                        width: `${100 / sortOptions.length}%`,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    style={{ left: '4px', right: '4px' }}
                />

                {sortOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = value === option.id;

                    return (
                        <motion.button
                            key={option.id}
                            onClick={() => onChange(option.id)}
                            whileTap={{ scale: 0.97 }}
                            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-sm font-medium transition-colors z-10 min-h-[44px] ${isActive
                                    ? 'text-foreground'
                                    : 'text-muted-foreground'
                                }`}
                            aria-pressed={isActive}
                            aria-label={option.label}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
                            <span className="hidden xs:inline">{option.label}</span>
                            <span className="xs:hidden">
                                {option.label.split(' ')[0]}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

export default ForumSortSegmented;
