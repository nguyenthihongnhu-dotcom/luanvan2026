import { httpClient, unwrapData } from '@/shared/services/httpClient';
import type { Transaction } from '@/features/transactions/hooks/useTransactions';
import { warehouseService } from '@/features/warehouses/services/warehouseService';
import type { WarehouseOption } from '@/features/warehouses/services/warehouseService';

type BackendRow = Record<string, unknown>;

export type AllocationStrategy = 'FEFO' | 'FIFO';

export interface AllocationPreviewItem {
    stockLocationId: number;
    productVariantId: number;
    locationId: number;
    locationCode: string;
    batchId: number | null;
    lotNumber: string | null;
    expiryDate: string | null;
    receivedDate: string | null;
    quantity: number;
}

export interface AllocationPreviewResult {
    strategy: AllocationStrategy;
    requestedQuantity: number;
    allocatedQuantity: number;
    items: AllocationPreviewItem[];
}

type BackendReceipt = BackendRow & {
    id?: number;
    receipt_code?: string;
    status?: string;
    created_at?: string;
    created_by?: string | number;
    supplier_id?: string | number;
};

type BackendIssue = BackendRow & {
    id?: number;
    issue_code?: string;
    status?: string;
    created_at?: string;
    created_by?: string | number;
    external_reference?: string;
};

type BackendAdjustment = BackendRow & {
    id?: number;
    adjustment_code?: string;
    status?: string;
    created_at?: string;
    created_by?: string | number;
    approved_by?: string | number;
    reason_code?: string;
};

function dateOnly(value: unknown): string {
    return typeof value === 'string' ? value.slice(0, 10) : '';
}

function getUserDisplayName(nameVal: unknown, idVal: unknown): string {
    if (typeof nameVal === 'string' && nameVal.trim()) {
        return nameVal.trim();
    }
    const id = Number(idVal);
    if (id === 1) return 'Quản trị hệ thống';
    if (id === 2) return 'Quản lý kho Bambi';
    if (id === 3) return 'Nhân viên PHS';
    return id > 0 ? `Người dùng #${id}` : 'Hệ thống';
}

function toTransaction(row: BackendReceipt, type: 'NHAP'): Transaction;
function toTransaction(row: BackendIssue, type: 'XUAT'): Transaction;
function toTransaction(row: BackendAdjustment, type: 'DIEU_CHINH'): Transaction;
function toTransaction(row: BackendReceipt | BackendIssue | BackendAdjustment, type: Transaction['loai']): Transaction {
    const code = type === 'NHAP'
        ? (row as BackendReceipt).receipt_code
        : type === 'XUAT'
            ? (row as BackendIssue).issue_code
            : (row as BackendAdjustment).adjustment_code;

    const createdByName = getUserDisplayName(row.created_by_name, row.created_by);
    const approvedByName = getUserDisplayName(row.approved_by_name || row.confirmed_by_name, row.approved_by || row.confirmed_by);

    return {
        id: Number(row.id ?? 0),
        soPhieu: code ?? `${type}-${row.id ?? ''}`,
        loai: type,
        ngay: dateOnly(row.created_at),
        status: String(row.status ?? ''),
        nguoiTao: createdByName,
        maNCC: type === 'NHAP' ? String((row as BackendReceipt).supplier_id ?? '') : undefined,
        maDonHangThamChieu: type === 'XUAT' ? (row as BackendIssue).external_reference : undefined,
        lyDo: type === 'DIEU_CHINH' ? (row as BackendAdjustment).reason_code : undefined,
        nguoiPheDuyet: approvedByName,
    };
}

export async function listTransactions(): Promise<Transaction[]> {
    const [receiptsResponse, issuesResponse, adjustmentsResponse] = await Promise.all([
        httpClient.get<{ data: BackendReceipt[] }>('/goods-receipts'),
        httpClient.get<{ data: BackendIssue[] }>('/goods-issues'),
        httpClient.get<{ data: BackendAdjustment[] }>('/stock-adjustments'),
    ]);

    return [
        ...unwrapData(receiptsResponse).map(row => toTransaction(row, 'NHAP')),
        ...unwrapData(issuesResponse).map(row => toTransaction(row, 'XUAT')),
        ...unwrapData(adjustmentsResponse).map(row => toTransaction(row, 'DIEU_CHINH')),
    ].sort((a, b) => b.ngay.localeCompare(a.ngay));
}

