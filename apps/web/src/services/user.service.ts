import { apiClient } from '@/api/client';
import { API_CONFIG, ENDPOINTS } from '@/api/config';
import { tokenService } from '@/services/auth.service';
import { getTenantHeaders } from '@/api/client';
import {
    User,
    UpdateUserDTO,
    UpdatePasswordDTO,
    UpdateNotificationsDTO,
    NotificationSettings,
    UploadResponse,
} from '@/types/api.types';

export const userService = {
    /**
     * Get current user profile
     */
    async getProfile(): Promise<User> {
        const response = await apiClient.get<{ data: User }>(ENDPOINTS.users.me);
        return response.data;
    },

    /**
     * Update user profile
     */
    async updateProfile(data: UpdateUserDTO): Promise<User> {
        const response = await apiClient.put<{ data: User }>(ENDPOINTS.users.update, data);
        return response.data;
    },

    /**
     * Upload avatar image
     * Uses FormData with direct fetch for file upload
     */
    async uploadAvatar(file: File): Promise<UploadResponse> {
        const formData = new FormData();
        formData.append('file', file);

        const token = tokenService.getToken();
        const url = `${API_CONFIG.baseURL}${ENDPOINTS.users.avatar}`;
        const tenantHeaders = getTenantHeaders();

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...tenantHeaders,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Falha no upload da imagem');
        }

        const data = await response.json() as UploadResponse;
        return data;
    },

    /**
     * Remove avatar
     */
    async removeAvatar(): Promise<void> {
        await apiClient.delete(ENDPOINTS.users.avatar);
    },

    /**
     * Change password (requires current password)
     */
    async changePassword(data: UpdatePasswordDTO): Promise<void> {
        await apiClient.put(ENDPOINTS.users.password, data);
    },

    /**
     * Update notification settings
     */
    async updateNotifications(data: UpdateNotificationsDTO): Promise<NotificationSettings> {
        const response = await apiClient.put<{ data: NotificationSettings }>(
            ENDPOINTS.users.notifications,
            data
        );
        return response.data;
    },
};

export default userService;
