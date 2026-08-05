import { httpClient, unwrapData } from '@/shared/services/httpClient';

export type StockCountStatus = 'DRAFT' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
export type StockCountScopeType = 'WAREHOUSE' | 'ZONE' | 'SHELF' | 'LOCATION' | 'SKU' | 'CATEGORY';

export interface StockCount {
    id: number;
    count_code: string;
    warehouse_id: number;
    scope_type: StockCountScopeType;
    scope_reference_id: number | null;
    status: StockCountStatus;
    assigned_to: number | null;
    assigned_to_name?: string | null;
    created_by: number;
    created_by_name?: string | null;
    note?: string | null;
    created_at?: string;
}

export interface StockCountItem {
    id: number;
    stock_count_id: number;
    product_variant_id: number;
    sku?: string | null;
    product_name?: string | null;
    variant_name?: string | null;
    batch_id: number | null;
    lot_number?: string | null;
    location_id: number;
    location_code?: string | null;
    system_quantity: string | number;
    actual_quantity: string | number | null;
    difference_quantity: string | number | null;
    reason_code: string | null;
    note: string | null;
}

export interface CreateStockCountInput {
    warehouseId: number;
    scopeType: StockCountScopeType;
    scopeReferenceId?: number;
    assignedTo?: number;
    note?: string;
}

export interface RecordCountInput {
    actualQuantity: number;
    reasonCode?: string;
    note?: string;
}

export async function listStockCounts(): Promise<StockCount[]> {
    const response = await httpClient.get<{ data: StockCount[] }>('/stock-counts');
    return unwrapData(response);
}

export async function listStockCountItems(stockCountId: number): Promise<StockCountItem[]> {
    const response = await httpClient.get<{ data: StockCountItem[] }>(`/stock-counts/${stockCountId}/items`);
    return unwrapData(response);
}

export async function createStockCount(input: CreateStockCountInput): Promise<void> {
    await httpClient.post('/stock-counts', input);
}

export async function startStockCount(id: number): Promise<void> {
    await httpClient.post(`/stock-counts/${id}/start`);
}

export async function recordStockCountItem(stockCountId: number, itemId: number, input: RecordCountInput): Promise<void> {
    await httpClient.patch(`/stock-counts/${stockCountId}/items/${itemId}/count`, input);
}

export async function submitStockCount(id: number): Promise<void> {
    await httpClient.post(`/stock-counts/${id}/submit`);
}

export async function approveStockCount(id: number): Promise<void> {
    await httpClient.post(`/stock-counts/${id}/approve`);
}

export const stockCountService = {
    listStockCounts,
    listStockCountItems,
    createStockCount,
    startStockCount,
    recordStockCountItem,
    submitStockCount,
    approveStockCount,
};