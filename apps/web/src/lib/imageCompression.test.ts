import { describe, expect, it, beforeEach, vi } from 'vitest';
import imageCompression from 'browser-image-compression';
import { compressForReportUpload, REPORT_IMAGE_POLICY } from './imageCompression';

vi.mock('browser-image-compression', () => ({
    default: vi.fn(),
}));

const mockedImageCompression = vi.mocked(imageCompression);

function createImageFile(name = 'street.jpg', type = 'image/jpeg', size = 1024): File {
    return new File([new Uint8Array(size)], name, { type });
}

describe('imageCompression report upload policy', () => {
    beforeEach(() => {
        mockedImageCompression.mockReset();
    });

    it('compresses to WebP with policy defaults', async () => {
        mockedImageCompression.mockResolvedValueOnce(
            new Blob([new Uint8Array(512)], { type: 'image/webp' })
        );

        const sourceFile = createImageFile('via-publica.jpg', 'image/jpeg', 2048);
        const compressed = await compressForReportUpload(sourceFile);

        expect(compressed.type).toBe('image/webp');
        expect(compressed.name).toBe('via-publica.webp');
        expect(mockedImageCompression).toHaveBeenCalledTimes(1);
        expect(mockedImageCompression).toHaveBeenCalledWith(
            sourceFile,
            expect.objectContaining({
                maxWidthOrHeight: REPORT_IMAGE_POLICY.maxWidthOrHeight,
                maxSizeMB: REPORT_IMAGE_POLICY.targetSizeKB / 1024,
                fileType: 'image/webp',
                initialQuality: REPORT_IMAGE_POLICY.preferredQuality,
                preserveExif: false,
            })
        );
    });

    it('falls back to JPEG when WebP compression fails', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        mockedImageCompression
            .mockRejectedValueOnce(new Error('webp not supported'))
            .mockResolvedValueOnce(new Blob([new Uint8Array(400)], { type: 'image/jpeg' }));

        const sourceFile = createImageFile('camera.heic', 'image/heic', 4096);
        const compressed = await compressForReportUpload(sourceFile);

        expect(compressed.type).toBe('image/jpeg');
        expect(compressed.name).toBe('camera.jpg');
        expect(mockedImageCompression).toHaveBeenCalledTimes(2);
        expect(mockedImageCompression).toHaveBeenNthCalledWith(
            2,
            sourceFile,
            expect.objectContaining({
                fileType: 'image/jpeg',
                initialQuality: REPORT_IMAGE_POLICY.fallbackQuality,
            })
        );

        warnSpy.mockRestore();
    });
});
