// ======================================================
// TopicSkeleton - Loading placeholder for topic cards
// ======================================================

import { motion } from 'framer-motion';

export function TopicSkeleton() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card rounded-2xl p-4 shadow-sm border border-border/50"
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                    <div className="h-5 w-20 bg-muted rounded-full animate-pulse" />
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-4 w-12 bg-muted rounded animate-pulse" />
            </div>

            {/* Title */}
            <div className="h-5 w-3/4 bg-muted rounded animate-pulse mb-2" />

            {/* Description */}
            <div className="space-y-2 mb-4">
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
            </div>

            {/* Author */}
            <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-muted animate-pulse" />
                <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6 pt-3 border-t border-border/50">
                <div className="h-5 w-14 bg-muted rounded animate-pulse" />
                <div className="h-5 w-14 bg-muted rounded animate-pulse" />
                <div className="h-5 w-8 bg-muted rounded animate-pulse" />
            </div>
        </motion.div>
    );
}

export function TopicSkeletonList({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <TopicSkeleton key={i} />
            ))}
        </div>
    );
}

export default TopicSkeleton;
