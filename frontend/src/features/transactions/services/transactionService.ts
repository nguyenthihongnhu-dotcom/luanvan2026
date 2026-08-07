import { httpClient, unwrapData } from '@/shared/services/httpClient';
import { toDisplayDate, withCurrentTime } from '@/shared/utils/datetime';
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
    received_at?: string | null;
    created_by?: string | number;
    supplier_id?: string | number;
};

type BackendIssue = BackendRow & {
    id?: number;
    issue_code?: string;
    status?: string;
    created_at?: string;
    issued_at?: string | null;
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


function getUserDisplayName(nameVal: unknown, idVal: unknown): string {
    if (typeof nameVal === 'string' && nameVal.trim()) {
        return nameVal.trim();
    }
    const id = Number(idVal);
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
        // Ưu tiên mốc người dùng khai trên phiếu; phiếu cũ chưa có thì lùi về
        // thời điểm bản ghi được tạo.
        ngay: toDisplayDate(
            type === 'NHAP'
                ? (row as BackendReceipt).received_at ?? row.created_at
                : type === 'XUAT'
                    ? (row as BackendIssue).issued_at ?? row.created_at
                    : row.created_at,
        ),
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

/**
 * Một dòng trên form có thể thành hai dòng gửi lên backend. Bảng
 * stock_adjustment_items mỗi dòng chỉ mang một vị trí và một hướng tăng/giảm,
 * nên việc chuyển hàng sang ô khác được diễn đạt bằng cặp: giảm ở ô cũ, tăng ở
 * ô mới — cùng nằm trong một phiếu nên duyệt một lần là áp dụng cả hai.
 */
function mapItems(input: Transaction) {
    const isAdjustment = input.loai === 'DIEU_CHINH';

    return (input.items ?? []).flatMap((item) => {
        const base = {
            productVariantId: Number(item.productVariantId),
            batchId: item.batchId ? Number(item.batchId) : undefined,
            reasonCode: input.lyDo || undefined,
            note: item.note || undefined,
        };

        if (isAdjustment && (item.adjustmentMode === 'LOCATION' || item.adjustmentMode === 'BOTH')) {
            const movedOut = Number(item.quantity);
            // Chuyển nguyên số thì số vào ô mới bằng số rời ô cũ; sai cả số thì
            // lấy số đếm được ở ô mới.
            const movedIn = item.adjustmentMode === 'BOTH' ? Number(item.targetQuantity) : movedOut;

            return [
                { ...base, locationId: Number(item.locationId), adjustmentDirection: 'OUT' as const, quantity: movedOut },
                { ...base, locationId: Number(item.targetLocationId), adjustmentDirection: 'IN' as const, quantity: movedIn },
            ];
        }

        return [{
            ...base,
            locationId: Number(item.locationId),
            quantity: Number(item.quantity),
            adjustmentDirection: item.adjustmentDirection,
        }];
    });
}

export async function createTransaction(input: Transaction): Promise<void> {
    // Ô "Ngày thực hiện" chỉ chọn được ngày, phần giờ lấy theo đồng hồ lúc lưu.
    const performedAt = withCurrentTime(input.ngay);

    if (input.loai === 'NHAP') {
        await httpClient.post('/goods-receipts', {
            receiptCode: input.soPhieu || undefined,
            supplierId: input.maNCC ? Number(input.maNCC) : undefined,
            referenceNo: input.maDonHangThamChieu || undefined,
            receivedAt: performedAt,
            note: input.lyDo || undefined,
            items: mapItems(input),
        });
        return;
    }

    if (input.loai === 'XUAT') {
        await httpClient.post('/goods-issues', {
            issueCode: input.soPhieu || undefined,
            referenceNo: input.maDonHangThamChieu || undefined,
            issuedAt: performedAt,
            note: input.lyDo || undefined,
            items: mapItems(input),
        });
        return;
    }

    // stock_adjustments chưa có cột thời điểm thực hiện nên phiếu điều chỉnh vẫn
    // chỉ có created_at do MySQL sinh.
    await httpClient.post('/stock-adjustments', {
        adjustmentCode: input.soPhieu || undefined,
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

/** Một dòng tồn thực tế: đã gắn sẵn ô lưu trữ và lô, dùng để chọn nhanh khi điều chỉnh. */
export interface CurrentStockRow {
    warehouseId: number;
    productVariantId: number;
    locationId: number;
    locationCode: string;
    batchId: number | null;
    lotNumber: string | null;
    quantity: number;
}

type BackendCurrentStock = BackendRow & {
    warehouse_id?: number;
    product_variant_id?: number;
    location_id?: number;
    location_code?: string;
    batch_id?: number | null;
    lot_number?: string | null;
    quantity?: string | number;
};

/**
 * Tồn hiện có theo từng ô lưu trữ và lô. Lấy đủ cả dòng tồn bằng 0 (khác với
 * màn chuyển kho vốn chỉ quan tâm hàng còn khả dụng), vì điều chỉnh tăng vẫn
 * cần cộng vào một dòng đang trống.
 */
export async function listCurrentStock(): Promise<CurrentStockRow[]> {
    const response = await httpClient.get<{ data: BackendCurrentStock[] }>('/stock/current');

    return unwrapData(response).map((row) => ({
        warehouseId: Number(row.warehouse_id ?? 0),
        productVariantId: Number(row.product_variant_id ?? 0),
        locationId: Number(row.location_id ?? 0),
        locationCode: String(row.location_code ?? ''),
        batchId: row.batch_id == null ? null : Number(row.batch_id),
        lotNumber: row.lot_number ?? null,
        quantity: Number(row.quantity ?? 0),
    }));
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
    listCurrentStock,
    previewAllocation,
    getTransactionDetail,
};
