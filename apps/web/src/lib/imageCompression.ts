/**
 * Image compression utility for mobile uploads
 * Compresses images before upload to reduce bandwidth and storage
 */

/**
 * Format bytes to human readable string (e.g., "1.2 MB")
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

interface CompressOptions {
    /** Maximum width in pixels (default: 1200) */
    maxWidth?: number;
    /** Maximum height in pixels (default: 1200) */
    maxHeight?: number;
    /** Quality from 0 to 1 (default: 0.8) */
    quality?: number;
    /** Output format (default: 'image/webp', fallback to 'image/jpeg') */
    format?: 'image/webp' | 'image/jpeg' | 'image/png';
}

interface CompressResult {
    /** Compressed image as Blob */
    blob: Blob;
    /** Data URL for preview */
    dataUrl: string;
    /** Original file size in bytes */
    originalSize: number;
    /** Compressed file size in bytes */
    compressedSize: number;
    /** Compression ratio (0-1) */
    compressionRatio: number;
    /** Final width */
    width: number;
    /** Final height */
    height: number;
}

/**
 * Compresses an image file for mobile upload
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise with compressed result
 */
export async function compressImage(
    file: File,
    options: CompressOptions = {}
): Promise<CompressResult> {
    const {
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 0.8,
        format = 'image/webp',
    } = options;

    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
        }

        img.onload = () => {
            // Calculate new dimensions maintaining aspect ratio
            let { width, height } = img;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }

            // Round to integers
            width = Math.round(width);
            height = Math.round(height);

            // Set canvas size
            canvas.width = width;
            canvas.height = height;

            // Draw image with smoothing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            // Try to use WebP, fallback to JPEG if not supported
            const outputFormat = canvas.toDataURL(format).startsWith('data:' + format)
                ? format
                : 'image/jpeg';

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Failed to compress image'));
                        return;
                    }

                    const dataUrl = canvas.toDataURL(outputFormat, quality);

                    resolve({
                        blob,
                        dataUrl,
                        originalSize: file.size,
                        compressedSize: blob.size,
                        compressionRatio: blob.size / file.size,
                        width,
                        height,
                    });
                },
                outputFormat,
                quality
            );
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        // Load image from file
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Compresses an image and returns a data URL suitable for storage
 * Limits output to approximately 1MB
 */
export async function compressForStorage(
    file: File,
    maxSizeKB: number = 500
): Promise<string> {
    let quality = 0.9;
    const maxWidth = 1200;
    const maxHeight = 1200;

    // First compression attempt
    let result = await compressImage(file, { maxWidth, maxHeight, quality });

    // Reduce quality iteratively if still too large
    while (result.compressedSize > maxSizeKB * 1024 && quality > 0.3) {
        quality -= 0.1;
        result = await compressImage(file, { maxWidth, maxHeight, quality });
    }

    // If still too large, reduce dimensions
    if (result.compressedSize > maxSizeKB * 1024) {
        result = await compressImage(file, {
            maxWidth: 800,
            maxHeight: 800,
            quality: 0.7,
        });
    }

    return result.dataUrl;
}

/**
 * Validates if a file is an acceptable image
 */
export function isValidImage(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    return validTypes.includes(file.type);
}

/**
 * Gets image dimensions from a file
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.width, height: img.height });
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}
