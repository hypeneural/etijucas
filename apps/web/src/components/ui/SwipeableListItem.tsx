import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Trash2, Archive, MoreHorizontal } from 'lucide-react';
import { hapticFeedback } from '@/hooks/useHaptics';

interface SwipeAction {
    icon: React.ReactNode;
    label: string;
    color: string;
    bgColor: string;
    onAction: () => void;
}

interface SwipeableListItemProps {
    children: React.ReactNode;
    onDelete?: () => void;
    onArchive?: () => void;
    leftActions?: SwipeAction[];
    rightActions?: SwipeAction[];
    threshold?: number;
    className?: string;
}

const ACTION_THRESHOLD = 80;
const MAX_SWIPE = 150;

export function SwipeableListItem({
    children,
    onDelete,
    onArchive,
    leftActions,
    rightActions,
    threshold = ACTION_THRESHOLD,
    className = '',
}: SwipeableListItemProps) {
    const x = useMotionValue(0);
    const constraintRef = useRef<HTMLDivElement>(null);
    const hasTriggeredRef = useRef(false);

    // Default right actions (swipe left to reveal)
    const defaultRightActions: SwipeAction[] = [
        ...(onArchive ? [{
            icon: <Archive className="w-5 h-5" />,
            label: 'Arquivar',
            color: 'text-white',
            bgColor: 'bg-amber-500',
            onAction: onArchive,
        }] : []),
        ...(onDelete ? [{
            icon: <Trash2 className="w-5 h-5" />,
            label: 'Excluir',
            color: 'text-white',
            bgColor: 'bg-red-500',
            onAction: onDelete,
        }] : []),
    ];

    const actions = rightActions || defaultRightActions;

    // Transform x position to action visibility
    const actionOpacity = useTransform(x, [-threshold, -threshold / 2, 0], [1, 0.5, 0]);
    const actionScale = useTransform(x, [-threshold, -threshold / 2, 0], [1, 0.8, 0.5]);
    const actionX = useTransform(x, [-MAX_SWIPE, 0], [0, threshold]);

    // Background color intensity based on swipe distance
    const bgOpacity = useTransform(x, [-MAX_SWIPE, -threshold, 0], [1, 0.8, 0]);

    const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // Haptic feedback when crossing threshold
        if (Math.abs(info.offset.x) >= threshold && !hasTriggeredRef.current) {
            hapticFeedback('medium');
            hasTriggeredRef.current = true;
        } else if (Math.abs(info.offset.x) < threshold) {
            hasTriggeredRef.current = false;
        }
    };

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        hasTriggeredRef.current = false;

        // If swiped past threshold, trigger first action
        if (info.offset.x <= -threshold && actions.length > 0) {
            hapticFeedback('success');
            actions[actions.length - 1].onAction();
        }
    };

    if (actions.length === 0) {
        return <div className={className}>{children}</div>;
    }

    return (
        <div ref={constraintRef} className={`relative overflow-hidden ${className}`}>
            {/* Action buttons background */}
            <motion.div
                style={{ opacity: bgOpacity }}
                className="absolute inset-y-0 right-0 flex items-center justify-end"
            >
                {actions.map((action, index) => (
                    <motion.button
                        key={index}
                        style={{ opacity: actionOpacity, scale: actionScale, x: actionX }}
                        onClick={action.onAction}
                        className={`flex flex-col items-center justify-center w-20 h-full ${action.bgColor} ${action.color}`}
                    >
                        {action.icon}
                        <span className="text-xs mt-1 font-medium">{action.label}</span>
                    </motion.button>
                ))}
            </motion.div>

            {/* Swipeable content */}
            <motion.div
                style={{ x }}
                drag="x"
                dragConstraints={{ left: -MAX_SWIPE, right: 0 }}
                dragElastic={0.1}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                className="relative z-10 bg-background"
            >
                {children}
            </motion.div>
        </div>
    );
}

export default SwipeableListItem;
