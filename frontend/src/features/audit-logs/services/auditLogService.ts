import { httpClient, unwrapData } from '@/shared/services/httpClient';

export interface AuditLog {
    id: number;
    request_id: string | null;
    user_id: number | null;
    action: string;
    module: string;
    entity_type: string | null;
    entity_id: number | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
}

export async function listAuditLogs(search = ''): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    const response = await httpClient.get<{ data: AuditLog[] }>(`/audit-logs${params.toString() ? `?${params.toString()}` : ''}`);
    return unwrapData(response);
}

export const auditLogService = { listAuditLogs };
