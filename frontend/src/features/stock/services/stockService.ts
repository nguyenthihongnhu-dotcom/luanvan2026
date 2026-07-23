import { httpClient, unwrapData } from '@/shared/services/httpClient';
import type { AllocationPreviewResult, AllocationStrategy } from '@/features/transactions/services/transactionService';

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
    barcode: string | null;
    variant_name: string;
    batch_id: number | null;
    lot_number: string | null;
    expiry_date: string | null;
    quantity: string | number;
    reserved_quantity: string | number;
    available_quantity: string | number;
    updated_at: string;
}

export interface NearExpiryStockItem {
    warehouse_id: number;
    warehouse_code: string;
    product_variant_id: number;
    sku: string;
    product_name: string;
    batch_id: number;
    lot_number: string;
    expiry_date: string;
    days_until_expiry: number;
    location_code: string;
    quantity: string | number;
    available_quantity: string | number;
}

export interface StockFilters {
    warehouseId?: number;
    productVariantId?: number;
}

function buildQuery(filters: StockFilters): string {
    const params = new URLSearchParams();
    if (filters.warehouseId) params.set('warehouseId', String(filters.warehouseId));
    if (filters.productVariantId) params.set('productVariantId', String(filters.productVariantId));
    const query = params.toString();
    return query ? `?${query}` : '';
}

export async function listCurrentStock(filters: StockFilters = {}): Promise<CurrentStockItem[]> {
    const response = await httpClient.get<{ data: CurrentStockItem[] }>(`/stock/current${buildQuery(filters)}`);
    return unwrapData(response);
}

export async function listNearExpiryStock(filters: Pick<StockFilters, 'warehouseId'> = {}): Promise<NearExpiryStockItem[]> {
    const query = buildQuery(filters);
    const response = await httpClient.get<{ data: NearExpiryStockItem[] }>(`/stock/near-expiry${query}`);
    return unwrapData(response);
}

export async function previewAllocation(input: {
    warehouseId: number;
    productVariantId: number;
    quantity: number;
    strategy: AllocationStrategy;
}): Promise<AllocationPreviewResult> {
    const params = new URLSearchParams({
        warehouseId: String(input.warehouseId),
        productVariantId: String(input.productVariantId),
        quantity: String(input.quantity),
        strategy: input.strategy,
    });
    const response = await httpClient.get<{ data: AllocationPreviewResult }>(`/stock/allocation?${params.toString()}`);
    return unwrapData(response);
}

export const stockService = {
    listCurrentStock,
    listNearExpiryStock,
    previewAllocation,
};