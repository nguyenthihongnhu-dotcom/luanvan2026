import { httpClient, unwrapData } from '@/shared/services/httpClient';

export interface NotificationItem {
    id: number;
    user_id: number;
    type: string;
    title: string;
    message: string;
    reference_type: string | null;
    reference_id: number | null;
    is_read: 0 | 1 | boolean;
    read_at: string | null;
    created_at: string;
}

export async function listNotifications(search = ''): Promise<NotificationItem[]> {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    const response = await httpClient.get<{ data: NotificationItem[] }>(
        `/notifications${params.toString() ? `?${params.toString()}` : ''}`,
    );
    return unwrapData(response);
}

export async function markNotificationAsRead(id: number): Promise<{ affectedRows: number }> {
    const response = await httpClient.patch<{ data: { affectedRows: number } }>(
        `/notifications/${id}/read`,
    );
    return unwrapData(response);
}

export async function markAllNotificationsAsRead(): Promise<{ affectedRows: number }> {
    const response = await httpClient.post<{ data: { affectedRows: number } }>(
        '/notifications/read-all',
    );
    return unwrapData(response);
}

export async function generateNotifications(): Promise<{ createdCount: number }> {
    const response = await httpClient.post<{ data: { createdCount: number } }>(
        '/notifications/generate',
    );
    return unwrapData(response);
}

export const notificationService = {
    listNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    generateNotifications,
};
