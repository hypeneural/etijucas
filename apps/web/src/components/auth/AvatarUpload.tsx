import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera,
    User,
    Edit3,
    Trash2,
    ImagePlus,
    Loader2,
    Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ImageCropModal } from './ImageCropModal';

interface AvatarUploadProps {
    currentUrl?: string;
    name?: string;
    onUpload: (file: File | null, previewUrl: string) => Promise<void>;
    onRemove?: () => void;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function AvatarUpload({
    currentUrl,
    name = 'U',
    onUpload,
    onRemove,
    disabled = false,
    size = 'lg',
}: AvatarUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showActions, setShowActions] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // Crop modal state
    const [showCropModal, setShowCropModal] = useState(false);
    const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);

    const displayUrl = previewUrl || currentUrl;
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const sizeClasses = {
        sm: 'w-16 h-16',
        md: 'w-24 h-24',
        lg: 'w-32 h-32',
    };

    const iconSizes = {
        sm: 'h-6 w-6',
        md: 'h-8 w-8',
        lg: 'h-10 w-10',
    };

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione uma imagem.');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 5MB.');
            return;
        }

        setShowActions(false);

        // Create preview and show crop modal
        const reader = new FileReader();
        reader.onload = (event) => {
            const url = event.target?.result as string;
            setRawImageUrl(url);
            setShowCropModal(true);
        };
        reader.readAsDataURL(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const handleCrop = useCallback((croppedImageUrl: string) => {
        setShowCropModal(false);
        setRawImageUrl(null);
        setIsUploading(true);

        // Set the preview
        setPreviewUrl(croppedImageUrl);

        // Convert data URL to Blob/File for upload
        fetch(croppedImageUrl)
            .then(res => res.blob())
            .then(async blob => {
                const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
                await onUpload(file, croppedImageUrl);

                // Show success animation
                setUploadSuccess(true);
                setTimeout(() => setUploadSuccess(false), 2000);
            })
            .catch(err => {
                console.error('Upload failed', err);
                // Revert preview on error? Layout decision.
            })
            .finally(() => {
                setIsUploading(false);
            });
    }, [onUpload]);

    const handleCropCancel = useCallback(() => {
        setShowCropModal(false);
        setRawImageUrl(null);
    }, []);

    const handleRemove = useCallback(() => {
        setPreviewUrl(null);
        setShowActions(false);
        onRemove?.();
    }, [onRemove]);

    const triggerFileInput = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return (
        <>
            <div className="flex flex-col items-center gap-4">
                {/* Avatar Container */}
                <div className="relative">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => !disabled && setShowActions(!showActions)}
                        className={cn(
                            sizeClasses[size],
                            'rounded-full overflow-hidden cursor-pointer',
                            'ring-4 ring-background shadow-xl',
                            'relative group'
                        )}
                    >
                        {/* Avatar Image or Initials */}
                        {displayUrl ? (
                            <motion.img
                                key={displayUrl}
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                src={displayUrl}
                                alt={name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className={cn(
                                'w-full h-full flex items-center justify-center',
                                'bg-gradient-to-br from-primary to-primary/70',
                                'text-white font-bold',
                                size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-lg'
                            )}>
                                {initials || <User className={iconSizes[size]} />}
                            </div>
                        )}

                        {/* Hover overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center"
                        >
                            {isUploading ? (
                                <Loader2 className="h-8 w-8 text-white animate-spin" />
                            ) : (
                                <Camera className="h-8 w-8 text-white" />
                            )}
                        </motion.div>

                        {/* Success checkmark */}
                        <AnimatePresence>
                            {uploadSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0 }}
                                    className="absolute inset-0 bg-green-500/80 flex items-center justify-center"
                                >
                                    <Check className="h-12 w-12 text-white" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Edit badge */}
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        className={cn(
                            'absolute -bottom-1 -right-1 p-2 rounded-full',
                            'bg-primary text-white shadow-lg cursor-pointer',
                            disabled && 'opacity-50 cursor-not-allowed'
                        )}
                        onClick={() => !disabled && triggerFileInput()}
                    >
                        <Edit3 className="h-4 w-4" />
                    </motion.div>
                </div>

                {/* Action buttons */}
                <AnimatePresence>
                    {showActions && !disabled && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="flex gap-2"
                        >
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={triggerFileInput}
                                className="rounded-full"
                            >
                                <ImagePlus className="h-4 w-4 mr-1" />
                                {displayUrl ? 'Trocar' : 'Adicionar'}
                            </Button>

                            {displayUrl && onRemove && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleRemove}
                                    className="rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Remover
                                </Button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Helper text */}
                <p className="text-xs text-muted-foreground text-center">
                    Toque para alterar sua foto
                </p>
            </div>

            {/* Crop Modal */}
            {showCropModal && rawImageUrl && (
                <ImageCropModal
                    image={rawImageUrl}
                    onCrop={handleCrop}
                    onCancel={handleCropCancel}
                />
            )}
        </>
    );
}

export default AvatarUpload;
