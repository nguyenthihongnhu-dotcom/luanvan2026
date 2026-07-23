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

export interface PermissionItem {
    id: number;
    code: string;
    name: string;
    module: string;
    description: string | null;
}

export async function listAuthorization(search = ''): Promise<AuthorizationRole[]> {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    const response = await httpClient.get<{ data: AuthorizationRole[] }>(`/authorization${params.toString() ? `?${params.toString()}` : ''}`);
    return unwrapData(response);
}

export async function listAllPermissions(): Promise<PermissionItem[]> {
    const response = await httpClient.get<{ data: PermissionItem[] }>('/authorization/permissions');
    return unwrapData(response);
}

export async function updateRolePermissions(roleId: number, permissionCodes: string[]): Promise<{ success: boolean }> {
    const response = await httpClient.put<{ data: { success: boolean } }>(`/authorization/roles/${roleId}/permissions`, {
        permissionCodes,
    });
    return unwrapData(response);
}

export const authorizationService = {
    listAuthorization,
    listAllPermissions,
    updateRolePermissions,
};

