/**
 * useReportDraft - Hook for managing report drafts with IndexedDB
 * 
 * Provides draft state management with automatic persistence to IndexedDB
 * and migration from localStorage on first use.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { reportDraftDB, revokeImageURLs, migrateFromLocalStorage } from '@/lib/idb/reportDraftDB';
import type { ReportDraft, WizardStep, CapturedImage } from '@/types/report';
import { initialReportDraft, generateIdempotencyKey, REPORT_DRAFT_KEY } from '@/types/report';

interface UseReportDraftReturn {
    draft: ReportDraft;
    isLoading: boolean;
    updateDraft: (updates: Partial<ReportDraft>) => void;
    addImage: (image: CapturedImage) => void;
    removeImage: (imageId: string) => void;
    goToStep: (step: WizardStep) => void;
    nextStep: () => void;
    prevStep: () => void;
    clearDraft: () => Promise<void>;
    saveDraft: () => Promise<void>;
}

// Default draft ID for single active draft
const ACTIVE_DRAFT_ID = 'active-report-draft';

export function useReportDraft(): UseReportDraftReturn {
    const [draft, setDraft] = useState<ReportDraft>(() => ({
        ...initialReportDraft,
        idempotencyKey: generateIdempotencyKey(),
    }));
    const [isLoading, setIsLoading] = useState(true);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);

    // Load draft on mount
    useEffect(() => {
        isMountedRef.current = true;

        async function loadDraft() {
            try {
                // Try to migrate from localStorage first (one-time migration)
                await migrateFromLocalStorage();

                // Load from IndexedDB
                const savedDraft = await reportDraftDB.getDraft(ACTIVE_DRAFT_ID);

                if (savedDraft && isMountedRef.current) {
                    setDraft(savedDraft);
                }
            } catch (error) {
                console.error('[useReportDraft] Error loading draft:', error);
                // Fallback: try localStorage as last resort
                try {
                    const localData = localStorage.getItem(REPORT_DRAFT_KEY);
                    if (localData) {
                        const parsed = JSON.parse(localData);
                        if (isMountedRef.current) {
                            setDraft({
                                ...initialReportDraft,
                                ...parsed,
                                createdAt: new Date(parsed.createdAt || Date.now()),
                                updatedAt: new Date(parsed.updatedAt || Date.now()),
                                images: [], // Images can't be in localStorage
                                idempotencyKey: parsed.idempotencyKey || generateIdempotencyKey(),
                            });
                        }
                    }
                } catch (localError) {
                    console.error('[useReportDraft] localStorage fallback failed:', localError);
                }
            } finally {
                if (isMountedRef.current) {
                    setIsLoading(false);
                }
            }
        }

        loadDraft();

        return () => {
            isMountedRef.current = false;
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    // Debounced save to IndexedDB
    const debouncedSave = useCallback(async (newDraft: ReportDraft) => {
        // Clear any pending save
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new debounced save (500ms)
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                // Create a modified draft with the active draft ID
                const draftToSave: ReportDraft = {
                    ...newDraft,
                    idempotencyKey: ACTIVE_DRAFT_ID, // Use fixed ID for active draft
                };
                await reportDraftDB.saveDraft(draftToSave, 'draft');
            } catch (error) {
                console.error('[useReportDraft] Error saving draft:', error);
            }
        }, 500);
    }, []);

    // Update draft
    const updateDraft = useCallback((updates: Partial<ReportDraft>) => {
        setDraft((prev) => {
            const newDraft: ReportDraft = {
                ...prev,
                ...updates,
                updatedAt: new Date(),
            };
            debouncedSave(newDraft);
            return newDraft;
        });
    }, [debouncedSave]);

    // Add image
    const addImage = useCallback((image: CapturedImage) => {
        setDraft((prev) => {
            if (prev.images.length >= 3) {
                // Already at max
                return prev;
            }
            const newDraft: ReportDraft = {
                ...prev,
                images: [...prev.images, image],
                updatedAt: new Date(),
            };
            debouncedSave(newDraft);
            return newDraft;
        });
    }, [debouncedSave]);

    // Remove image
    const removeImage = useCallback((imageId: string) => {
        setDraft((prev) => {
            const imageToRemove = prev.images.find((img) => img.id === imageId);
            if (imageToRemove) {
                URL.revokeObjectURL(imageToRemove.previewUrl);
            }
            const newDraft: ReportDraft = {
                ...prev,
                images: prev.images.filter((img) => img.id !== imageId),
                updatedAt: new Date(),
            };
            debouncedSave(newDraft);
            return newDraft;
        });
    }, [debouncedSave]);

    // Navigation
    const goToStep = useCallback((step: WizardStep) => {
        updateDraft({ currentStep: step });
    }, [updateDraft]);

    const nextStep = useCallback(() => {
        setDraft((prev) => {
            if (prev.currentStep < 4) {
                const newStep = (prev.currentStep + 1) as WizardStep;
                const newDraft = { ...prev, currentStep: newStep, updatedAt: new Date() };
                debouncedSave(newDraft);
                return newDraft;
            }
            return prev;
        });
    }, [debouncedSave]);

    const prevStep = useCallback(() => {
        setDraft((prev) => {
            if (prev.currentStep > 1) {
                const newStep = (prev.currentStep - 1) as WizardStep;
                const newDraft = { ...prev, currentStep: newStep, updatedAt: new Date() };
                debouncedSave(newDraft);
                return newDraft;
            }
            return prev;
        });
    }, [debouncedSave]);

    // Clear draft
    const clearDraft = useCallback(async () => {
        // Revoke all image URLs
        revokeImageURLs(draft.images);

        // Delete from IndexedDB
        try {
            await reportDraftDB.deleteDraft(ACTIVE_DRAFT_ID);
        } catch (error) {
            console.error('[useReportDraft] Error deleting draft:', error);
        }

        // Also clear localStorage for backwards compat
        localStorage.removeItem(REPORT_DRAFT_KEY);

        // Reset state
        setDraft({
            ...initialReportDraft,
            idempotencyKey: generateIdempotencyKey(),
        });
    }, [draft.images]);

    // Manual save (for before submit)
    const saveDraft = useCallback(async () => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        try {
            const draftToSave: ReportDraft = {
                ...draft,
                idempotencyKey: ACTIVE_DRAFT_ID,
            };
            await reportDraftDB.saveDraft(draftToSave, 'draft');
        } catch (error) {
            console.error('[useReportDraft] Error saving draft:', error);
        }
    }, [draft]);

    return {
        draft,
        isLoading,
        updateDraft,
        addImage,
        removeImage,
        goToStep,
        nextStep,
        prevStep,
        clearDraft,
        saveDraft,
    };
}
