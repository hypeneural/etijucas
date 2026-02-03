import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MutationType = 'POST' | 'PUT' | 'DELETE';

export interface PendingMutation {
    id: string;
    type: MutationType;
    endpoint: string;
    payload: unknown;
    timestamp: number;
    retries: number;
}

interface SyncState {
    pendingMutations: PendingMutation[];
    isSyncing: boolean;
    lastSyncAt: number | null;

    // Actions
    addToQueue: (mutation: Omit<PendingMutation, 'id' | 'timestamp' | 'retries'>) => string;
    removeFromQueue: (id: string) => void;
    clearQueue: () => void;
    setIsSyncing: (value: boolean) => void;
    setLastSyncAt: (timestamp: number) => void;
    incrementRetries: (id: string) => void;
}

export const useSyncStore = create<SyncState>()(
    persist(
        (set, get) => ({
            pendingMutations: [],
            isSyncing: false,
            lastSyncAt: null,

            addToQueue: (mutation) => {
                const id = `sync-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
                const newMutation: PendingMutation = {
                    ...mutation,
                    id,
                    timestamp: Date.now(),
                    retries: 0,
                };

                set((state) => ({
                    pendingMutations: [...state.pendingMutations, newMutation],
                }));

                return id;
            },

            removeFromQueue: (id) => {
                set((state) => ({
                    pendingMutations: state.pendingMutations.filter((m) => m.id !== id),
                }));
            },

            clearQueue: () => {
                set({ pendingMutations: [] });
            },

            setIsSyncing: (value) => {
                set({ isSyncing: value });
            },

            setLastSyncAt: (timestamp) => {
                set({ lastSyncAt: timestamp });
            },

            incrementRetries: (id) => {
                set((state) => ({
                    pendingMutations: state.pendingMutations.map((m) =>
                        m.id === id ? { ...m, retries: m.retries + 1 } : m
                    ),
                }));
            },
        }),
        {
            name: 'etijucas-sync-queue',
            partialize: (state) => ({
                pendingMutations: state.pendingMutations,
                lastSyncAt: state.lastSyncAt,
            }),
        }
    )
);

// Selector for pending count
export const selectPendingCount = (state: SyncState) => state.pendingMutations.length;

// Selector for oldest pending mutation
export const selectOldestPending = (state: SyncState) =>
    state.pendingMutations.length > 0
        ? state.pendingMutations.reduce((oldest, current) =>
            current.timestamp < oldest.timestamp ? current : oldest
        )
        : null;
