// ======================================================
// ImageGallery - Image gallery with fullscreen viewer
// ======================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ImageGalleryProps {
    images: string[];
    alt?: string;
}

export function ImageGallery({ images, alt = '' }: ImageGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    if (images.length === 0) return null;

    const openFullscreen = (index: number) => {
        setSelectedIndex(index);
        setCurrentIndex(index);
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    };

    const closeFullscreen = () => {
        setSelectedIndex(null);
        document.body.style.overflow = '';
    };

    const goNext = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const goPrev = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <>
            {/* Thumbnails */}
            {images.length === 1 ? (
                // Single image - full width
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openFullscreen(0)}
                    className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted group"
                >
                    <img
                        src={images[0]}
                        alt={alt}
                        loading="lazy"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
                    </div>
                </motion.button>
            ) : (
                // Multiple images - horizontal scroll
                <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
                    {images.map((src, index) => (
                        <motion.button
                            key={index}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openFullscreen(index)}
                            className="relative flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden bg-muted group"
                        >
                            <img
                                src={src}
                                alt={`${alt} ${index + 1}`}
                                loading="lazy"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </motion.button>
                    ))}
                </div>
            )}

            {/* Fullscreen viewer */}
            {selectedIndex !== null && createPortal(
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black flex flex-col"
                        onClick={closeFullscreen}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 safe-top">
                            <span className="text-white/70 text-sm">
                                {currentIndex + 1} / {images.length}
                            </span>
                            <button
                                onClick={closeFullscreen}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                aria-label="Fechar"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        {/* Image */}
                        <div
                            className="flex-1 flex items-center justify-center px-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <motion.img
                                key={currentIndex}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                src={images[currentIndex]}
                                alt={`${alt} ${currentIndex + 1}`}
                                className="max-w-full max-h-full object-contain rounded-lg"
                                draggable={false}
                            />
                        </div>

                        {/* Navigation */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        goPrev();
                                    }}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    aria-label="Imagem anterior"
                                >
                                    <ChevronLeft className="w-6 h-6 text-white" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        goNext();
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    aria-label="Próxima imagem"
                                >
                                    <ChevronRight className="w-6 h-6 text-white" />
                                </button>
                            </>
                        )}

                        {/* Dots */}
                        {images.length > 1 && (
                            <div className="flex justify-center gap-2 py-4 safe-bottom">
                                {images.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentIndex(index);
                                        }}
                                        className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? 'bg-white' : 'bg-white/30'
                                            }`}
                                        aria-label={`Ir para imagem ${index + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}

export default ImageGallery;
