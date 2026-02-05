/**
 * Normalizes a license plate string.
 * Removes non-alphanumeric characters and converts to uppercase.
 */
export function normalizePlate(value: string): string {
    return (value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

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
