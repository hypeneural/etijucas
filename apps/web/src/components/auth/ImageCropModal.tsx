import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Cropper, { Area, Point } from 'react-easy-crop';
import {
    X,
    ZoomIn,
    ZoomOut,
    RotateCw,
    Check,
    Crop,
    Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface ImageCropModalProps {
    image: string;
    onCrop: (croppedImage: string) => void;
    onCancel: () => void;
    aspectRatio?: number;
}

// Helper function to create cropped image
async function getCroppedImg(
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0
): Promise<string> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    // Set canvas size to safe area
    canvas.width = safeArea;
    canvas.height = safeArea;

    // Translate canvas context to center
    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    // Draw rotated image
    ctx.drawImage(
        image,
        safeArea / 2 - image.width / 2,
        safeArea / 2 - image.height / 2
    );

    // Get the rotated image data
    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    // Set canvas to final crop size
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Paste the rotated image with the correct offset
    ctx.putImageData(
        data,
        Math.round(0 - safeArea / 2 + image.width / 2 - pixelCrop.x),
        Math.round(0 - safeArea / 2 + image.height / 2 - pixelCrop.y)
    );

    // Return as data URL
    return canvas.toDataURL('image/jpeg', 0.9);
}

function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.crossOrigin = 'anonymous';
        image.src = url;
    });
}

export function ImageCropModal({
    image,
    onCrop,
    onCancel,
    aspectRatio = 1,
}: ImageCropModalProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropComplete = useCallback(
        (_croppedArea: Area, croppedAreaPixels: Area) => {
            setCroppedAreaPixels(croppedAreaPixels);
        },
        []
    );

    const handleCrop = useCallback(async () => {
        if (!croppedAreaPixels) return;

        setIsProcessing(true);
        try {
            const croppedImage = await getCroppedImg(
                image,
                croppedAreaPixels,
                rotation
            );
            onCrop(croppedImage);
        } catch (err) {
            console.error('Error cropping image:', err);
        } finally {
            setIsProcessing(false);
        }
    }, [croppedAreaPixels, image, rotation, onCrop]);

    const handleRotate = useCallback(() => {
        setRotation((prev) => (prev + 90) % 360);
    }, []);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black flex flex-col"
            >
                {/* Header */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center justify-between p-4 text-white safe-top"
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onCancel}
                        className="text-white hover:bg-white/10 rounded-full"
                    >
                        <X className="h-6 w-6" />
                    </Button>

                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <Crop className="h-5 w-5" />
                        Ajustar foto
                    </h2>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCrop}
                        disabled={isProcessing}
                        className="text-green-400 hover:bg-green-500/20 rounded-full"
                    >
                        <Check className="h-6 w-6" />
                    </Button>
                </motion.div>

                {/* Crop area */}
                <div className="relative flex-1 bg-black">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={aspectRatio}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        classes={{
                            containerClassName: 'bg-black',
                            cropAreaClassName: 'rounded-full',
                        }}
                        style={{
                            containerStyle: {
                                background: '#000',
                            },
                            cropAreaStyle: {
                                border: '3px solid rgba(255, 255, 255, 0.8)',
                                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
                            },
                        }}
                    />
                </div>

                {/* Controls */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="p-6 space-y-5 bg-gradient-to-t from-black via-black/95 to-transparent safe-bottom"
                >
                    {/* Zoom control */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-white/70 text-sm">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                <span>Zoom</span>
                            </div>
                            <span className="font-mono">{Math.round(zoom * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
                                className="text-white hover:bg-white/10 rounded-full h-10 w-10"
                            >
                                <ZoomOut className="h-5 w-5" />
                            </Button>

                            <Slider
                                value={[zoom]}
                                min={1}
                                max={3}
                                step={0.05}
                                onValueChange={([v]) => setZoom(v)}
                                className="flex-1"
                            />

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                                className="text-white hover:bg-white/10 rounded-full h-10 w-10"
                            >
                                <ZoomIn className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleRotate}
                            className="flex-1 h-12 border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-xl"
                        >
                            <RotateCw className="h-5 w-5 mr-2" />
                            Girar 90°
                        </Button>

                        <Button
                            onClick={handleCrop}
                            disabled={isProcessing}
                            className="flex-1 h-12 bg-primary hover:bg-primary/90 rounded-xl font-semibold"
                        >
                            {isProcessing ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                >
                                    <ImageIcon className="h-5 w-5" />
                                </motion.div>
                            ) : (
                                <>
                                    <Check className="h-5 w-5 mr-2" />
                                    Aplicar
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default ImageCropModal;
