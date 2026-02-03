// Local Database - IndexedDB wrapper for offline persistence
// Provides typed storage for all app data with offline-first support

import { get, set, del, keys, createStore } from 'idb-keyval';
import type { Report, Topic, Comment, Event, UsefulPhone, MassSchedule, Alert, TourismSpot, Bairro } from '@/types';

// Create separate stores for different data types
const reportsStore = createStore('etijucas-reports', 'reports');
const topicsStore = createStore('etijucas-topics', 'topics');
const commentsStore = createStore('etijucas-comments', 'comments');
const syncQueueStore = createStore('etijucas-sync', 'queue');

// New stores for complete offline support
const eventsStore = createStore('etijucas-events', 'events');
const phonesStore = createStore('etijucas-phones', 'phones');
const massesStore = createStore('etijucas-masses', 'masses');
const alertsStore = createStore('etijucas-alerts', 'alerts');
const tourismStore = createStore('etijucas-tourism', 'spots');
const bairrosStore = createStore('etijucas-bairros', 'bairros');

// Sync queue item type
export interface SyncQueueItem {
    id: string;
    type: 'report' | 'topic' | 'comment' | 'like' | 'unlike' | 'comment-like' | 'save';
    data: unknown;
    createdAt: Date;
    retryCount: number;
    lastAttempt?: Date;
    idempotencyKey: string;
}

// ==================== REPORTS ====================

export const reportsDB = {
    async getAll(): Promise<Report[]> {
        try {
            const allKeys = await keys(reportsStore);
            const reports: Report[] = [];
            for (const key of allKeys) {
                const report = await get<Report>(key, reportsStore);
                if (report) reports.push(report);
            }
            // Sort by date (newest first)
            return reports.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        } catch (error) {
            console.error('Error getting reports from IndexedDB:', error);
            return [];
        }
    },

    async getById(id: string): Promise<Report | undefined> {
        try {
            return await get<Report>(id, reportsStore);
        } catch (error) {
            console.error('Error getting report from IndexedDB:', error);
            return undefined;
        }
    },

    async save(report: Report): Promise<void> {
        try {
            await set(report.id, report, reportsStore);
        } catch (error) {
            console.error('Error saving report to IndexedDB:', error);
        }
    },

    async saveMany(reports: Report[]): Promise<void> {
        try {
            for (const report of reports) {
                await set(report.id, report, reportsStore);
            }
        } catch (error) {
            console.error('Error saving reports to IndexedDB:', error);
        }
    },

    async delete(id: string): Promise<void> {
        try {
            await del(id, reportsStore);
        } catch (error) {
            console.error('Error deleting report from IndexedDB:', error);
        }
    },

    async clear(): Promise<void> {
        try {
            const allKeys = await keys(reportsStore);
            for (const key of allKeys) {
                await del(key, reportsStore);
            }
        } catch (error) {
            console.error('Error clearing reports from IndexedDB:', error);
        }
    },
};

// ==================== TOPICS ====================

export const topicsDB = {
    async getAll(): Promise<Topic[]> {
        try {
            const allKeys = await keys(topicsStore);
            const topics: Topic[] = [];
            for (const key of allKeys) {
                const topic = await get<Topic>(key, topicsStore);
                if (topic) topics.push(topic);
            }
            return topics.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        } catch (error) {
            console.error('Error getting topics from IndexedDB:', error);
            return [];
        }
    },

    async getById(id: string): Promise<Topic | undefined> {
        try {
            return await get<Topic>(id, topicsStore);
        } catch (error) {
            console.error('Error getting topic from IndexedDB:', error);
            return undefined;
        }
    },

    async save(topic: Topic): Promise<void> {
        try {
            await set(topic.id, topic, topicsStore);
        } catch (error) {
            console.error('Error saving topic to IndexedDB:', error);
        }
    },

    async saveMany(topics: Topic[]): Promise<void> {
        try {
            for (const topic of topics) {
                await set(topic.id, topic, topicsStore);
            }
        } catch (error) {
            console.error('Error saving topics to IndexedDB:', error);
        }
    },

    async update(id: string, updates: Partial<Topic>): Promise<Topic | undefined> {
        try {
            const existing = await get<Topic>(id, topicsStore);
            if (existing) {
                const updated = { ...existing, ...updates };
                await set(id, updated, topicsStore);
                return updated;
            }
        } catch (error) {
            console.error('Error updating topic in IndexedDB:', error);
        }
        return undefined;
    },

    async delete(id: string): Promise<void> {
        try {
            await del(id, topicsStore);
        } catch (error) {
            console.error('Error deleting topic from IndexedDB:', error);
        }
    },
};

// ==================== COMMENTS ====================

