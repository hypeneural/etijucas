export interface IpvaScheduleDates {
    cotaUnica: string;
    parcela1: string;
    parcela2: string;
    parcela3: string;
    licenciamento: string;
}

// Tabela IPVA SC 2026 (Mockada com base em 2025 ou exemplo do prompt para 2024/2026)
// Reference: 
// Final 1: Cota Única 31/01, 1ª 10/01, 2ª 10/02, 3ª 10/03, Licenciamento 31/03
const SC_SCHEDULE: Record<number, IpvaScheduleDates> = {
    1: { cotaUnica: "2026-01-31", parcela1: "2026-01-10", parcela2: "2026-02-10", parcela3: "2026-03-10", licenciamento: "2026-03-31" },
    2: { cotaUnica: "2026-02-28", parcela1: "2026-02-10", parcela2: "2026-03-10", parcela3: "2026-04-10", licenciamento: "2026-04-30" },
    3: { cotaUnica: "2026-03-31", parcela1: "2026-03-10", parcela2: "2026-04-10", parcela3: "2026-05-10", licenciamento: "2026-05-31" },
    4: { cotaUnica: "2026-04-30", parcela1: "2026-04-10", parcela2: "2026-05-10", parcela3: "2026-06-10", licenciamento: "2026-06-30" },
    5: { cotaUnica: "2026-05-31", parcela1: "2026-05-10", parcela2: "2026-06-10", parcela3: "2026-07-10", licenciamento: "2026-07-31" },
    6: { cotaUnica: "2026-06-30", parcela1: "2026-06-10", parcela2: "2026-07-10", parcela3: "2026-08-10", licenciamento: "2026-08-31" },
    7: { cotaUnica: "2026-07-31", parcela1: "2026-07-10", parcela2: "2026-08-10", parcela3: "2026-09-10", licenciamento: "2026-09-30" },
    8: { cotaUnica: "2026-08-31", parcela1: "2026-08-10", parcela2: "2026-09-10", parcela3: "2026-10-10", licenciamento: "2026-10-31" },
    9: { cotaUnica: "2026-09-30", parcela1: "2026-09-10", parcela2: "2026-10-10", parcela3: "2026-11-10", licenciamento: "2026-11-30" },
    0: { cotaUnica: "2026-10-31", parcela1: "2026-10-10", parcela2: "2026-11-10", parcela3: "2026-12-10", licenciamento: "2026-12-31" },
};

/**
 * Returns the IPVA and Licensing schedule dates for a given plate final digit.
 * Returns undefined if the digit is invalid.
 */
export function getIpvaDates(finalDigit: number): IpvaScheduleDates | undefined {
    return SC_SCHEDULE[finalDigit];
}

/**
 * Helper to calculate days remaining until a specific date string (YYYY-MM-DD).
 */
export function getDaysRemaining(targetDateStr: string): number {
    const target = new Date(targetDateStr);
    const today = new Date();

    // Reset hours to compare just dates
    target.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}
