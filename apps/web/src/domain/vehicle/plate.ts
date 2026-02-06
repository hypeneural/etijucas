/**
 * Normalizes a license plate string.
 * Removes non-alphanumeric characters and converts to uppercase.
 */
export function normalizePlate(value: string): string {
    return (value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
}

export type PlateType = "old" | "mercosul" | "invalid" | "partial";

/**
 * Validates if the plate is in the Old format (Gray/3 Letters + 4 Numbers)
 * Example: ABC1234
 */
export function isOldFormat(plate: string): boolean {
    return /^[A-Z]{3}\d{4}$/.test(normalizePlate(plate));
}

/**
 * Validates if the plate is in the Mercosul format (3 Letters + 1 Number + 1 Letter + 2 Numbers)
 * Example: ABC1D23
 */
export function isMercosulFormat(plate: string): boolean {
    return /^[A-Z]{3}\d[A-Z]\d{2}$/.test(normalizePlate(plate));
}

/**
 * Validates if the plate is valid in either format.
 */
export function isValidPlate(plate: string): boolean {
    return isOldFormat(plate) || isMercosulFormat(plate);
}

export function plateType(plate: string): PlateType {
    if (isOldFormat(plate)) return "old";
    if (isMercosulFormat(plate)) return "mercosul";
    if (isPlatePartialValid(plate)) return "partial";
    return "invalid";
}

/**
 * Validação por posição (parcial).
 * Retorna true se o prefixo atual ainda pode virar uma placa válida.
 */
export function isPlatePartialValid(p: string): boolean {
    if (!p) return true;
    const clean = normalizePlate(p);

    // 1-3: letras
    if (clean.length >= 1 && !isAZ(clean[0])) return false;
    if (clean.length >= 2 && !isAZ(clean[1])) return false;
    if (clean.length >= 3 && !isAZ(clean[2])) return false;

    // 4: número
    if (clean.length >= 4 && !is09(clean[3])) return false;

    // 5: letra OU número
    if (clean.length >= 5 && !(isAZ(clean[4]) || is09(clean[4]))) return false;

    // 6-7: números
    if (clean.length >= 6 && !is09(clean[5])) return false;
    if (clean.length >= 7 && !is09(clean[6])) return false;

    return true;
}

/**
 * Filtra um input "ao vivo": remove caracteres inválidos e mantém apenas o que
 * respeita a regra por posição. Ótimo para onChange.
 */
export function filterPlateByPosition(raw: string): string {
    const s = (raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const out: string[] = [];

    for (const ch of s) {
        const i = out.length; // próxima posição (0..6)
        if (i >= 7) break;

        // pos 0-2: letras
        if (i <= 2) {
            if (isAZ(ch)) out.push(ch);
            continue;
        }

        // pos 3: número
        if (i === 3) {
            if (is09(ch)) out.push(ch);
            continue;
        }

        // pos 4: letra ou número
        if (i === 4) {
            if (isAZ(ch) || is09(ch)) out.push(ch);
            continue;
        }

        // pos 5-6: número
        if (i >= 5) {
            if (is09(ch)) out.push(ch);
            continue;
        }
    }

    return out.join("");
}

function isAZ(ch: string) {
    const c = ch.charCodeAt(0);
    return c >= 65 && c <= 90; // A-Z
}
function is09(ch: string) {
    const c = ch.charCodeAt(0);
    return c >= 48 && c <= 57; // 0-9
}

export function getPlateHint(plate: string): string | null {
    if (!plate) return "Digite 3 letras";

    // Normalizar para contar apenas caracteres válidos
    const clean = normalizePlate(plate);
    const len = clean.length;

    if (len < 3) return "Digite 3 letras";
    if (len === 3) return "Agora 1 número";
    if (len === 4) return "Agora letra ou número";
    if (len >= 5 && len < 7) return "Agora 2 números";

    if (len === 7) {
        if (isMercosulFormat(clean)) return "Placa Mercosul detectada";
        if (isOldFormat(clean)) return "Placa Antiga detectada";
    }

    return null;
}


/**
 * Extracts the final digit of the plate for IPVA schedule lookup.
 * In Brazil, it's always the last character for both formats, 
 * but for Mercosul it's the last NUMBER, which is also the last char.
 * Returns -1 if invalid.
 */
export function getPlateFinal(plate: string): number {
    if (!isValidPlate(plate)) return -1;
    const normalized = normalizePlate(plate);
    const lastChar = normalized.slice(-1);
    const digit = parseInt(lastChar, 10);
    return isNaN(digit) ? -1 : digit;
}

/**
 * Formats the plate for visual display (e.g., "ABC·1D23").
 * Does not change the actual value, just for display.
 */
export function formatPlateVisual(plate: string): string {
    const clean = normalizePlate(plate);

    // Don't format shorter strings while typing
    if (clean.length < 3) return clean;

    const letters = clean.slice(0, 3);
    const rest = clean.slice(3);

    // Use a middle dot or similar separator
    return `${letters}·${rest}`;
}
