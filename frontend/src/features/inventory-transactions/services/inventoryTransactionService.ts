import { httpClient, unwrapData } from '@/shared/services/httpClient';

export interface InventoryTransaction {
    id: number;
    transaction_code: string;
    transaction_type: string;
    warehouse_id: number;
    warehouse_code?: string | null;
    warehouse_name?: string | null;
    product_variant_id: number;
    sku?: string | null;
    product_name?: string | null;
    variant_name?: string | null;
    batch_id: number | null;
    source_location_id: number | null;
    source_location_code?: string | null;
    destination_location_id: number | null;
    destination_location_code?: string | null;
    quantity: string | number;
    quantity_before: string | number | null;
    quantity_after: string | number | null;
    reference_type: string | null;
    reference_id: number | null;
    reason_code: string | null;
    note: string | null;
    performed_by: number;
    performed_by_name?: string | null;
    approved_by: number | null;
    created_at: string;
}

export async function listInventoryTransactions(search = ''): Promise<InventoryTransaction[]> {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    const response = await httpClient.get<{ data: InventoryTransaction[] }>(`/inventory-transactions${params.toString() ? `?${params.toString()}` : ''}`);
    return unwrapData(response);
}

export const inventoryTransactionService = { listInventoryTransactions };
