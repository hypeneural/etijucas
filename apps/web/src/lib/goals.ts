/**
 * goals.ts - Sistema de Metas Dinâmicas por Degrau
 * 
 * Calcula a próxima meta baseada em marcos fixos (10, 50, 100, 500, 1000, 5000, 10000)
 * e depois incrementa de 10k em 10k.
 * 
 * Isso é MUITO mais motivador do que uma meta fixa porque:
 * - Sempre há uma meta atingível próxima
 * - Progresso relativo ao degrau atual (não ao total)
 * - "Faltam 1.653 para 10.000" é mais motivador que "83% de 10.000"
 */

const FIXED_MILESTONES = [10, 50, 100, 500, 1000, 5000, 10000] as const;

export interface GoalData {
    total: number;
    goal: number;
    stageStart: number;
    remaining: number;
    progress: number; // 0..1
    progressPct: number; // 0.0..100.0
}

/**
 * Calcula a meta atual baseada no total de usuários
 * 
 * @param total - Número total de usuários
 * @returns GoalData com goal, stageStart, remaining, progress
 * 
 * @example
 * calcUserGoal(8347)
 * // { total: 8347, goal: 10000, stageStart: 5000, remaining: 1653, progress: 0.6694, progressPct: 66.9 }
 */
export function calcUserGoal(total: number): GoalData {
    const n = Math.max(0, Math.floor(total));

    // 0..9999: pega o próximo milestone fixo
    for (let i = 0; i < FIXED_MILESTONES.length; i++) {
        const goal = FIXED_MILESTONES[i];
        if (n < goal) {
            const stageStart = i === 0 ? 0 : FIXED_MILESTONES[i - 1];
            return buildGoal(n, stageStart, goal);
        }
    }

    // 10k+: metas de 10k em 10k (se n=10000 -> goal=20000)
    const goal = (Math.floor(n / 10000) + 1) * 10000;
    const stageStart = goal - 10000;
    return buildGoal(n, stageStart, goal);
}

function buildGoal(n: number, stageStart: number, goal: number): GoalData {
    const denom = Math.max(1, goal - stageStart);
    const progress = (n - stageStart) / denom; // 0..1
    const remaining = Math.max(0, goal - n);

    return {
        total: n,
        goal,
        stageStart,
        remaining,
        progress: Math.min(1, Math.max(0, progress)),
        progressPct: Math.round(Math.min(1, Math.max(0, progress)) * 1000) / 10, // 0.0%
    };
}

/**
 * Retorna uma mensagem motivacional baseada na faixa atual
 */
export function getMotivationalMessage(total: number): string {
    if (total < 10) {
        return 'Seja um dos primeiros! Ajude a cidade a crescer.';
    }
    if (total < 50) {
        return 'Estamos ganhando tração — convide 1 amigo!';
    }
    if (total < 100) {
        return 'Quase 100 cidadãos — bora bater essa meta!';
    }
    if (total < 500) {
        return 'Crescendo rápido! Compartilhe com vizinhos.';
    }
    if (total < 1000) {
        return 'Quase mil! A cidade está acordando.';
    }
    if (total < 5000) {
        return 'A cidade está usando! Compartilhe com seu bairro.';
    }
    if (total < 10000) {
        return 'Rumo aos 10 mil cidadãos conectados!';
    }
    return 'Cidade conectada! Continue convidando.';
}

/**
 * Formata número no padrão brasileiro (1.234)
 */
export function formatNumber(n: number): string {
    return n.toLocaleString('pt-BR');
}

/**
 * Verifica se acabou de bater uma meta
 * Útil para disparar confetti
 */
export function justReachedGoal(prevTotal: number, currentTotal: number): boolean {
    if (prevTotal >= currentTotal) return false;

    const prevGoal = calcUserGoal(prevTotal);
    const currGoal = calcUserGoal(currentTotal);

    // Se a meta mudou, significa que batemos uma meta
    return currGoal.goal > prevGoal.goal;
}

export default {
    calcUserGoal,
    getMotivationalMessage,
    formatNumber,
    justReachedGoal,
    FIXED_MILESTONES,
};
