/**
 * useUploadImage - Hook for uploading images to the forum
 * 
 * Handles:
 * - Image compression before upload
 * - Progress tracking
 * - Error handling for 413 (too large) errors
 * - Returns URL to use in topic/comment creation
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { topicService } from '@/services';
import { toast } from 'sonner';

interface UploadResult {
    url: string;
    thumb?: string;
    medium?: string;
}

interface UseUploadImageOptions {
    onSuccess?: (result: UploadResult) => void;
    onError?: (error: Error) => void;
    maxSizeMB?: number;
}

export function useUploadImage(options: UseUploadImageOptions = {}) {
    const { maxSizeMB = 5 } = options;
    const [progress, setProgress] = useState(0);
    const [isCompressing, setIsCompressing] = useState(false);

    const uploadMutation = useMutation({
        mutationFn: async (file: File): Promise<UploadResult> => {
            setProgress(0);

            // Check file size
            const sizeMB = file.size / (1024 * 1024);
            if (sizeMB > maxSizeMB) {
                throw new Error(`Imagem muito grande (${sizeMB.toFixed(1)}MB). Máximo: ${maxSizeMB}MB`);
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                throw new Error('Arquivo deve ser uma imagem (JPEG, PNG ou WebP)');
            }

            // Compress if needed (images > 1MB)
            let fileToUpload = file;
            if (sizeMB > 1) {
                setIsCompressing(true);
                try {
                    fileToUpload = await compressImage(file);
                } finally {
                    setIsCompressing(false);
                }
            }

            setProgress(30);

            // Upload to API
            const result = await topicService.uploadImage(fileToUpload);

            setProgress(100);
            return result;
        },
        onSuccess: (result) => {
            toast.success('📷 Imagem enviada!');
            options.onSuccess?.(result);
        },
        onError: (error) => {
            const message = error instanceof Error ? error.message : 'Erro ao enviar imagem';

            if (message.includes('413') || message.includes('too large')) {
                toast.error('❌ Imagem muito grande. Máximo 5MB.');
            } else {
                toast.error(`❌ ${message}`);
            }

            options.onError?.(error instanceof Error ? error : new Error(message));
        },
    });

    return {
        upload: uploadMutation.mutate,
        uploadAsync: uploadMutation.mutateAsync,
        isUploading: uploadMutation.isPending,
        isCompressing,
        progress,
        error: uploadMutation.error,
        reset: () => {
            uploadMutation.reset();
            setProgress(0);
        },
    };
}

/**
 * Compress image using canvas with aggressive settings
 * Targets under 2MB output for reliable upload
 */
async function compressImage(file: File, targetMaxKB = 2000): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = async () => {
                // Determine compression settings based on file size
                const sizeMB = file.size / (1024 * 1024);
                let quality = sizeMB > 3 ? 0.6 : sizeMB > 2 ? 0.7 : 0.8;
                let maxWidth = sizeMB > 3 ? 1024 : 1280;

                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Scale down if too wide
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file);
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Try progressively lower quality if still too big
                const attemptCompress = (q: number): void => {
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                resolve(file);
                                return;
                            }

                            const sizeKB = blob.size / 1024;

                            // If still too big and quality > 0.3, try again
                            if (sizeKB > targetMaxKB && q > 0.3) {
                                attemptCompress(q - 0.1);
                                return;
                            }

                            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            console.log(
                                `[useUploadImage] Compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB (quality: ${q.toFixed(1)})`
                            );
                            resolve(compressedFile);
                        },
                        'image/jpeg',
                        q
                    );
                };

                attemptCompress(quality);
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default useUploadImage;
