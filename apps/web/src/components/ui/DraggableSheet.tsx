import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';

interface DraggableSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    snapPoints?: number[]; // Array of heights as percentages (e.g., [0.25, 0.5, 0.9])
    initialSnap?: number; // Index of initial snap point
    className?: string;
}

const CLOSE_THRESHOLD = 100; // Pixels to drag before closing

export function DraggableSheet({
    isOpen,
    onClose,
    children,
    title,
    snapPoints = [0.5, 0.9],
    initialSnap = 0,
    className = '',
}: DraggableSheetProps) {
    const [currentSnap, setCurrentSnap] = useState(initialSnap);
    const sheetRef = useRef<HTMLDivElement>(null);
    const startYRef = useRef(0);

    const currentHeight = `${snapPoints[currentSnap] * 100}vh`;

    const handleDragEnd = useCallback(
        (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            const { velocity, offset } = info;

            // Fast swipe down = close
            if (velocity.y > 500 || offset.y > CLOSE_THRESHOLD) {
                onClose();
                return;
            }

            // Fast swipe up = snap to highest point
            if (velocity.y < -500) {
                setCurrentSnap(snapPoints.length - 1);
                return;
            }

            // Otherwise snap to nearest point based on current position
            const windowHeight = window.innerHeight;
            const currentSheetHeight = sheetRef.current?.offsetHeight || 0;
            const newHeight = currentSheetHeight - offset.y;
            const newHeightPercent = newHeight / windowHeight;

            // Find closest snap point
            let closestSnap = 0;
            let minDistance = Math.abs(snapPoints[0] - newHeightPercent);

            snapPoints.forEach((point, index) => {
                const distance = Math.abs(point - newHeightPercent);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestSnap = index;
                }
            });

            setCurrentSnap(closestSnap);
        },
        [onClose, snapPoints]
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-40"
                    />

                    {/* Sheet */}
                    <motion.div
                        ref={sheetRef}
                        initial={{ y: '100%' }}
                        animate={{ y: 0, height: currentHeight }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.2}
                        onDragEnd={handleDragEnd}
                        className={`fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl z-50 overflow-hidden shadow-elevated ${className}`}
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                        </div>

                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
                                <h3 className="text-lg font-semibold">{title}</h3>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-muted transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {/* Content */}
                        <div className="overflow-y-auto h-full pb-safe">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default DraggableSheet;
