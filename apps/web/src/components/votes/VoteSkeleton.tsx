import { cn } from '@/lib/utils';

interface VoteSkeletonProps {
    className?: string;
}

export function VoteSkeleton({ className }: VoteSkeletonProps) {
    return (
        <div className={cn('animate-pulse space-y-6', className)}>
            {/* Header Skeleton */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-20 bg-muted rounded-full" />
                    <div className="h-4 w-24 bg-muted rounded" />
                </div>
                <div className="h-8 w-3/4 bg-muted rounded" />
                <div className="h-4 w-full bg-muted rounded" />
            </div>

            {/* Scoreboard Skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="h-12 w-8 bg-muted rounded" />
                        <div className="h-8 w-4 bg-muted rounded" />
                        <div className="h-12 w-8 bg-muted rounded" />
                    </div>
                    <div className="space-y-1">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-4 w-20 bg-muted rounded" />
                    </div>
                </div>
                <div className="w-28 h-28 bg-muted rounded-full" />
            </div>

            {/* Summary Cards Skeleton */}
            <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-3 rounded-xl border bg-muted/30 flex flex-col items-center gap-2">
                        <div className="w-8 h-8 bg-muted rounded-full" />
                        <div className="h-6 w-6 bg-muted rounded" />
                        <div className="h-3 w-12 bg-muted rounded" />
                    </div>
                ))}
            </div>

            {/* Filter Bar Skeleton */}
            <div className="space-y-3">
                <div className="h-11 bg-muted rounded-xl" />
                <div className="flex gap-2">
                    <div className="flex-1 h-10 bg-muted rounded-lg" />
                    <div className="w-12 h-10 bg-muted rounded-lg" />
                </div>
                <div className="h-10 bg-muted rounded-xl" />
            </div>

            {/* Cards Skeleton */}
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 rounded-xl border bg-card">
                        <div className="w-1 h-full bg-muted rounded absolute left-0" />
                        <div className="w-12 h-12 bg-muted rounded-full" />
                        <div className="flex-1 space-y-2">
                            <div className="h-5 w-3/4 bg-muted rounded" />
                            <div className="h-4 w-1/4 bg-muted rounded" />
                        </div>
                        <div className="w-11 h-11 bg-muted rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}
