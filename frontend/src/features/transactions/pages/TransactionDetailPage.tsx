import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import Tablelayout from '@/shared/ui/Table/TableLayout';
import type { ColumnProps } from '@/shared/ui/Table/types';
import { transactionService } from '@/features/transactions/services/transactionService';
import type { TransactionDetail, TransactionDetailLine } from '@/features/transactions/services/transactionService';
import type { Transaction } from '@/features/transactions/hooks/useTransactions';
import { getHttpErrorMessage } from '@/shared/services/httpClient';
import { usePermissions } from '@/shared/auth/usePermissions';

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

function getUserDisplayName(nameVal: unknown, idVal: unknown): string {
    if (typeof nameVal === 'string' && nameVal.trim()) {
        return nameVal.trim();
    }
    const id = Number(idVal);
    if (id === 1) return 'Quản trị hệ thống';
    if (id === 2) return 'Quản lý kho Bambi';
    if (id === 3) return 'Nhân viên PHS';
    return id > 0 ? `Người dùng #${id}` : '-';
}

function formatHeaderValue(key: string, value: unknown, header: Record<string, unknown>): string {
    if (key === 'status') {
        const statusStr = String(value ?? '').toUpperCase();
        const statusMap: Record<string, string> = {
            DRAFT: 'Nháp',
            MOI_TAO: 'Mới tạo',
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
        return getUserDisplayName(header.created_by_name, value);
    }

    if (key === 'confirmed_by') {
        return getUserDisplayName(header.confirmed_by_name, value);
    }

    if (key === 'approved_by') {
        return getUserDisplayName(header.approved_by_name, value);
    }

    if (key === 'rejected_by') {
        return getUserDisplayName(header.rejected_by_name, value);
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
        rejected_by: 'Người từ chối',
        created_at: 'Ngày tạo',
        confirmed_at: 'Ngày xác nhận',
        approved_at: 'Ngày duyệt',
    };
    return labels[key] ?? key;
}

export default function TransactionDetailPage() {
    const params = useParams<{ type: DetailRouteType; id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const routeType = params.type ?? (location.pathname.startsWith('/receipts') ? 'receipts' : location.pathname.startsWith('/issues') ? 'issues' : 'adjustments');
    const transactionType = routeTypeToTransactionType(routeType);
    const id = Number(params.id);
    const [detail, setDetail] = useState<TransactionDetail | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    async function loadDetail() {
        if (!Number.isInteger(id) || id <= 0) {
            setError('Mã chứng từ không hợp lệ.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const result = await transactionService.getTransactionDetail(transactionType, id);
            setDetail(result);
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, 'Không tải được chi tiết chứng từ từ backend'));
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        void loadDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, transactionType]);

    const headerEntries = useMemo(() => {
        if (!detail) return [];
        const keys = ['receipt_code', 'issue_code', 'adjustment_code', 'warehouse_code', 'warehouse_name', 'supplier_name', 'status', 'reference_no', 'reason_code', 'note', 'created_by', 'confirmed_by', 'approved_by', 'rejected_by', 'created_at', 'confirmed_at', 'approved_at'];
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

    // Status action handlers
    const currentStatus = String(detail?.header.status ?? '').toUpperCase();
    const canConfirm = (transactionType === 'NHAP' && ['DRAFT', 'MOI_TAO', 'PENDING'].includes(currentStatus) && hasPermission('goods_receipts:confirm')) ||
        (transactionType === 'XUAT' && ['DRAFT', 'MOI_TAO', 'PENDING'].includes(currentStatus) && hasPermission('goods_issues:confirm'));
    const canReverse = currentStatus === 'CONFIRMED' &&
        ((transactionType === 'NHAP' && hasPermission('goods_receipts:reverse')) ||
            (transactionType === 'XUAT' && hasPermission('goods_issues:reverse')));
    const canApproveAdjustment = transactionType === 'DIEU_CHINH' && ['DRAFT', 'PENDING'].includes(currentStatus) && hasPermission('stock_adjustments:approve');
    const canRejectAdjustment = transactionType === 'DIEU_CHINH' && ['DRAFT', 'PENDING'].includes(currentStatus) && hasPermission('stock_adjustments:reject');
    const canCancelAdjustment = transactionType === 'DIEU_CHINH' && ['DRAFT', 'PENDING'].includes(currentStatus) && hasPermission('stock_adjustments:cancel');

    async function handleConfirm() {
        if (!window.confirm('Xác nhận chứng từ này và cập nhật tồn kho?')) return;
        setIsActionLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const mockTx: Transaction = {
                id,
                soPhieu: String(detail?.header.receipt_code ?? detail?.header.issue_code ?? id),
                loai: transactionType,
                ngay: '',
                status: currentStatus,
                nguoiTao: '',
            };
            await transactionService.confirmTransaction(mockTx);
            setSuccessMessage('Đã xác nhận chứng từ thành công.');
            await loadDetail();
        } catch (err) {
            setError(getHttpErrorMessage(err, 'Không xác nhận được chứng từ.'));
        } finally {
            setIsActionLoading(false);
        }
    }

    async function handleReverse() {
        if (!window.confirm('Đảo phiếu chứng từ này?')) return;
        setIsActionLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const mockTx: Transaction = {
                id,
                soPhieu: String(detail?.header.receipt_code ?? detail?.header.issue_code ?? id),
                loai: transactionType,
                ngay: '',
                status: currentStatus,
                nguoiTao: '',
            };
            await transactionService.reverseTransaction(mockTx);
            setSuccessMessage('Đã đảo phiếu chứng từ thành công.');
            await loadDetail();
        } catch (err) {
            setError(getHttpErrorMessage(err, 'Không đảo được chứng từ.'));
        } finally {
            setIsActionLoading(false);
        }
    }

    async function handleApprove() {
        if (!window.confirm('Duyệt phiếu điều chỉnh tồn kho này?')) return;
        setIsActionLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await transactionService.approveAdjustment(id);
            setSuccessMessage('Đã duyệt phiếu điều chỉnh tồn kho thành công.');
            await loadDetail();
        } catch (err) {
            setError(getHttpErrorMessage(err, 'Không duyệt được phiếu điều chỉnh.'));
        } finally {
            setIsActionLoading(false);
        }
    }

    async function handleReject() {
        const reason = window.prompt('Nhập lý do từ chối phiếu điều chỉnh:');
        if (!reason) return;
        setIsActionLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await transactionService.rejectAdjustment(id, reason);
            setSuccessMessage('Đã từ chối phiếu điều chỉnh.');
            await loadDetail();
        } catch (err) {
            setError(getHttpErrorMessage(err, 'Không từ chối được phiếu điều chỉnh.'));
        } finally {
            setIsActionLoading(false);
        }
    }

    async function handleCancel() {
        if (!window.confirm('Hủy phiếu điều chỉnh này?')) return;
        setIsActionLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await transactionService.cancelAdjustment(id);
            setSuccessMessage('Đã hủy phiếu điều chỉnh.');
            await loadDetail();
        } catch (err) {
            setError(getHttpErrorMessage(err, 'Không hủy được phiếu điều chỉnh.'));
        } finally {
            setIsActionLoading(false);
        }
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">{titleOf(transactionType)}</h1>
                        <p className="text-sm text-gray-500">Xem thông tin chi tiết và cập nhật trạng thái duyệt chứng từ.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {canApproveAdjustment && (
                            <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => void handleApprove()}
                                className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                                {isActionLoading ? 'Đang xử lý...' : '✓ Duyệt phiếu'}
                            </button>
                        )}
                        {canRejectAdjustment && (
                            <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => void handleReject()}
                                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                                ✕ Từ chối
                            </button>
                        )}
                        {canCancelAdjustment && (
                            <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => void handleCancel()}
                                className="rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                            >
                                Hủy phiếu
                            </button>
                        )}
                        {canConfirm && (
                            <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => void handleConfirm()}
                                className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                                {isActionLoading ? 'Đang xử lý...' : '✓ Xác nhận chứng từ'}
                            </button>
                        )}
                        {canReverse && (
                            <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => void handleReverse()}
                                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                                ↺ Đảo phiếu
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => navigate('/transactions')}
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Quay lại giao dịch
                        </button>
                    </div>
                </div>

                {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
                {successMessage && <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">{successMessage}</div>}
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
