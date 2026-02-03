/**
 * VirtualList - High-performance virtualized list using @tanstack/react-virtual
 * 
 * Only renders visible items + overscan for smooth scrolling.
 * Reduces DOM nodes from hundreds to ~20-30 at a time.
 */

import React, { useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
    /** Array of items to render */
    items: T[];
    /** Estimated height of each item in pixels */
    estimatedItemSize?: number;
    /** Number of extra items to render above/below viewport */
    overscan?: number;
    /** Container height (required for fixed height, or use flex-1) */
    height?: number | string;
    /** Container className */
    className?: string;
    /** Gap between items */
    gap?: number;
    /** Render function for each item */
    renderItem: (item: T, index: number) => React.ReactNode;
    /** Key extractor */
    getItemKey?: (item: T, index: number) => string | number;
    /** Custom empty state */
    emptyState?: React.ReactNode;
    /** Loading state */
    isLoading?: boolean;
    /** Loading component */
    loadingComponent?: React.ReactNode;
    /** Scroll ref callback for scroll restoration */
    scrollRef?: (el: HTMLDivElement | null) => void;
}

export function VirtualList<T>({
    items,
    estimatedItemSize = 100,
    overscan = 5,
    height,
    className,
    gap = 0,
    renderItem,
    getItemKey,
    emptyState,
    isLoading,
    loadingComponent,
    scrollRef,
}: VirtualListProps<T>) {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => estimatedItemSize,
        overscan,
        gap,
    });

    const virtualItems = virtualizer.getVirtualItems();

    // Combine refs
    const setRefs = useCallback((el: HTMLDivElement | null) => {
        (parentRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        if (scrollRef) {
            scrollRef(el);
        }
    }, [scrollRef]);

    if (isLoading) {
        return (
            <div className={cn('flex items-center justify-center', className)} style={{ height }}>
                {loadingComponent || (
                    <div className="animate-pulse text-muted-foreground">Carregando...</div>
                )}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className={cn('flex items-center justify-center', className)} style={{ height }}>
                {emptyState || (
                    <div className="text-muted-foreground">Nenhum item encontrado</div>
                )}
            </div>
        );
    }

    return (
        <div
            ref={setRefs}
            className={cn('overflow-auto', className)}
            style={{ height }}
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualItems.map((virtualItem) => {
                    const item = items[virtualItem.index];
                    const key = getItemKey
                        ? getItemKey(item, virtualItem.index)
                        : virtualItem.index;

                    return (
                        <div
                            key={key}
                            data-index={virtualItem.index}
                            ref={virtualizer.measureElement}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                        >
                            {renderItem(item, virtualItem.index)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Hook for manual virtualizer control
 */
export function useVirtualList<T>(
    items: T[],
    options?: {
        estimatedItemSize?: number;
        overscan?: number;
        gap?: number;
    }
) {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => options?.estimatedItemSize ?? 100,
        overscan: options?.overscan ?? 5,
        gap: options?.gap ?? 0,
    });

    return {
        parentRef,
        virtualizer,
        virtualItems: virtualizer.getVirtualItems(),
        totalSize: virtualizer.getTotalSize(),
    };
}

export default VirtualList;
