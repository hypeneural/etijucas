// ======================================================
// Auth Service - Complete authentication flow
// Phone + Password login, OTP for registration & password reset
// ======================================================

import { apiClient } from '@/api/client';
import { setTokens, clearAuthToken } from '@/api/client';
import { ENDPOINTS } from '@/api/config';
import {
    LoginDTO,
    LoginResponse,
    SendOtpDTO,
    SendOtpResponse,
    VerifyOtpDTO,
    VerifyOtpResponse,
    AuthResponse,
    RegisterDTO,
    RefreshTokenDTO,
    ForgotPasswordDTO,
    ForgotPasswordResponse,
    ResetPasswordDTO,
    ResetPasswordResponse,
    User,
} from '@/types/api.types';

// Token storage keys
const TOKEN_KEY = 'etijucas_token';
const REFRESH_TOKEN_KEY = 'etijucas_refresh_token';

// ======================================================
// Phone Utilities
// ======================================================

/**
 * Format phone number for display (XX) XXXXX-XXXX
 */
export function formatPhone(value: string): string {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length <= 2) {
        return cleaned;
    }
    if (cleaned.length <= 7) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    }
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
}

/**
 * Validate Brazilian phone number
 */
export function validatePhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 11 && cleaned[2] === '9';
}

/**
 * Clean phone number (digits only)
 */
export function cleanPhone(phone: string): string {
    return phone.replace(/\D/g, '');
}

// ======================================================
// Token Management
// ======================================================

export const tokenService = {
    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    },

    getRefreshToken(): string | null {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    },

    setTokens(token: string, refreshToken: string): void {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        // Also update the client tokens
        setTokens(token, refreshToken);
    },

    clearTokens(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        clearAuthToken();
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    },
};

// ======================================================
// Auth Service
// ======================================================

