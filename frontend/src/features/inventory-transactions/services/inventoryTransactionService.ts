import { httpClient, unwrapData } from '@/shared/services/httpClient';

export interface InventoryTransaction {
    id: number;
    transaction_code: string;
    transaction_type: string;
    warehouse_id: number;
    product_variant_id: number;
    batch_id: number | null;
    source_location_id: number | null;
    destination_location_id: number | null;
    quantity: string | number;
    quantity_before: string | number | null;
    quantity_after: string | number | null;
    reference_type: string | null;
    reference_id: number | null;
    reason_code: string | null;
    note: string | null;
    performed_by: number;
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
