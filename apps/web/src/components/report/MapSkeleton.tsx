import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface MapSkeletonProps {
    className?: string;
}

export function MapSkeleton({ className }: MapSkeletonProps) {
    return (
        <div
            className={cn(
                'absolute inset-0 z-20 flex flex-col justify-between bg-background/95 p-3',
                className
            )}
            aria-hidden
        >
            <div className="flex items-center justify-between">
                <Skeleton className="h-7 w-28 rounded-full" />
                <Skeleton className="h-7 w-7 rounded-md" />
            </div>

            <div className="space-y-2">
                <Skeleton className="h-3 w-36 rounded-full" />
                <Skeleton className="h-3 w-24 rounded-full" />
            </div>
        </div>
    );
}

export default MapSkeleton;
