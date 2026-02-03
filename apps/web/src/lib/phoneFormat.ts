// ======================================================
// phoneFormat - Brazilian phone number formatting utilities
// ======================================================

/**
 * Remove all non-digit characters from phone number
 */
export function cleanPhoneNumber(phone: string): string {
    return phone.replace(/\D/g, '');
}

/**
 * Format phone number for display (Brazilian format)
 * - 3 digits: emergency (192, 190, 193)
 * - 0800: toll-free
 * - 10-11 digits: regular/mobile
 */
export function formatPhoneDisplay(phone: string): string {
    const cleaned = cleanPhoneNumber(phone);

    // Emergency numbers (3 digits)
    if (cleaned.length <= 3) {
        return cleaned;
    }

    // 0800 numbers
    if (cleaned.startsWith('0800')) {
        return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
    }

    // 8 digits (local landline without area code)
    if (cleaned.length === 8) {
        return cleaned.replace(/(\d{4})(\d{4})/, '$1-$2');
    }

    // 9 digits (local mobile without area code)
    if (cleaned.length === 9) {
        return cleaned.replace(/(\d{5})(\d{4})/, '$1-$2');
    }

    // 10 digits (landline with area code)
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }

    // 11 digits (mobile with area code)
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }

    // Fallback: return as-is
    return phone;
}

/**
 * Get callable number for tel: links
 * Adds country code if needed for mobile
 */
export function getCallableNumber(phone: string): string {
    const cleaned = cleanPhoneNumber(phone);

    // Emergency numbers: use as-is
    if (cleaned.length <= 3) {
        return cleaned;
    }

    // 0800: use as-is
    if (cleaned.startsWith('0800')) {
        return cleaned;
    }

    // Add Brazil country code for full numbers
    if (cleaned.length >= 10 && !cleaned.startsWith('55')) {
        return `+55${cleaned}`;
    }

    return cleaned;
}

/**
 * Generate WhatsApp link
 * @param phone - Phone number (will be cleaned and formatted)
 * @param message - Optional pre-filled message
 */
export function formatWhatsAppLink(phone: string, message?: string): string {
    const cleaned = cleanPhoneNumber(phone);

    // Ensure country code
    const fullNumber = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;

    const baseUrl = `https://wa.me/${fullNumber}`;

    if (message) {
        return `${baseUrl}?text=${encodeURIComponent(message)}`;
    }

    return baseUrl;
}

/**
 * Check if phone number is toll-free (0800)
 */
export function isTollFree(phone: string): boolean {
    return cleanPhoneNumber(phone).startsWith('0800');
}

/**
 * Check if phone number is emergency (3 digits: 190, 192, 193, 199, etc)
 */
export function isEmergencyNumber(phone: string): boolean {
    const cleaned = cleanPhoneNumber(phone);
    return cleaned.length === 3 && cleaned.startsWith('1');
}

/**
 * Format phone number for tel: href
 */
export function getTelLink(phone: string): string {
    return `tel:${getCallableNumber(phone)}`;
}