function mapItems(input: Transaction) {
    return (input.items ?? []).map((item) => ({
        productVariantId: Number(item.productVariantId),
        batchId: item.batchId ? Number(item.batchId) : undefined,
        locationId: Number(item.locationId),
        quantity: Number(item.quantity),
        adjustmentDirection: item.adjustmentDirection,
        reasonCode: input.lyDo || undefined,
        note: item.note || undefined,
    }));
}

export async function createTransaction(input: Transaction): Promise<void> {
    if (input.loai === 'NHAP') {
        await httpClient.post('/goods-receipts', {
            receiptCode: input.soPhieu,
            supplierId: input.maNCC ? Number(input.maNCC) : undefined,
            referenceNo: input.maDonHangThamChieu || undefined,
            note: input.lyDo || undefined,
            items: mapItems(input),
        });
        return;
    }

    if (input.loai === 'XUAT') {
        await httpClient.post('/goods-issues', {
            issueCode: input.soPhieu,
            referenceNo: input.maDonHangThamChieu || undefined,
            note: input.lyDo || undefined,
            items: mapItems(input),
        });
        return;
    }

    await httpClient.post('/stock-adjustments', {
        adjustmentCode: input.soPhieu,
        reasonCode: input.lyDo || 'DIEU_CHINH_THU_CONG',
        note: input.lyDo || undefined,
        items: mapItems(input),
    });
}

export async function confirmTransaction(input: Transaction): Promise<void> {
    if (input.loai === 'NHAP') {
        await httpClient.post(`/goods-receipts/${input.id}/confirm`);
        return;
    }

    if (input.loai === 'XUAT') {
        await httpClient.post(`/goods-issues/${input.id}/confirm`, { strategy: 'FEFO' });
    }
}

export async function reverseTransaction(input: Transaction): Promise<void> {
    if (input.loai === 'NHAP') {
        await httpClient.post(`/goods-receipts/${input.id}/reverse`);
        return;
    }

    if (input.loai === 'XUAT') {
        await httpClient.post(`/goods-issues/${input.id}/reverse`);
    }
}

export async function approveAdjustment(id: number): Promise<void> {
    await httpClient.post(`/stock-adjustments/${id}/approve`);
}

export async function rejectAdjustment(id: number, rejectionReason: string): Promise<void> {
    await httpClient.post(`/stock-adjustments/${id}/reject`, { rejectionReason });
}

export async function cancelAdjustment(id: number): Promise<void> {
    await httpClient.post(`/stock-adjustments/${id}/cancel`);
}

export async function listWarehouses(): Promise<WarehouseOption[]> {
    return warehouseService.listWarehouses();
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


export interface TransactionDetailLine {
    id: number;
    product_variant_id: number;
    sku?: string | null;
    product_name?: string | null;
    variant_name?: string | null;
    batch_id?: number | null;
    lot_number?: string | null;
    expiry_date?: string | null;
    location_id?: number | null;
    location_code?: string | null;
    quantity: string | number;
    unit_cost?: string | number | null;
    adjustment_direction?: string | null;
    reason_code?: string | null;
    note?: string | null;
}

export interface TransactionDetail {
    type: Transaction['loai'];
    header: Record<string, unknown>;
    items: TransactionDetailLine[];
}

export async function getTransactionDetail(type: Transaction['loai'], id: number): Promise<TransactionDetail> {
    const path = type === 'NHAP'
        ? `/goods-receipts/${id}`
        : type === 'XUAT'
            ? `/goods-issues/${id}`
            : `/stock-adjustments/${id}`;
    const response = await httpClient.get<{ data: { header: Record<string, unknown>; items: TransactionDetailLine[] } }>(path);
    const detail = unwrapData(response);
    return { type, header: detail.header, items: detail.items };
}

export const transactionService = {
    listTransactions,
    createTransaction,
    confirmTransaction,
    reverseTransaction,
    approveAdjustment,
    rejectAdjustment,
    cancelAdjustment,
    listWarehouses,
    previewAllocation,
    getTransactionDetail,
};
