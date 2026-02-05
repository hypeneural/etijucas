import { normalizePlate } from "./plate";

const WHATSAPP_NUMBER = "5548999999999"; // Replace with actual Titico number if available in env
// Using a placeholder number for now or we could grab from a config

/**
 * Generates a WhatsApp link for debit consultation.
 */
export function getConsultationLink(plate: string): string {
    const cleanPlate = normalizePlate(plate);
    const text = `Olá Titico! Quero consultar débitos da placa *${cleanPlate}*. Pode me ajudar?`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates a WhatsApp link when the plate is not found or API fails.
 */
export function getNotFoundLink(plate?: string): string {
    const cleanPlate = plate ? normalizePlate(plate) : "";
    const text = cleanPlate
        ? `Olá Titico! O app não achou a placa *${cleanPlate}*. Pode verificar pra mim?`
        : `Olá Titico! Preciso de ajuda para consultar um veículo.`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates a WhatsApp link for sharing a specific due date/card (Viral Feature).
 */
export function getShareLink(plate: string, cardDescription: string): string {
    // This is for sharing directly to a contact, generally uses 'text' but user picks contact
    // "whatsapp://send" works on mobile for picking contact
    const cleanPlate = normalizePlate(plate);
    const text = `🚨 *IPVA SC 2026* 🚨\n\nVeículo Placa: *${cleanPlate}*\n${cardDescription}\n\nConsulte agora com o Despachante Titico!`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
