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
     */
    async register(data: RegisterDTO): Promise<AuthResponse> {
        // Map confirmPassword to password_confirmation for Laravel
        const payload = {
            ...data,
            password_confirmation: data.confirmPassword,
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
};

export default authService;