export const authService = {
    /**
     * Login with phone + password
     */
    async login(data: LoginDTO): Promise<LoginResponse> {
        const response = await apiClient.post<LoginResponse>(
            ENDPOINTS.auth.login,
            data
        );

        // Store tokens on successful login
        if (response.token && response.refreshToken) {
            tokenService.setTokens(response.token, response.refreshToken);
        }

        return response;
    },

    /**
     * Send OTP code for registration (verifies phone ownership)
     */
    async sendOtp(data: SendOtpDTO): Promise<SendOtpResponse> {
        const response = await apiClient.post<SendOtpResponse>(
            ENDPOINTS.auth.sendOtp,
            data
        );
        return response;
    },

    /**
     * Resend OTP code (stricter rate limit: 3/min)
     */
    async resendOtp(data: SendOtpDTO): Promise<SendOtpResponse> {
        const response = await apiClient.post<SendOtpResponse>(
            ENDPOINTS.auth.resendOtp,
            data
        );
        return response;
    },

    /**
     * Step 2: Verify OTP code
     * Returns full auth if user exists, or signals registration needed
     */
    async verifyOtp(data: VerifyOtpDTO): Promise<VerifyOtpResponse> {
        const response = await apiClient.post<VerifyOtpResponse>(
            ENDPOINTS.auth.verifyOtp,
            data
        );

        // If user exists, store tokens
        if (response.token && response.refreshToken) {
            tokenService.setTokens(response.token, response.refreshToken);
        }

        return response;
    },

    /**
     * Step 3: Register new user (after OTP verification)
     * Includes city_slug from current tenant context
     */
    async register(data: RegisterDTO): Promise<AuthResponse> {
        // Import tenant store dynamically to avoid circular deps
        const { useTenantStore } = await import('../store/useTenantStore');
        const currentCitySlug = useTenantStore.getState().city?.slug || 'tijucas-sc';

        // Map confirmPassword to password_confirmation for Laravel
        // Use city_slug from tenant context (or fallback)
        const payload = {
            ...data,
            password_confirmation: data.confirmPassword,
            city_slug: data.citySlug || currentCitySlug,
        };

        const response = await apiClient.post<AuthResponse>(
            ENDPOINTS.auth.register,
            payload
        );

        tokenService.setTokens(response.token, response.refreshToken);
        return response;
    },

    /**
     * Refresh expired token
     */
    async refreshToken(): Promise<AuthResponse> {
        const refreshToken = tokenService.getRefreshToken();

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await apiClient.post<AuthResponse>(
            ENDPOINTS.auth.refresh,
            { refreshToken } as RefreshTokenDTO
        );

        tokenService.setTokens(response.token, response.refreshToken);
        return response;
    },

    /**
     * Get current user data
     */
    async getMe(): Promise<User> {
        const response = await apiClient.get<{ data: User }>(ENDPOINTS.auth.me);
        return response.data;
    },

    /**
     * Logout - revoke tokens on server and clear local storage
     */
    async logout(): Promise<void> {
        try {
            await apiClient.post(ENDPOINTS.auth.logout);
        } catch {
            // Ignore logout API errors - clear tokens anyway
        } finally {
            tokenService.clearTokens();
        }
    },

    // ======================================================
    // Password Reset Flow
    // ======================================================

    /**
     * Request password reset - sends OTP to phone
     */
    async forgotPassword(data: ForgotPasswordDTO): Promise<ForgotPasswordResponse> {
        const response = await apiClient.post<ForgotPasswordResponse>(
            ENDPOINTS.auth.forgotPassword,
            data
        );
        return response;
    },

    /**
     * Reset password with OTP code
     */
    async resetPassword(data: ResetPasswordDTO): Promise<ResetPasswordResponse> {
        // Map confirmPassword to password_confirmation for Laravel
        const payload = {
            ...data,
            password_confirmation: data.confirmPassword,
        };

        const response = await apiClient.post<ResetPasswordResponse>(
            ENDPOINTS.auth.resetPassword,
            payload
        );
        return response;
    },

    // ======================================================
    // Passwordless OTP Login (WhatsApp)
    // ======================================================

    /**
     * Request OTP for passwordless login via WhatsApp
     * Returns a session ID (sid) for verification
     */
    async requestOtpLogin(phone: string): Promise<{
        success: boolean;
        sid: string;
        expiresIn: number;
        cooldown: number;
    }> {
        const response = await apiClient.post<{
            success: boolean;
            sid: string;
            expiresIn: number;
            cooldown: number;
        }>('/auth/otp/login', { phone: cleanPhone(phone) });
        return response;
    },

    /**
     * Get session context for magic link (pre-fills phone info)
     */
    async getOtpSession(sid: string): Promise<{
        success: boolean;
        maskedPhone: string;
        expiresIn: number;
        cooldown: number;
        hint: string;
    }> {
        const response = await apiClient.get<{
            success: boolean;
            maskedPhone: string;
            expiresIn: number;
            cooldown: number;
            hint: string;
        }>(`/auth/otp/session/${sid}`);
        return response;
    },

    /**
     * Verify OTP and login (or auto-register)
     * Uses sid + code (no phone required - secure)
     */
    async verifyOtpLogin(sid: string, code: string): Promise<{
        success: boolean;
        next_step: 'home' | 'onboarding';
        isNewUser: boolean;
        token: string;
        refreshToken: string;
        user: User;
        expiresIn: number;
    }> {
        const response = await apiClient.post<{
            success: boolean;
            next_step: 'home' | 'onboarding';
            isNewUser: boolean;
            token: string;
            refreshToken: string;
            user: User;
            expiresIn: number;
        }>('/auth/otp/verify', { sid, code });

        // Store tokens on successful verification
        if (response.token && response.refreshToken) {
            tokenService.setTokens(response.token, response.refreshToken);
        }

        return response;
    },

    /**
     * Complete user profile after passwordless login
     */
    async completeProfile(data: {
        nome: string;
        bairroId?: string;
        termsAccepted: boolean;
    }): Promise<{
        success: boolean;
        next_step: 'home';
        user: User;
    }> {
        const response = await apiClient.post<{
            success: boolean;
            next_step: 'home';
            user: User;
        }>('/auth/profile/complete', {
            nome: data.nome,
            bairro_id: data.bairroId,
            terms_accepted: data.termsAccepted,
        });
        return response;
    },

    /**
     * Verify magic link token for instant login
     * Called when user clicks "Login Fácil" button in WhatsApp
     */
    async verifyMagicLink(token: string): Promise<{
        success: boolean;
        token: string;
        refreshToken: string;
        user: User;
    }> {
        const response = await apiClient.post<{
            success: boolean;
            token: string;
            refreshToken: string;
            user: User;
        }>('/auth/magic-link/verify', { token });

        // Store tokens on successful verification
        if (response.token && response.refreshToken) {
            tokenService.setTokens(response.token, response.refreshToken);
        }

        return response;
    },
};

export default authService;
