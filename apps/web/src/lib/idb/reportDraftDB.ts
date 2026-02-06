/**
 * IndexedDB Wrapper for Report Drafts
 * 
 * Features:
 * - Stores draft metadata and images as Blobs
 * - Automatic previewUrl recreation on load
 * - Handles multiple drafts
 * - Sync status tracking
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ReportDraft, CapturedImage, LocationData, ReportCategory } from '@/types/report';

// Database schema
interface ReportDraftDBSchema extends DBSchema {
    drafts: {
        key: string;
        value: {
            id: string;
            draft: StoredDraft;
            syncStatus: SyncStatus;
            createdAt: number;
            updatedAt: number;
        };
        indexes: { 'by-status': SyncStatus; 'by-updated': number };
    };
    images: {
        key: string;
        value: {
            id: string;
            draftId: string;
            blob: Blob;
            filename: string;
            capturedAt: number;
        };
        indexes: { 'by-draft': string };
    };
}

// Stored draft without File objects (for serialization)
interface StoredDraft {
    categoryId: string | null;
    category: ReportCategory | null;
    location: LocationData | null;
    locationNote: string | null;
    title: string;
    description: string;
    confirmed: boolean;
    currentStep: 1 | 2 | 3 | 4;
    createdAt: number;
    updatedAt: number;
    idempotencyKey: string;
}

export type SyncStatus = 'draft' | 'queued' | 'sending' | 'sent' | 'failed';

const DB_NAME = 'etijucas-reports';
const DB_VERSION = 2; // Bump version to force upgrade

let dbInstance: IDBPDatabase<ReportDraftDBSchema> | null = null;
let dbInitialized = false;

// Initialize database with error recovery
async function getDB(): Promise<IDBPDatabase<ReportDraftDBSchema>> {
    if (dbInstance && dbInitialized) return dbInstance;

    try {
        dbInstance = await openDB<ReportDraftDBSchema>(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion) {
                console.log(`[reportDraftDB] Upgrading from v${oldVersion} to v${newVersion}`);

                // Drafts store
                if (!db.objectStoreNames.contains('drafts')) {
                    const draftStore = db.createObjectStore('drafts', { keyPath: 'id' });
                    draftStore.createIndex('by-status', 'syncStatus');
                    draftStore.createIndex('by-updated', 'updatedAt');
                }

                // Images store (separate for blob storage efficiency)
                if (!db.objectStoreNames.contains('images')) {
                    const imageStore = db.createObjectStore('images', { keyPath: 'id' });
                    imageStore.createIndex('by-draft', 'draftId');
                }
            },
            blocked() {
                console.warn('[reportDraftDB] Database blocked - close other tabs');
            },
            blocking() {
                // Close the db to allow upgrade in other tab
                dbInstance?.close();
                dbInstance = null;
                dbInitialized = false;
            },
        });

        dbInitialized = true;
        return dbInstance;
    } catch (error) {
        console.error('[reportDraftDB] Failed to open database:', error);

        // If object store not found, delete and recreate the database
        if (error instanceof Error && error.name === 'NotFoundError') {
            console.warn('[reportDraftDB] Corrupted database, deleting and recreating...');
            try {
                // Close existing connection if any
                if (dbInstance) {
                    dbInstance.close();
                    dbInstance = null;
                }

                // Delete the database
                await new Promise<void>((resolve, reject) => {
                    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
                    deleteRequest.onsuccess = () => resolve();
                    deleteRequest.onerror = () => reject(deleteRequest.error);
                    deleteRequest.onblocked = () => {
                        console.warn('[reportDraftDB] Delete blocked');
                        resolve(); // Continue anyway
                    };
                });

                console.log('[reportDraftDB] Database deleted, recreating...');

                // Recursively call to recreate
                dbInitialized = false;
                return getDB();
            } catch (deleteError) {
                console.error('[reportDraftDB] Failed to delete database:', deleteError);
                throw deleteError;
            }
        }

        throw error;
    }
}

// Generate unique IDs
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================
// DRAFT OPERATIONS
// ============================================================

/**
 * Save or update a draft
 */
export async function saveDraft(
    draft: ReportDraft,
    syncStatus: SyncStatus = 'draft'
): Promise<string> {
    const db = await getDB();
    const draftId = draft.idempotencyKey || generateId();
    const now = Date.now();

    // Convert draft to storable format (without File objects)
    const storedDraft: StoredDraft = {
        categoryId: draft.categoryId,
        category: draft.category,
        location: draft.location,
        locationNote: draft.locationNote || null,
        title: draft.title,
        description: draft.description,
        confirmed: draft.confirmed,
        currentStep: draft.currentStep,
        createdAt: draft.createdAt.getTime(),
        updatedAt: now,
        idempotencyKey: draft.idempotencyKey,
    };

    // Save draft metadata
    await db.put('drafts', {
        id: draftId,
        draft: storedDraft,
        syncStatus,
        createdAt: now,
        updatedAt: now,
    });

    // Save images as blobs - use a single transaction for all image operations
    const tx = db.transaction('images', 'readwrite');
    const imageStore = tx.objectStore('images');

    // Get existing images within the same transaction
    const existingImages = await imageStore.index('by-draft').getAll(draftId);

    // Delete existing images
    for (const img of existingImages) {
        await imageStore.delete(img.id);
    }

    // Add new images
    for (const image of draft.images) {
        // Convert File to Blob
        const blob = image.file;
        await imageStore.put({
            id: image.id,
            draftId,
            blob,
            filename: image.file.name,
            capturedAt: image.capturedAt.getTime(),
        });
    }

    await tx.done;
    return draftId;
}

