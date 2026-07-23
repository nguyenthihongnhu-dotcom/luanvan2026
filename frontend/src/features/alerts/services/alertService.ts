import { httpClient, unwrapData } from '@/shared/services/httpClient';

export type AlertType = 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVER_MAX_STOCK' | 'NEAR_EXPIRY' | 'EXPIRED' | 'LOCATION_NEAR_FULL' | 'COUNT_VARIANCE' | 'ABNORMAL_ADJUSTMENT' | 'SECURITY';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'READ' | 'RESOLVED';

export interface InventoryAlert {
    id: number;
    alert_type: AlertType;
    severity: AlertSeverity;
    warehouse_id: number | null;
    product_variant_id: number | null;
    batch_id: number | null;
    location_id: number | null;
    title: string;
    message: string;
    status: AlertStatus;
    assigned_to: number | null;
    resolved_by: number | null;
    resolved_at: string | null;
    created_at: string;
}

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

export interface AlertFilters {
    search?: string;
    status?: AlertStatus | '';
}

export interface NotificationFilters {
    search?: string;
}

function buildQuery(filters: Record<string, string | undefined>): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
        if (value?.trim()) params.set(key, value.trim());
    }
    const query = params.toString();
    return query ? `?${query}` : '';
}

const listAlerts = async (filters: AlertFilters = {}): Promise<InventoryAlert[]> => {
    const response = await httpClient.get<{ data: InventoryAlert[] }>(`/alerts${buildQuery({ search: filters.search, status: filters.status || undefined })}`);
    return unwrapData(response);
};

const generateAlerts = async (): Promise<{ createdCount: number }> => {
    const response = await httpClient.post<{ data: { createdCount: number } }>('/alerts/generate');
    return unwrapData(response);
};

const markAlertRead = async (id: number): Promise<void> => {
    await httpClient.patch(`/alerts/${id}/read`);
};

const resolveAlert = async (id: number): Promise<void> => {
    await httpClient.patch(`/alerts/${id}/resolve`);
};

const listNotifications = async (filters: NotificationFilters = {}): Promise<NotificationItem[]> => {
    const response = await httpClient.get<{ data: NotificationItem[] }>(`/notifications${buildQuery({ search: filters.search })}`);
    return unwrapData(response);
};

const generateNotifications = async (): Promise<{ createdCount: number }> => {
    const response = await httpClient.post<{ data: { createdCount: number } }>('/notifications/generate');
    return unwrapData(response);
};

const markNotificationRead = async (id: number): Promise<void> => {
    await httpClient.patch(`/notifications/${id}/read`);
};

export {
    generateAlerts,
    generateNotifications,
    listAlerts,
    listNotifications,
    markAlertRead,
    markNotificationRead,
    resolveAlert,
};

export const alertService = {
    listAlerts,
    generateAlerts,
    markAlertRead,
    resolveAlert,
    listNotifications,
    generateNotifications,
    markNotificationRead,
};