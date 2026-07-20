import { httpClient, unwrapData } from '@/shared/services/httpClient';
import type { Transaction } from '@/features/transactions/hooks/useTransactions';

type BackendRow = Record<string, unknown>;

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

function toTransaction(row: BackendReceipt, type: 'NHAP'): Transaction;
function toTransaction(row: BackendIssue, type: 'XUAT'): Transaction;
function toTransaction(row: BackendAdjustment, type: 'DIEU_CHINH'): Transaction;
function toTransaction(row: BackendReceipt | BackendIssue | BackendAdjustment, type: Transaction['loai']): Transaction {
    const code = type === 'NHAP'
        ? (row as BackendReceipt).receipt_code
        : type === 'XUAT'
            ? (row as BackendIssue).issue_code
            : (row as BackendAdjustment).adjustment_code;

    return {
        id: Number(row.id ?? 0),
        soPhieu: code ?? `${type}-${row.id ?? ''}`,
        loai: type,
        ngay: dateOnly(row.created_at),
        status: String(row.status ?? ''),
        nguoiTao: String(row.created_by ?? ''),
        maNCC: type === 'NHAP' ? String((row as BackendReceipt).supplier_id ?? '') : undefined,
        maDonHangThamChieu: type === 'XUAT' ? (row as BackendIssue).external_reference : undefined,
        lyDo: type === 'DIEU_CHINH' ? (row as BackendAdjustment).reason_code : undefined,
        nguoiPheDuyet: type === 'DIEU_CHINH' ? String((row as BackendAdjustment).approved_by ?? '') : undefined,
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

export const transactionService = {
    listTransactions,
};
