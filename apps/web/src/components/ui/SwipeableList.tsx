import React from "react";
import { motion, PanInfo, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";

interface SwipeableItemProps {
    children: React.ReactNode;
    onSwipeRight?: () => void;
    onSwipeLeft?: () => void;
    rightActionColor?: string;
    leftActionColor?: string;
    rightIcon?: React.ReactNode;
    leftIcon?: React.ReactNode;
    className?: string;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({
    children,
    onSwipeRight,
    onSwipeLeft,
    rightActionColor = "bg-red-500",
    leftActionColor = "bg-blue-500",
    rightIcon,
    leftIcon,
    className,
}) => {
    const controls = useAnimation();

    const handleDragEnd = async (event: any, info: PanInfo) => {
        const threshold = 100;
        if (info.offset.x < -threshold && onSwipeRight) {
            await controls.start({ x: -500, opacity: 0, transition: { duration: 0.2 } });
            onSwipeRight();
        } else if (info.offset.x > threshold && onSwipeLeft) {
            // For left action (e.g. search), we might not want to disappear, just trigger
            // await controls.start({ x: 500, opacity: 0 }); 
            // or just bounce back
            onSwipeLeft();
            controls.start({ x: 0 });
        } else {
            controls.start({ x: 0 });
        }
    };

    return (
        <div className={cn("relative overflow-hidden rounded-xl", className)}>
            {/* Background Actions */}
            <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
                {/* Left Action Background */}
                <div className={cn("h-full w-full flex items-center pl-4 justify-start", leftActionColor)}>
                    {leftIcon}
                </div>
                {/* Right Action Background */}
            </div>
            <div className={cn("absolute inset-0 flex items-center justify-end pr-4 pointer-events-none", rightActionColor)}>
                {rightIcon}
            </div>

            {/* Foreground Content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDragEnd={handleDragEnd}
                animate={controls}
                className="relative bg-[#1e293b] z-10"
            >
                {children}
            </motion.div>
        </div>
    );
};
