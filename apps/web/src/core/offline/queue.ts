/**
 * Offline Queue
 * 
 * Gerencia a fila de mutações offline usando Zustand.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OfflineMutation } from './index';

interface OfflineQueueState {
    queue: OfflineMutation[];
    isProcessing: boolean;

    // Actions
    addToQueue: (mutation: OfflineMutation) => void;
    removeFromQueue: (id: string) => void;
    updateMutation: (id: string, updates: Partial<OfflineMutation>) => void;
    setProcessing: (isProcessing: boolean) => void;
    clearQueue: () => void;

    // Getters
    getPendingCount: () => number;
    getErrorCount: () => number;
}

export const useOfflineQueue = create<OfflineQueueState>()(
    persist(
        (set, get) => ({
            queue: [],
            isProcessing: false,

            addToQueue: (mutation) => {
                set((state) => ({
                    queue: [...state.queue, mutation],
                }));
            },

            removeFromQueue: (id) => {
                set((state) => ({
                    queue: state.queue.filter((m) => m.id !== id),
                }));
            },

            updateMutation: (id, updates) => {
                set((state) => ({
                    queue: state.queue.map((m) =>
                        m.id === id ? { ...m, ...updates } : m
                    ),
                }));
            },

            setProcessing: (isProcessing) => {
                set({ isProcessing });
            },

            clearQueue: () => {
                set({ queue: [] });
            },

            getPendingCount: () => {
                return get().queue.filter((m) => m.status === 'pending').length;
            },

            getErrorCount: () => {
                return get().queue.filter((m) => m.status === 'error').length;
            },
        }),
        {
            name: 'etijucas-offline-queue',
            version: 1,
        }
    )
);
