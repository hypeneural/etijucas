/**
 * AuthPage
 *
 * Unified authentication page - single entry point for login/registration.
 * Uses WhatsApp OTP as the primary (and only) authentication method.
 *
 * Flow:
 * 1. Phone Input → OTP sent via WhatsApp
 * 2. OTP Verification
 * 3. Success → Redirect to Home or Onboarding (for new users)
 *
 * Features:
 * - Passwordless authentication via WhatsApp
 * - Auto-registration for new users
 * - Magic link support via ?sid= query param
 * - Clipboard OTP detection
 * - Premium animated UI
 *
 * @see WhatsAppLoginPage for the full implementation
 */

// Re-export WhatsAppLoginPage as AuthPage
// This provides a unified authentication entry point
export { default } from './WhatsAppLoginPage';
