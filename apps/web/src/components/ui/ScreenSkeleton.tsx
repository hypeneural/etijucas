import React from 'react';
import { motion } from 'framer-motion';

interface ScreenSkeletonProps {
    variant?: 'home' | 'list' | 'detail' | 'grid';
}

const shimmerClass = "animate-shimmer bg-muted rounded-lg";

export function ScreenSkeleton({ variant = 'home' }: ScreenSkeletonProps) {
    if (variant === 'home') {
        return (
            <div className="h-full overflow-hidden p-4 space-y-4">
                {/* Header skeleton */}
                <div className="space-y-2">
                    <div className={`h-8 w-32 ${shimmerClass}`} />
                    <div className={`h-12 w-full ${shimmerClass}`} />
                </div>

                {/* Bento grid skeleton */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className={`h-32 ${shimmerClass}`} />
                    <div className={`h-32 ${shimmerClass}`} />
                    <div className={`h-24 col-span-2 ${shimmerClass}`} />
                </div>

                {/* Cards skeleton */}
                <div className="space-y-3 mt-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className={`h-20 ${shimmerClass}`} />
                    ))}
                </div>
            </div>
        );
    }

    if (variant === 'list') {
        return (
            <div className="h-full overflow-hidden p-4 space-y-3">
                {/* Header */}
                <div className={`h-10 w-48 ${shimmerClass}`} />

                {/* List items */}
                {Array.from({ length: 6 }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`h-20 ${shimmerClass}`}
                    />
                ))}
            </div>
        );
    }

    if (variant === 'grid') {
        return (
            <div className="h-full overflow-hidden p-4">
                {/* Header */}
                <div className={`h-10 w-48 mb-4 ${shimmerClass}`} />

                {/* Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className={`h-40 ${shimmerClass}`}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // Detail variant
    return (
        <div className="h-full overflow-hidden p-4 space-y-4">
            {/* Image placeholder */}
            <div className={`h-48 ${shimmerClass}`} />

            {/* Title */}
            <div className={`h-8 w-3/4 ${shimmerClass}`} />

            {/* Meta */}
            <div className="flex gap-2">
                <div className={`h-6 w-20 ${shimmerClass}`} />
                <div className={`h-6 w-24 ${shimmerClass}`} />
            </div>

            {/* Content */}
            <div className="space-y-2">
                <div className={`h-4 w-full ${shimmerClass}`} />
                <div className={`h-4 w-full ${shimmerClass}`} />
                <div className={`h-4 w-2/3 ${shimmerClass}`} />
            </div>
        </div>
    );
}

export default ScreenSkeleton;
