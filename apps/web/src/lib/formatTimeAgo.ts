// ======================================================
// Time Formatting Utilities
// Human-readable relative time for social feeds
// ======================================================

/**
 * Format a date as human-readable relative time
 * Examples: "agora", "há 2h", "ontem", "há 3 dias", "12 jan"
 */
export function formatTimeAgo(date: Date | string): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    // Just now (< 1 min)
    if (diffMinutes < 1) {
        return 'agora';
    }

    // Minutes (1-59 min)
    if (diffMinutes < 60) {
        return `há ${diffMinutes} min`;
    }

    // Hours (1-23h)
    if (diffHours < 24) {
        return `há ${diffHours}h`;
    }

    // Yesterday
    if (diffDays === 1) {
        return 'ontem';
    }

    // Days (2-6 days)
    if (diffDays < 7) {
        return `há ${diffDays} dias`;
    }

    // Weeks (1-3 weeks)
    if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return weeks === 1 ? 'há 1 semana' : `há ${weeks} semanas`;
    }

    // Months or exact date
    const months = [
        'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
        'jul', 'ago', 'set', 'out', 'nov', 'dez'
    ];
    const day = past.getDate();
    const month = months[past.getMonth()];

    // Same year: "12 jan"
    if (past.getFullYear() === now.getFullYear()) {
        return `${day} ${month}`;
    }

    // Different year: "12 jan 2024"
    return `${day} ${month} ${past.getFullYear()}`;
}

/**
 * Format a date for accessibility (screen readers)
 * Example: "12 de janeiro de 2025 às 14:30"
 */
export function formatDateAccessible(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Calculate hot score for ranking
 * Based on: likes + comments * 2 + recency decay
 */
export function calculateHotScore(
    likes: number,
    comments: number,
    createdAt: Date | string
): number {
    const ageHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    const gravity = 1.8; // Higher = faster decay

    // Score: weighted engagement / time decay
    const engagement = likes + (comments * 2);
    const score = engagement / Math.pow(ageHours + 2, gravity);

    return score;
}