export const commentsDB = {
    async getByTopicId(topicId: string): Promise<Comment[]> {
        try {
            const allKeys = await keys(commentsStore);
            const comments: Comment[] = [];
            for (const key of allKeys) {
                const comment = await get<Comment>(key, commentsStore);
                if (comment && comment.topicId === topicId) {
                    comments.push(comment);
                }
            }
            return comments.sort((a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
        } catch (error) {
            console.error('Error getting comments from IndexedDB:', error);
            return [];
        }
    },

    async save(comment: Comment): Promise<void> {
        try {
            await set(comment.id, comment, commentsStore);
        } catch (error) {
            console.error('Error saving comment to IndexedDB:', error);
        }
    },

    async delete(id: string): Promise<void> {
        try {
            await del(id, commentsStore);
        } catch (error) {
            console.error('Error deleting comment from IndexedDB:', error);
        }
    },
};

// ==================== SYNC QUEUE ====================

export const syncQueueDB = {
    async getAll(): Promise<SyncQueueItem[]> {
        try {
            const allKeys = await keys(syncQueueStore);
            const items: SyncQueueItem[] = [];
            for (const key of allKeys) {
                const item = await get<SyncQueueItem>(key, syncQueueStore);
                if (item) items.push(item);
            }
            return items.sort((a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
        } catch (error) {
            console.error('Error getting sync queue from IndexedDB:', error);
            return [];
        }
    },

    async add(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>): Promise<SyncQueueItem> {
        const newItem: SyncQueueItem = {
            ...item,
            id: `sync-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            createdAt: new Date(),
            retryCount: 0,
        };
        try {
            await set(newItem.id, newItem, syncQueueStore);
        } catch (error) {
            console.error('Error adding to sync queue:', error);
        }
        return newItem;
    },

    async update(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
        try {
            const existing = await get<SyncQueueItem>(id, syncQueueStore);
            if (existing) {
                await set(id, { ...existing, ...updates }, syncQueueStore);
            }
        } catch (error) {
            console.error('Error updating sync queue item:', error);
        }
    },

    async remove(id: string): Promise<void> {
        try {
            await del(id, syncQueueStore);
        } catch (error) {
            console.error('Error removing from sync queue:', error);
        }
    },

    async clear(): Promise<void> {
        try {
            const allKeys = await keys(syncQueueStore);
            for (const key of allKeys) {
                await del(key, syncQueueStore);
            }
        } catch (error) {
            console.error('Error clearing sync queue:', error);
        }
    },

    // Check if item already exists (for deduplication)
    async exists(idempotencyKey: string): Promise<boolean> {
        try {
            const items = await this.getAll();
            return items.some(item => item.idempotencyKey === idempotencyKey);
        } catch {
            return false;
        }
    },
};

// ==================== EVENTS ====================

// Events DB with simplified types to avoid strict index signature issues
export const eventsDB = {
    async getAll(): Promise<Event[]> {
        try {
            const allKeys = await keys(eventsStore);
            const items: Event[] = [];
            for (const key of allKeys) {
                const item = await get<Event>(key, eventsStore);
                if (item) items.push(item);
            }
            // Sort by date (soonest first) - handle both dateTime and startDateTime
            return items.sort((a, b) => {
                const aDate = (a as { startDateTime?: string }).startDateTime || a.dateTime;
                const bDate = (b as { startDateTime?: string }).startDateTime || b.dateTime;
                if (!aDate || !bDate) return 0;
                return new Date(aDate as Date | string).getTime() - new Date(bDate as Date | string).getTime();
            });
        } catch (error) {
            console.error('Error getting events from IndexedDB:', error);
            return [];
        }
    },

    async getById(id: string): Promise<Event | undefined> {
        try {
            return await get<Event>(id, eventsStore);
        } catch (error) {
            console.error('Error getting event from IndexedDB:', error);
            return undefined;
        }
    },

    async save(event: Event): Promise<void> {
        try {
            await set(event.id, event, eventsStore);
        } catch (error) {
            console.error('Error saving event to IndexedDB:', error);
        }
    },

    async saveMany(events: Event[]): Promise<void> {
        try {
            for (const event of events) {
                await set(event.id, event, eventsStore);
            }
        } catch (error) {
            console.error('Error saving events to IndexedDB:', error);
        }
    },

    async clear(): Promise<void> {
        try {
            const allKeys = await keys(eventsStore);
            for (const key of allKeys) {
                await del(key, eventsStore);
            }
        } catch (error) {
            console.error('Error clearing events from IndexedDB:', error);
        }
    },
};

// ==================== PHONES ====================

export const phonesDB = {
    async getAll(): Promise<UsefulPhone[]> {
        try {
            const allKeys = await keys(phonesStore);
            const items: UsefulPhone[] = [];
            for (const key of allKeys) {
                const item = await get<UsefulPhone>(key, phonesStore);
                if (item) items.push(item);
            }
            return items;
        } catch (error) {
            console.error('Error getting phones from IndexedDB:', error);
            return [];
        }
    },

    async saveMany(phones: UsefulPhone[]): Promise<void> {
        try {
            for (const phone of phones) {
                await set(phone.id, phone, phonesStore);
            }
        } catch (error) {
            console.error('Error saving phones to IndexedDB:', error);
        }
    },

    async clear(): Promise<void> {
        try {
            const allKeys = await keys(phonesStore);
            for (const key of allKeys) {
                await del(key, phonesStore);
            }
        } catch (error) {
            console.error('Error clearing phones from IndexedDB:', error);
        }
    },
};

// ==================== MASSES ====================

export const massesDB = {
    async getAll(): Promise<MassSchedule[]> {
        try {
            const allKeys = await keys(massesStore);
            const items: MassSchedule[] = [];
            for (const key of allKeys) {
                const item = await get<MassSchedule>(key, massesStore);
                if (item) items.push(item);
            }
            return items;
        } catch (error) {
            console.error('Error getting masses from IndexedDB:', error);
            return [];
        }
    },

    async saveMany(masses: MassSchedule[]): Promise<void> {
        try {
            for (const mass of masses) {
                await set(mass.id, mass, massesStore);
            }
        } catch (error) {
            console.error('Error saving masses to IndexedDB:', error);
        }
    },

    async clear(): Promise<void> {
        try {
            const allKeys = await keys(massesStore);
            for (const key of allKeys) {
                await del(key, massesStore);
            }
        } catch (error) {
            console.error('Error clearing masses from IndexedDB:', error);
        }
    },
};

// ==================== ALERTS ====================

export const alertsDB = {
    async getAll(): Promise<Alert[]> {
        try {
            const allKeys = await keys(alertsStore);
            const items: Alert[] = [];
            for (const key of allKeys) {
                const item = await get<Alert>(key, alertsStore);
                if (item) items.push(item);
            }
            // Sort by date (newest first)
            return items.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        } catch (error) {
            console.error('Error getting alerts from IndexedDB:', error);
            return [];
        }
    },

    async saveMany(alerts: Alert[]): Promise<void> {
        try {
            for (const alert of alerts) {
                await set(alert.id, alert, alertsStore);
            }
        } catch (error) {
            console.error('Error saving alerts to IndexedDB:', error);
        }
    },

    async clear(): Promise<void> {
        try {
            const allKeys = await keys(alertsStore);
            for (const key of allKeys) {
                await del(key, alertsStore);
            }
        } catch (error) {
            console.error('Error clearing alerts from IndexedDB:', error);
        }
    },
};

// ==================== TOURISM ====================

export const tourismDB = {
    async getAll(): Promise<TourismSpot[]> {
        try {
            const allKeys = await keys(tourismStore);
            const items: TourismSpot[] = [];
            for (const key of allKeys) {
                const item = await get<TourismSpot>(key, tourismStore);
                if (item) items.push(item);
            }
            return items;
        } catch (error) {
            console.error('Error getting tourism spots from IndexedDB:', error);
            return [];
        }
    },

    async saveMany(spots: TourismSpot[]): Promise<void> {
        try {
            for (const spot of spots) {
                await set(spot.id, spot, tourismStore);
            }
        } catch (error) {
            console.error('Error saving tourism spots to IndexedDB:', error);
        }
    },

    async clear(): Promise<void> {
        try {
            const allKeys = await keys(tourismStore);
            for (const key of allKeys) {
                await del(key, tourismStore);
            }
        } catch (error) {
            console.error('Error clearing tourism spots from IndexedDB:', error);
        }
    },
};

// ==================== BAIRROS ====================

export const bairrosDB = {
    async getAll(): Promise<Bairro[]> {
        try {
            const allKeys = await keys(bairrosStore);
            const items: Bairro[] = [];
            for (const key of allKeys) {
                const item = await get<Bairro>(key, bairrosStore);
                if (item) items.push(item);
            }
            return items.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        } catch (error) {
            console.error('Error getting bairros from IndexedDB:', error);
            return [];
        }
    },

    async saveMany(bairros: Bairro[]): Promise<void> {
        try {
            for (const bairro of bairros) {
                await set(bairro.id, bairro, bairrosStore);
            }
        } catch (error) {
            console.error('Error saving bairros to IndexedDB:', error);
        }
    },

    async clear(): Promise<void> {
        try {
            const allKeys = await keys(bairrosStore);
            for (const key of allKeys) {
                await del(key, bairrosStore);
            }
        } catch (error) {
            console.error('Error clearing bairros from IndexedDB:', error);
        }
    },
};

// ==================== INITIALIZATION ====================

// Initialize local DB with mock data if empty
export async function initializeLocalDB(mockReports: Report[], mockTopics: Topic[]): Promise<void> {
    try {
        const existingReports = await reportsDB.getAll();
        if (existingReports.length === 0) {
            await reportsDB.saveMany(mockReports);
            console.log('Initialized reports DB with mock data');
        }

        const existingTopics = await topicsDB.getAll();
        if (existingTopics.length === 0) {
            await topicsDB.saveMany(mockTopics);
            console.log('Initialized topics DB with mock data');
        }
    } catch (error) {
        console.error('Error initializing local DB:', error);
    }
}

export default {
    reports: reportsDB,
    topics: topicsDB,
    comments: commentsDB,
    syncQueue: syncQueueDB,
    events: eventsDB,
    phones: phonesDB,
    masses: massesDB,
    alerts: alertsDB,
    tourism: tourismDB,
    bairros: bairrosDB,
    initialize: initializeLocalDB,
};
