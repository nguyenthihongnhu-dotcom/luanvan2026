import { httpClient, unwrapData } from '@/shared/services/httpClient';

export type WarehouseStatus = 'ACTIVE' | 'INACTIVE';

export interface WarehouseOption {
    id: number;
    code: string;
    name: string | null;
    status: WarehouseStatus;
}

export interface Warehouse extends WarehouseOption {
    address_line: string | null;
    ward: string | null;
    district: string | null;
    province: string | null;
    manager_user_id: number | null;
    description: string | null;
    created_at: string;
    updated_at: string;
}

export interface WarehouseInput {
    code: string;
    name: string;
    addressLine?: string;
    ward?: string;
    district?: string;
    province?: string;
    managerUserId?: number;
    status: WarehouseStatus;
    description?: string;
}

export interface WarehouseFilters {
    search?: string;
    status?: WarehouseStatus | '';
}

function buildQuery(filters: WarehouseFilters = {}): string {
    const params = new URLSearchParams();
    if (filters.search?.trim()) params.set('search', filters.search.trim());
    if (filters.status) params.set('status', filters.status);
    const query = params.toString();
    return query ? `?${query}` : '';
}

export async function listWarehouses(filters: WarehouseFilters = { status: 'ACTIVE' }): Promise<Warehouse[]> {
    const response = await httpClient.get<{ data: Warehouse[] }>(`/warehouses${buildQuery(filters)}`);
    return unwrapData(response);
}

export async function createWarehouse(input: WarehouseInput): Promise<void> {
    await httpClient.post('/warehouses', input);
}

export async function updateWarehouse(id: number, input: WarehouseInput): Promise<void> {
    await httpClient.put(`/warehouses/${id}`, input);
}

export async function deleteWarehouse(id: number): Promise<void> {
    await httpClient.delete(`/warehouses/${id}`);
}

export const warehouseService = {
    listWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
};
