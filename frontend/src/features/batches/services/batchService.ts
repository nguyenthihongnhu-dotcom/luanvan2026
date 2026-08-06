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
    /** Lọc theo SKU: dùng để kiểm tra trùng số lô mà không phụ thuộc bộ lọc đang hiển thị. */
    productVariantId?: number;
}

function buildQuery(filters: BatchFilters): string {
    const params = new URLSearchParams();
    if (filters.search?.trim()) params.set('search', filters.search.trim());
    if (filters.status) params.set('status', filters.status);
    if (filters.productVariantId) params.set('productVariantId', String(filters.productVariantId));
    const query = params.toString();
    return query ? `?${query}` : '';
}

export interface UpdateBatchPayload {
    supplierId?: number | null;
    manufactureDate?: string | null;
    expiryDate?: string | null;
    notes?: string | null;
    status?: 'ACTIVE' | 'BLOCKED';
}

export interface CreateBatchPayload {
    productVariantId: number;
    supplierId?: number | null;
    lotNumber: string;
    manufactureDate?: string | null;
    expiryDate?: string | null;
    notes?: string | null;
}

export async function listBatches(filters: BatchFilters = {}): Promise<ProductBatch[]> {
    const response = await httpClient.get<{ data: ProductBatch[] }>(`/batches${buildQuery(filters)}`);
    return unwrapData(response);
}

export interface CreateBatchResult {
    id: number;
    /** false nghĩa là số lô đã tồn tại và backend đã cập nhật lô cũ thay vì tạo mới. */
    created: boolean;
}

export async function createBatch(payload: CreateBatchPayload): Promise<CreateBatchResult> {
    const response = await httpClient.post<{ data: CreateBatchResult }>('/batches', payload);
    return unwrapData(response);
}

export async function updateBatch(id: number, payload: UpdateBatchPayload): Promise<void> {
    await httpClient.put(`/batches/${id}`, payload);
}

export async function deleteBatch(id: number): Promise<void> {
    await httpClient.delete(`/batches/${id}`);
}

export const batchService = {
    listBatches,
    createBatch,
    updateBatch,
    deleteBatch,
};