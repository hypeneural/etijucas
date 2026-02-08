import imageCompression from 'browser-image-compression';

export const REPORT_IMAGE_POLICY = {
    maxWidthOrHeight: 1920,
    targetSizeKB: 350,
    preferredQuality: 0.8,
    fallbackQuality: 0.78,
} as const;

const VALID_IMAGE_TYPES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
]);

interface CompressionAttemptConfig {
    fileType: 'image/webp' | 'image/jpeg' | 'image/png';
    quality: number;
    maxWidthOrHeight: number;
    targetSizeKB: number;
}

export interface CompressOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'image/webp' | 'image/jpeg' | 'image/png';
    targetSizeKB?: number;
}

export interface CompressResult {
    blob: Blob;
    dataUrl: string;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    width: number;
    height: number;
}

function getExtensionFromMime(mimeType: string): string {
    switch (mimeType) {
        case 'image/webp':
            return 'webp';
        case 'image/jpeg':
            return 'jpg';
        case 'image/png':
            return 'png';
        default:
            return 'jpg';
    }
}

function replaceExtension(fileName: string, nextExtension: string): string {
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    return `${baseName}.${nextExtension}`;
}

function toOutputFile(blobLike: Blob | File, originalName: string, mimeType: string): File {
    const extension = getExtensionFromMime(mimeType);
    const outputName = replaceExtension(originalName, extension);

    return new File([blobLike], outputName, {
        type: mimeType,
        lastModified: Date.now(),
    });
}

async function fileToDataUrl(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) ?? '');
        reader.onerror = () => reject(new Error('Failed to convert file to data URL'));
        reader.readAsDataURL(file);
    });
}

export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function isValidImage(file: File): boolean {
    return VALID_IMAGE_TYPES.has(file.type.toLowerCase()) || file.type.startsWith('image/');
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            resolve({ width: img.width, height: img.height });
            URL.revokeObjectURL(objectUrl);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image for dimensions'));
        };

        img.src = objectUrl;
    });
}

async function runCompressionAttempt(file: File, config: CompressionAttemptConfig): Promise<File> {
    const compressed = await imageCompression(file, {
        maxSizeMB: config.targetSizeKB / 1024,
        maxWidthOrHeight: config.maxWidthOrHeight,
        useWebWorker: true,
        initialQuality: config.quality,
        fileType: config.fileType,
        preserveExif: false,
    });

    return toOutputFile(compressed, file.name, config.fileType);
}

async function compressWithWebpFallback(
    file: File,
    config: Omit<CompressionAttemptConfig, 'fileType'>
): Promise<File> {
    try {
        return await runCompressionAttempt(file, {
            ...config,
            fileType: 'image/webp',
        });
    } catch (webpError) {
        console.warn('[imageCompression] WebP compression failed, falling back to JPEG', webpError);
        return runCompressionAttempt(file, {
            ...config,
            fileType: 'image/jpeg',
            quality: REPORT_IMAGE_POLICY.fallbackQuality,
        });
    }
}

/**
 * Compression policy for report uploads:
 * - resize to 1920px max
 * - target around 350KB
 * - prefer WebP with JPEG fallback
 * - strip EXIF metadata
 */
export async function compressForReportUpload(file: File): Promise<File> {
    if (!isValidImage(file)) {
        throw new Error('Invalid image file');
    }

    return compressWithWebpFallback(file, {
        maxWidthOrHeight: REPORT_IMAGE_POLICY.maxWidthOrHeight,
        targetSizeKB: REPORT_IMAGE_POLICY.targetSizeKB,
        quality: REPORT_IMAGE_POLICY.preferredQuality,
    });
}

export async function compressImagesForReportUpload(files: File[]): Promise<File[]> {
    const compressed: File[] = [];

    for (const file of files) {
        compressed.push(await compressForReportUpload(file));
    }

    return compressed;
}

export async function compressImage(
    file: File,
    options: CompressOptions = {}
): Promise<CompressResult> {
    if (!isValidImage(file)) {
        throw new Error('Invalid image file');
    }

    const maxWidthOrHeight = Math.max(
        options.maxWidth ?? REPORT_IMAGE_POLICY.maxWidthOrHeight,
        options.maxHeight ?? REPORT_IMAGE_POLICY.maxWidthOrHeight
    );
    const targetSizeKB = options.targetSizeKB ?? REPORT_IMAGE_POLICY.targetSizeKB;
    const format = options.format ?? 'image/webp';
    const quality = options.quality ?? REPORT_IMAGE_POLICY.preferredQuality;

    let compressedFile: File;
    if (format === 'image/webp') {
        compressedFile = await compressWithWebpFallback(file, {
            maxWidthOrHeight,
            targetSizeKB,
            quality,
        });
    } else {
        compressedFile = await runCompressionAttempt(file, {
            fileType: format,
            maxWidthOrHeight,
            targetSizeKB,
            quality,
        });
    }

    const dataUrl = await fileToDataUrl(compressedFile);
    const dimensions = await getImageDimensions(compressedFile).catch(() => ({ width: 0, height: 0 }));

    return {
        blob: compressedFile,
        dataUrl,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio: file.size > 0 ? compressedFile.size / file.size : 1,
        width: dimensions.width,
        height: dimensions.height,
    };
}

export async function compressForStorage(
    file: File,
    maxSizeKB: number = REPORT_IMAGE_POLICY.targetSizeKB
): Promise<string> {
    const result = await compressImage(file, {
        maxWidth: REPORT_IMAGE_POLICY.maxWidthOrHeight,
        maxHeight: REPORT_IMAGE_POLICY.maxWidthOrHeight,
        targetSizeKB: maxSizeKB,
        format: 'image/webp',
        quality: REPORT_IMAGE_POLICY.preferredQuality,
    });

    return result.dataUrl;
}

