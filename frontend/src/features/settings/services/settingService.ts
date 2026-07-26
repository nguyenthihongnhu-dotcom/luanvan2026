import { httpClient, unwrapData } from '@/shared/services/httpClient';

export interface AppSetting {
    id: number;
    setting_key: string;
    setting_value: unknown;
    description: string | null;
    updated_by: number | null;
    updated_at: string;
}

export interface UpdateSettingInput {
    settingValue: unknown;
    description?: string;
}

export interface SettingMutationResult {
    affectedRows: number;
}

export async function listSettings(search = ''): Promise<AppSetting[]> {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    const response = await httpClient.get<{ data: AppSetting[] }>(`/settings${params.toString() ? `?${params.toString()}` : ''}`);
    return unwrapData(response);
}

export async function seedDefaultSettings(): Promise<SettingMutationResult> {
    const response = await httpClient.post<{ data: SettingMutationResult }>('/settings/seed-defaults');
    return unwrapData(response);
}

export async function updateSetting(id: number, input: UpdateSettingInput): Promise<void> {
    await httpClient.put(`/settings/${id}`, input);
}

export const settingService = { listSettings, seedDefaultSettings, updateSetting };