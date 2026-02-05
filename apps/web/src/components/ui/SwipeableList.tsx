// Simplified version for debugging Error #310
import React from "react";
import { cn } from "@/lib/utils";

interface SwipeableItemProps {
    children: React.ReactNode;
    onSwipeRight?: () => void;
    onSwipeLeft?: () => void;
    rightActionColor?: string;
    leftActionColor?: string;
    rightIcon?: string;
    leftIcon?: string;
    className?: string;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({
    children,
    className,
}) => {
    return (
        <div className={cn("relative overflow-hidden rounded-xl bg-[#1e293b]", className)}>
            {children}
        </div>
    );
};