/**
 * Get a draft by ID with images
 */
export async function getDraft(draftId: string): Promise<ReportDraft | null> {
    const db = await getDB();
    const draftRecord = await db.get('drafts', draftId);

    if (!draftRecord) return null;

    // Get images for this draft
    const imageRecords = await db.getAllFromIndex('images', 'by-draft', draftId);

    // Convert blobs back to CapturedImage with previewUrl
    const images: CapturedImage[] = imageRecords.map((imgRecord) => {
        const file = new File([imgRecord.blob], imgRecord.filename, { type: imgRecord.blob.type });
        return {
            id: imgRecord.id,
            file,
            previewUrl: URL.createObjectURL(imgRecord.blob),
            capturedAt: new Date(imgRecord.capturedAt),
        };
    });

    const stored = draftRecord.draft;
    return {
        categoryId: stored.categoryId,
        category: stored.category,
        location: stored.location,
        title: stored.title,
        description: stored.description,
        confirmed: stored.confirmed,
        currentStep: stored.currentStep,
        createdAt: new Date(stored.createdAt),
        updatedAt: new Date(stored.updatedAt),
        idempotencyKey: stored.idempotencyKey,
        locationNote: stored.locationNote || null,
        images,
    };
}

/**
 * Get all drafts (without images for performance)
 */
export async function getAllDrafts(): Promise<Array<{
    id: string;
    draft: StoredDraft;
    syncStatus: SyncStatus;
    imageCount: number;
    updatedAt: number;
}>> {
    const db = await getDB();
    const drafts = await db.getAll('drafts');

    // Count images for each draft
    const result = await Promise.all(
        drafts.map(async (d) => {
            const images = await db.getAllFromIndex('images', 'by-draft', d.id);
            return {
                id: d.id,
                draft: d.draft,
                syncStatus: d.syncStatus,
                imageCount: images.length,
                updatedAt: d.updatedAt,
            };
        })
    );

    return result.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Get draft IDs by sync status
 */
export async function getDraftsByStatus(status: SyncStatus): Promise<string[]> {
    const db = await getDB();
    const drafts = await db.getAllFromIndex('drafts', 'by-status', status);
    return drafts.map((d) => d.id);
}

/**
 * Update draft sync status
 */
export async function updateDraftStatus(draftId: string, status: SyncStatus): Promise<void> {
    const db = await getDB();
    const draft = await db.get('drafts', draftId);

    if (draft) {
        await db.put('drafts', {
            ...draft,
            syncStatus: status,
            updatedAt: Date.now(),
        });
    }
}

/**
 * Delete a draft and its images
 */
export async function deleteDraft(draftId: string): Promise<void> {
    const db = await getDB();

    // Delete images first
    const images = await db.getAllFromIndex('images', 'by-draft', draftId);
    const tx = db.transaction('images', 'readwrite');
    for (const img of images) {
        await tx.store.delete(img.id);
    }
    await tx.done;

    // Delete draft
    await db.delete('drafts', draftId);
}

/**
 * Clear all sent drafts
 */
export async function clearSentDrafts(): Promise<number> {
    const sentDraftIds = await getDraftsByStatus('sent');
    let cleared = 0;

    for (const id of sentDraftIds) {
        await deleteDraft(id);
        cleared++;
    }

    return cleared;
}

// ============================================================
// IMAGE UTILITIES
// ============================================================

/**
 * Revoke all previewUrls for a draft's images
 */
export function revokeImageURLs(images: CapturedImage[]): void {
    for (const img of images) {
        if (img.previewUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(img.previewUrl);
        }
    }
}

// ============================================================
// MIGRATION FROM LOCALSTORAGE
// ============================================================

const LOCALSTORAGE_KEY = 'report_draft';

/**
 * Migrate existing localStorage draft to IndexedDB
 * Note: Images won't be migrated as they can't be stored in localStorage
 */
export async function migrateFromLocalStorage(): Promise<boolean> {
    try {
        const localData = localStorage.getItem(LOCALSTORAGE_KEY);
        if (!localData) return false;

        const parsed = JSON.parse(localData);
        if (!parsed) return false;

        // Create a minimal draft from localStorage data
        const draft: ReportDraft = {
            categoryId: parsed.categoryId || null,
            category: parsed.category || null,
            location: parsed.location || null,
            title: parsed.title || '',
            description: parsed.description || '',
            confirmed: false,
            currentStep: parsed.currentStep || 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            idempotencyKey: generateId(),
            locationNote: parsed.locationNote || null,
            images: [], // Images can't be recovered from localStorage
        };

        // Save to IndexedDB
        await saveDraft(draft, 'draft');

        // Remove from localStorage
        localStorage.removeItem(LOCALSTORAGE_KEY);

        console.log('[reportDraftDB] Migrated draft from localStorage to IndexedDB');
        return true;
    } catch (error) {
        console.error('[reportDraftDB] Migration failed:', error);
        return false;
    }
}

// Export database utility
export const reportDraftDB = {
    saveDraft,
    getDraft,
    getAllDrafts,
    getDraftsByStatus,
    updateDraftStatus,
    deleteDraft,
    clearSentDrafts,
    revokeImageURLs,
    migrateFromLocalStorage,
};
