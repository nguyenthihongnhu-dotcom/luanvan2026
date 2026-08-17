import { httpClient, unwrapData } from '@/shared/services/httpClient';

export type WarehouseStatus = 'ACTIVE' | 'INACTIVE';

export interface WarehouseOption {
    id: number;
    code: string;
    name: string | null;
    status: WarehouseStatus;
    /**
     * Người đang đăng nhập có phụ trách kho này không. Danh sách vẫn trả về đủ mọi
     * kho để đổi id thành tên (phiếu cũ có thể trỏ tới kho khác), nên chỗ nào cho
     * chọn kho để thao tác thì phải lọc theo cờ này.
     */
    inScope: boolean;
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

type WarehouseRow = Omit<Warehouse, 'inScope'> & { in_scope?: boolean };

export async function listWarehouses(filters: WarehouseFilters = { status: 'ACTIVE' }): Promise<Warehouse[]> {
    const response = await httpClient.get<{ data: WarehouseRow[] }>(`/warehouses${buildQuery(filters)}`);
    // Backend cũ chưa gửi in_scope thì coi như được phép, để bản frontend mới không
    // khoá sạch dropdown khi hai bên chưa deploy cùng lúc.
    return unwrapData(response).map((row) => ({ ...row, inScope: row.in_scope !== false }));
}

/** Chỉ những kho người dùng được phép thao tác — dùng cho dropdown chọn kho. */
export function selectableWarehouses<T extends { inScope: boolean }>(warehouses: T[]): T[] {
    return warehouses.filter((warehouse) => warehouse.inScope);
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
    selectableWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
};
