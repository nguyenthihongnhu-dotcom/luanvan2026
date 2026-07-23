import { httpClient, unwrapData } from '@/shared/services/httpClient';

export type TransferStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface StockTransfer {
    id: number;
    transfer_code: string;
    source_warehouse_id: number;
    destination_warehouse_id: number;
    status: TransferStatus;
    note: string | null;
    created_by: number;
    confirmed_by: number | null;
    confirmed_at: string | null;
    cancelled_by: number | null;
    cancelled_at: string | null;
    created_at: string;
}

export interface CurrentStockItem {
    stock_location_id: number;
    warehouse_id: number;
    warehouse_code: string;
    warehouse_name: string;
    zone_code: string;
    shelf_code: string;
    location_id: number;
    location_code: string;
    product_id: number;
    product_name: string;
    product_variant_id: number;
    sku: string;
    variant_name: string;
    batch_id: number | null;
    lot_number: string | null;
    expiry_date: string | null;
    quantity: string | number;
    reserved_quantity: string | number;
    available_quantity: string | number;
}

export interface WarehouseLocationOption {
    id: number;
    code: string;
    name: string | null;
    warehouse_id: number;
    warehouse_code: string;
    warehouse_name: string;
    zone_code: string;
    shelf_code: string;
    layer_no: number;
}

export interface CreateTransferInput {
    transferCode?: string;
    sourceWarehouseId?: number;
    destinationWarehouseId?: number;
    note?: string;
    items: Array<{
        productVariantId: number;
        batchId?: number | null;
        sourceLocationId: number;
        destinationLocationId: number;
        quantity: number;
        note?: string;
    }>;
}

type LocationRow = WarehouseLocationOption & {
    current_quantity?: string | number;
};

export async function listTransfers(): Promise<StockTransfer[]> {
    const response = await httpClient.get<{ data: StockTransfer[] }>('/stock-transfers');
    return unwrapData(response);
}

export async function listCurrentStock(): Promise<CurrentStockItem[]> {
    const response = await httpClient.get<{ data: CurrentStockItem[] }>('/stock/current');
    return unwrapData(response).filter((item) => Number(item.available_quantity ?? 0) > 0);
}

export async function listLocationOptions(): Promise<WarehouseLocationOption[]> {
    const response = await httpClient.get<{ data: LocationRow[] }>('/locations');
    return unwrapData(response).map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        warehouse_id: row.warehouse_id,
        warehouse_code: row.warehouse_code,
        warehouse_name: row.warehouse_name,
        zone_code: row.zone_code,
        shelf_code: row.shelf_code,
        layer_no: row.layer_no,
    }));
}

export async function createTransfer(input: CreateTransferInput): Promise<void> {
    await httpClient.post('/stock-transfers', input);
}

export async function confirmTransfer(id: number): Promise<void> {
    await httpClient.post(`/stock-transfers/${id}/confirm`);
}

export async function reverseTransfer(id: number): Promise<void> {
    await httpClient.post(`/stock-transfers/${id}/reverse`);
}

export const transferService = {
    listTransfers,
    listCurrentStock,
    listLocationOptions,
    createTransfer,
    confirmTransfer,
    reverseTransfer,
};