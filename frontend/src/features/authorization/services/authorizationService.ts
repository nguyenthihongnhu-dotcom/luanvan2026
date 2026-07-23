import { httpClient, unwrapData } from '@/shared/services/httpClient';

export interface AuthorizationRole {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_system: 0 | 1 | boolean;
    created_at: string;
    permissions: string | null;
}

export async function listAuthorization(search = ''): Promise<AuthorizationRole[]> {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    const response = await httpClient.get<{ data: AuthorizationRole[] }>(`/authorization${params.toString() ? `?${params.toString()}` : ''}`);
    return unwrapData(response);
}

export const authorizationService = { listAuthorization };
