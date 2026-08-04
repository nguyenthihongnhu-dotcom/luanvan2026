import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import Tablelayout from '@/shared/ui/Table/TableLayout';
import type { ColumnProps } from '@/shared/ui/Table/types';
import { transactionService } from '@/features/transactions/services/transactionService';
import type { TransactionDetail, TransactionDetailLine } from '@/features/transactions/services/transactionService';
import type { Transaction } from '@/features/transactions/hooks/useTransactions';
import { getHttpErrorMessage } from '@/shared/services/httpClient';

type DetailRouteType = 'receipts' | 'issues' | 'adjustments';

function routeTypeToTransactionType(type: DetailRouteType | undefined): Transaction['loai'] {
    if (type === 'receipts') return 'NHAP';
    if (type === 'issues') return 'XUAT';
    return 'DIEU_CHINH';
}

function titleOf(type: Transaction['loai']): string {
    if (type === 'NHAP') return 'Chi tiết phiếu nhập';
    if (type === 'XUAT') return 'Chi tiết phiếu xuất';
    return 'Chi tiết phiếu điều chỉnh';
}

function formatValue(value: unknown): string {
    if (value == null || value === '') return '-';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat('vi-VN').format(date);
    }
    if (typeof value === 'number') return value.toLocaleString('vi-VN');
    return String(value);
}

function formatHeaderValue(key: string, value: unknown, header: Record<string, unknown>): string {
    if (key === 'status') {
        const statusStr = String(value ?? '').toUpperCase();
        const statusMap: Record<string, string> = {
            DRAFT: 'Nháp',
            PENDING: 'Chờ xử lý',
            PENDING_APPROVAL: 'Chờ duyệt',
            CONFIRMED: 'Đã xác nhận',
            APPROVED: 'Đã duyệt',
            REJECTED: 'Đã từ chối',
            CANCELLED: 'Đã hủy',
            REVERSED: 'Đã đảo phiếu',
            COMPLETED: 'Hoàn tất',
        };
        return statusMap[statusStr] ?? String(value ?? '-');
    }

    if (key === 'created_by') {
        return String(header.created_by_name ?? (value ? `#${String(value)}` : '-'));
    }

    if (key === 'confirmed_by') {
        return String(header.confirmed_by_name ?? (value ? `#${String(value)}` : '-'));
    }

    if (key === 'approved_by') {
        return String(header.approved_by_name ?? (value ? `#${String(value)}` : '-'));
    }

    return formatValue(value);
}

function headerLabel(key: string): string {
    const labels: Record<string, string> = {
        receipt_code: 'Số phiếu nhập',
        issue_code: 'Số phiếu xuất',
        adjustment_code: 'Số phiếu điều chỉnh',
        warehouse_code: 'Mã kho',
        warehouse_name: 'Tên kho',
        supplier_name: 'Nhà cung cấp',
        status: 'Trạng thái',
        reference_no: 'Mã tham chiếu',
        reason_code: 'Lý do',
        note: 'Ghi chú',
        created_by: 'Người tạo',
        confirmed_by: 'Người xác nhận',
        approved_by: 'Người duyệt',
        created_at: 'Ngày tạo',
        confirmed_at: 'Ngày xác nhận',
        approved_at: 'Ngày duyệt',
    };
    return labels[key] ?? key;
}

export default function TransactionDetailPage() {
    const params = useParams<{ type: DetailRouteType; id: string }>();
    const location = useLocation();
    const routeType = params.type ?? (location.pathname.startsWith('/receipts') ? 'receipts' : location.pathname.startsWith('/issues') ? 'issues' : 'adjustments');
    const transactionType = routeTypeToTransactionType(routeType);
    const id = Number(params.id);
    const [detail, setDetail] = useState<TransactionDetail | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        async function loadDetail() {
            if (!Number.isInteger(id) || id <= 0) {
                setError('Mã chứng từ không hợp lệ.');
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const result = await transactionService.getTransactionDetail(transactionType, id);
                if (isMounted) setDetail(result);
            } catch (err) {
                console.error(err);
                if (isMounted) setError(getHttpErrorMessage(err, 'Không tải được chi tiết chứng từ từ backend'));
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }
        void loadDetail();
        return () => { isMounted = false; };
    }, [id, transactionType]);

    const headerEntries = useMemo(() => {
        if (!detail) return [];
        const keys = ['receipt_code', 'issue_code', 'adjustment_code', 'warehouse_code', 'warehouse_name', 'supplier_name', 'status', 'reference_no', 'reason_code', 'note', 'created_by', 'confirmed_by', 'approved_by', 'created_at', 'confirmed_at', 'approved_at'];
        return keys
            .filter((key) => Object.prototype.hasOwnProperty.call(detail.header, key))
            .map((key) => ({ key, value: detail.header[key] }));
    }, [detail]);

    const columns: ColumnProps<TransactionDetailLine>[] = [
        { key: 'sku', title: 'SKU', className: 'font-semibold text-gray-900', render: (value) => formatValue(value) },
        { key: 'product_name', title: 'Sản phẩm', render: (_, record) => [record.product_name, record.variant_name].filter(Boolean).join(' - ') || '-' },
        { key: 'lot_number', title: 'Lô', render: (value) => formatValue(value) },
        { key: 'expiry_date', title: 'Hạn dùng', render: (value) => formatValue(value) },
        { key: 'location_code', title: 'Vị trí', render: (value) => formatValue(value) },
        { key: 'quantity', title: 'Số lượng', render: (value) => Number(value ?? 0).toLocaleString('vi-VN') },
        { key: 'unit_cost', title: 'Đơn giá', render: (value) => formatValue(value) },
        { key: 'adjustment_direction', title: 'Hướng', render: (value) => value === 'IN' ? 'Tăng' : value === 'OUT' ? 'Giảm' : '-' },
        { key: 'note', title: 'Ghi chú', render: (value) => formatValue(value) },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">{titleOf(transactionType)}</h1>
                        <p className="text-sm text-gray-500">Header và dòng hàng được tải trực tiếp từ backend theo ID chứng từ.</p>
                    </div>
                    <Link to="/transactions" className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Quay lại giao dịch</Link>
                </div>

                {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
                {isLoading && <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">Đang tải chi tiết chứng từ...</div>}

                {detail && (
                    <>
                        <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-3">
                            {headerEntries.map((entry) => (
                                <div key={entry.key}>
                                    <div className="text-xs font-semibold uppercase text-gray-500">{headerLabel(entry.key)}</div>
                                    <div className="mt-1 text-sm font-medium text-gray-900">{formatHeaderValue(entry.key, entry.value, detail.header)}</div>
                                </div>
                            ))}
                        </div>
                        <Tablelayout columns={columns} dataSource={detail.items} rowKey="id" />
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
