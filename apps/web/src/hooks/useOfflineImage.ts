import { useState, useCallback, useEffect } from 'react';

const DB_NAME = 'etijucas-offline-images';
const STORE_NAME = 'images';
const DB_VERSION = 1;

interface StoredImage {
    id: string;
    blob: Blob;
    mimeType: string;
    createdAt: number;
}

/**
 * Hook for storing and retrieving images offline using IndexedDB.
 * Useful for offline-first image uploads.
 * 
 * @example
 * const { saveImage, getImage, getObjectUrl, deleteImage } = useOfflineImage();
 * 
 * // Save an image
 * const id = await saveImage(file);
 * 
 * // Display it
 * const url = await getObjectUrl(id);
 * <img src={url} />
 */
export function useOfflineImage() {
    const [db, setDb] = useState<IDBDatabase | null>(null);
    const [isReady, setIsReady] = useState(false);

    // Initialize IndexedDB
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('[OfflineImage] Failed to open IndexedDB');
        };

        request.onsuccess = () => {
            setDb(request.result);
            setIsReady(true);
        };

        request.onupgradeneeded = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        return () => {
            db?.close();
        };
    }, []);

    const saveImage = useCallback(async (file: File | Blob, customId?: string): Promise<string> => {
        if (!db) throw new Error('IndexedDB not ready');

        const id = customId || `img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const mimeType = file.type || 'image/jpeg';

        const storedImage: StoredImage = {
            id,
            blob: file,
            mimeType,
            createdAt: Date.now(),
        };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(storedImage);

            request.onsuccess = () => resolve(id);
            request.onerror = () => reject(new Error('Failed to save image'));
        });
    }, [db]);

    const getImage = useCallback(async (id: string): Promise<StoredImage | null> => {
        if (!db) throw new Error('IndexedDB not ready');

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(new Error('Failed to get image'));
        });
    }, [db]);

    const getObjectUrl = useCallback(async (id: string): Promise<string | null> => {
        const image = await getImage(id);
        if (!image) return null;
        return URL.createObjectURL(image.blob);
    }, [getImage]);

    const deleteImage = useCallback(async (id: string): Promise<void> => {
        if (!db) throw new Error('IndexedDB not ready');

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to delete image'));
        });
    }, [db]);

    const getAllImages = useCallback(async (): Promise<StoredImage[]> => {
        if (!db) throw new Error('IndexedDB not ready');

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('Failed to get images'));
        });
    }, [db]);

    const clearAllImages = useCallback(async (): Promise<void> => {
        if (!db) throw new Error('IndexedDB not ready');

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to clear images'));
        });
    }, [db]);

    return {
        isReady,
        saveImage,
        getImage,
        getObjectUrl,
        deleteImage,
        getAllImages,
        clearAllImages,
    };
}

export default useOfflineImage;
