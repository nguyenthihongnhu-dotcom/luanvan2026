import { httpClient, unwrapData } from '@/shared/services/httpClient';

export type BatchStatus = 'ACTIVE' | 'NEAR_EXPIRY' | 'EXPIRED' | 'BLOCKED' | 'DEPLETED';

export interface ProductBatch {
    id: number;
    product_variant_id: number;
    supplier_id: number | null;
    lot_number: string;
    manufacture_date: string | null;
    expiry_date: string | null;
    received_date: string | null;
    status: BatchStatus;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface BatchFilters {
    search?: string;
    status?: BatchStatus | '';
}

function buildQuery(filters: BatchFilters): string {
    const params = new URLSearchParams();
    if (filters.search?.trim()) params.set('search', filters.search.trim());
    if (filters.status) params.set('status', filters.status);
    const query = params.toString();
    return query ? `?${query}` : '';
}

export async function listBatches(filters: BatchFilters = {}): Promise<ProductBatch[]> {
    const response = await httpClient.get<{ data: ProductBatch[] }>(`/batches${buildQuery(filters)}`);
    return unwrapData(response);
}

export const batchService = {
    listBatches,
};