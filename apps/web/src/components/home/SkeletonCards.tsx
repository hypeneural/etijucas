/**
 * SkeletonCard - Shimmer loading skeleton for Bento cards
 * Creates an elegant loading experience while data loads
 */

import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonCardProps {
    variant?: 'default' | 'large' | 'stats';
}

export function SkeletonCard({ variant = 'default' }: SkeletonCardProps) {
    return (
        <div className="bento-card animate-pulse">
            <div className="flex flex-col gap-2">
                {/* Icon placeholder */}
                <div className="w-10 h-10 rounded-xl skeleton-shimmer" />

                {variant === 'stats' ? (
                    <>
                        <div className="h-8 w-16 skeleton-shimmer rounded" />
                        <div className="h-4 w-24 skeleton-shimmer rounded" />
                    </>
                ) : (
                    <>
                        <div className="h-5 w-3/4 skeleton-shimmer rounded" />
                        <div className="h-4 w-full skeleton-shimmer rounded" />
                    </>
                )}
            </div>
        </div>
    );
}

export function SkeletonBentoGrid() {
    return (
        <div className="px-4 py-2">
            <div className="h-6 w-32 skeleton-shimmer rounded mb-3" />
            <div className="grid grid-cols-2 gap-3">
                <SkeletonCard variant="stats" />
                <SkeletonCard variant="stats" />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        </div>
    );
}

export function SkeletonForumCard() {
    return (
        <div className="p-4 bg-card rounded-2xl animate-pulse">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full skeleton-shimmer" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 skeleton-shimmer rounded" />
                    <div className="h-5 w-full skeleton-shimmer rounded" />
                    <div className="h-4 w-3/4 skeleton-shimmer rounded" />
                </div>
            </div>
            <div className="flex gap-4 mt-4">
                <div className="h-8 w-16 skeleton-shimmer rounded-full" />
                <div className="h-8 w-16 skeleton-shimmer rounded-full" />
            </div>
        </div>
    );
}

export function SkeletonEventCard() {
    return (
        <div className="flex-shrink-0 w-64 h-36 rounded-2xl skeleton-shimmer p-4">
            <div className="h-3 w-20 bg-white/20 rounded mb-2" />
            <div className="h-5 w-40 bg-white/20 rounded mb-1" />
            <div className="h-4 w-32 bg-white/20 rounded" />
        </div>
    );
}

export default SkeletonCard;
