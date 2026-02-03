// ======================================================
// SkeletonList - Loading skeletons for phone contacts
// ======================================================

import { motion } from 'framer-motion';

interface SkeletonListProps {
    count?: number;
}

export function SkeletonList({ count = 5 }: SkeletonListProps) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card rounded-2xl p-4 border border-border/50"
                >
                    <div className="flex items-start gap-3">
                        {/* Icon skeleton */}
                        <div className="w-12 h-12 rounded-xl bg-muted animate-pulse" />

                        {/* Content skeleton */}
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                            <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                            <div className="flex gap-1.5 mt-2">
                                <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
                                <div className="h-5 w-12 bg-muted rounded-full animate-pulse" />
                            </div>
                        </div>

                        {/* Action skeleton */}
                        <div className="flex gap-2">
                            <div className="w-11 h-11 rounded-xl bg-muted animate-pulse" />
                            <div className="w-11 h-11 rounded-xl bg-muted animate-pulse" />
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
