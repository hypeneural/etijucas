import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Topic, Report, Bairro } from '@/types';
import { bairros } from '@/constants/bairros';
import { initialTopics, myReports as initialReports } from '@/data/mockData';
import { generateUUID } from '@/lib/uuid';

// Default bairro (Centro de Tijucas) - fallback for hydration issues
const DEFAULT_BAIRRO: Bairro = bairros.find(b => b.slug === 'centro') || bairros[0];

// Sync status for optimistic UI
export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error';

// Extended Report with sync status
export interface OptimisticReport extends Report {
  syncStatus: SyncStatus;
  tempId?: string; // Temporary ID before server confirmation
  errorMessage?: string;
}

interface AppState {
  // User settings
  selectedBairro: Bairro;
  setSelectedBairro: (bairro: Bairro) => void;

  // Topics
  topics: Topic[];
  likeTopic: (topicId: string) => void;
  addTopic: (topic: Omit<Topic, 'id' | 'createdAt' | 'likesCount' | 'commentsCount' | 'liked'>) => void;

  // Reports with optimistic UI support
  reports: OptimisticReport[];
  addReport: (report: Omit<Report, 'id' | 'createdAt' | 'likes' | 'protocolo' | 'status'>) => OptimisticReport;
  updateReportStatus: (id: string, status: SyncStatus, errorMessage?: string) => void;
  confirmReport: (tempId: string, confirmedId: string, protocolo: string) => void;
  deleteReport: (id: string) => void;
  retryReport: (id: string) => void;

  // UI state
  isRefreshing: boolean;
  setIsRefreshing: (value: boolean) => void;

  // Scroll positions per tab
  scrollPositions: Record<string, number>;
  setScrollPosition: (tab: string, position: number) => void;

  // Stats
  weeklyContributions: number;
  incrementContributions: () => void;

  // Navigation state
  activeTab: 'home' | 'reportar' | 'forum' | 'agenda' | 'mais';
  setActiveTab: (tab: 'home' | 'reportar' | 'forum' | 'agenda' | 'mais') => void;

  // Phone favorites
  favoritePhones: string[];
  toggleFavoritePhone: (phoneId: string) => void;
}

// Convert initial reports to OptimisticReports
const initialOptimisticReports: OptimisticReport[] = initialReports.map(r => ({
  ...r,
  syncStatus: 'synced' as SyncStatus,
}));

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedBairro: DEFAULT_BAIRRO,
      setSelectedBairro: (bairro) => set({ selectedBairro: bairro }),

      topics: initialTopics,
      likeTopic: (topicId) => set((state) => ({
        topics: state.topics.map(topic =>
          topic.id === topicId
            ? {
              ...topic,
              liked: !topic.liked,
              likesCount: topic.liked ? topic.likesCount - 1 : topic.likesCount + 1
            }
            : topic
        ),
        weeklyContributions: state.weeklyContributions + 1,
      })),
      addTopic: (topicData) => set((state) => ({
        topics: [
          {
            ...topicData,
            id: `topic-${Date.now()}`,
            createdAt: new Date(),
            likesCount: 0,
            commentsCount: 0,
            liked: false,
          },
          ...state.topics,
        ],
        weeklyContributions: state.weeklyContributions + 1,
      })),

      reports: initialOptimisticReports,

      // Add report with optimistic UI (appears immediately as 'pending')
      // Uses UUID for idempotency - server can use this to deduplicate retries
      addReport: (reportData) => {
        const clientId = generateUUID();
        const newReport: OptimisticReport = {
          ...reportData,
          id: clientId,
          tempId: clientId,
          createdAt: new Date(),
          likes: 0,
          protocolo: `ETJ-${String(Date.now()).slice(-6)}`,
          status: 'recebido',
          syncStatus: 'pending',
        };
        set((state) => ({
          reports: [newReport, ...state.reports],
          weeklyContributions: state.weeklyContributions + 1,
        }));
        return newReport;
      },

      // Update sync status of a report
      updateReportStatus: (id, syncStatus, errorMessage) => set((state) => ({
        reports: state.reports.map(report =>
          report.id === id || report.tempId === id
            ? { ...report, syncStatus, errorMessage }
            : report
        ),
      })),

      // Confirm report after server response (replace tempId with real id)
      confirmReport: (tempId, confirmedId, protocolo) => set((state) => ({
        reports: state.reports.map(report =>
          report.tempId === tempId
            ? { ...report, id: confirmedId, protocolo, tempId: undefined, syncStatus: 'synced' as SyncStatus }
            : report
        ),
      })),

      // Delete a report
      deleteReport: (id) => set((state) => ({
        reports: state.reports.filter(report => report.id !== id && report.tempId !== id),
      })),

      // Retry a failed report (reset status to pending)
      retryReport: (id) => set((state) => ({
        reports: state.reports.map(report =>
          report.id === id || report.tempId === id
            ? { ...report, syncStatus: 'pending' as SyncStatus, errorMessage: undefined }
            : report
        ),
      })),

      isRefreshing: false,
      setIsRefreshing: (value) => set({ isRefreshing: value }),

      scrollPositions: {},
      setScrollPosition: (tab, position) => set((state) => ({
        scrollPositions: { ...state.scrollPositions, [tab]: position },
      })),

      weeklyContributions: 3,
      incrementContributions: () => set((state) => ({
        weeklyContributions: state.weeklyContributions + 1,
      })),

      activeTab: 'home',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Phone favorites
      favoritePhones: [],
      toggleFavoritePhone: (phoneId) => set((state) => ({
        favoritePhones: state.favoritePhones.includes(phoneId)
          ? state.favoritePhones.filter(id => id !== phoneId)
          : [...state.favoritePhones, phoneId],
      })),
    }),
    {
      name: 'etijucas-storage',
      version: 2, // Bumped to force migration of selectedBairro
      migrate: (persistedState, version) => {
        const state = persistedState as {
          selectedBairro?: Bairro;
          reports?: Array<OptimisticReport>;
        } | undefined;

        // V1 -> V2: Fix selectedBairro incompatibility (old mockData IDs vs new UUID format)
        if (version < 2) {
          // Check if selectedBairro has old-style ID (simple numbers like '1', '2')
          // Or if it's missing the slug property (new format has slug)
          if (state?.selectedBairro) {
            const hasOldId = /^[0-9]+$/.test(state.selectedBairro.id || '');
            const missingSlug = !state.selectedBairro.slug;

            if (hasOldId || missingSlug) {
              // Find matching bairro by name, or use default
              const matchedBairro = bairros.find(
                b => b.nome === state.selectedBairro?.nome
              );
              state.selectedBairro = matchedBairro || DEFAULT_BAIRRO;
            }
          } else {
            // No bairro at all - set default
            state.selectedBairro = DEFAULT_BAIRRO;
          }
        }

        if (state?.reports) {
          state.reports = state.reports.map((report) => ({
            ...report,
            syncStatus: report.syncStatus ?? 'synced',
          }));
        }

        return state as AppState;
      },
      partialize: (state) => ({
        selectedBairro: state.selectedBairro,
        topics: state.topics.map(t => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { fotoUrl, ...rest } = t;
          return rest;
        }),
        reports: state.reports.map(r => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { fotoUrl, ...rest } = r;
          return rest;
        }),
        weeklyContributions: state.weeklyContributions,
        favoritePhones: state.favoritePhones,
      }),
    }
  )
);

