import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import Tablelayout from '@/shared/ui/Table/TableLayout';
import { useDateFormatter } from '@/shared/hooks';
import { useSidebar } from '@/app/providers/useSidebar';
import type { ColumnProps } from '@/shared/ui/Table/types';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import type { Transaction } from '@/features/transactions/hooks/useTransactions';
import TransactionModal from '@/features/transactions/components/TransactionModal';
import TransactionDetailModal from '@/features/transactions/components/TransactionDetailModal';
import { usePermissions } from '@/shared/auth/usePermissions';

const transactionTypeOptions: Array<Transaction['loai']> = ['NHAP', 'XUAT', 'DIEU_CHINH'];

function getTransactionTypeLabel(type: Transaction['loai']): string {
    if (type === 'NHAP') return 'Nhập kho';
    if (type === 'XUAT') return 'Xuất kho';
    return 'Điều chỉnh';
}

function getTransactionStatusLabel(status: string): string {
    const labels: Record<string, string> = {
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
    return labels[status.trim().toUpperCase()] ?? status;
}

function detailPath(record: Transaction): string {
    if (record.loai === 'NHAP') return `/receipts/${record.id}`;
    if (record.loai === 'XUAT') return `/issues/${record.id}`;
    return `/adjustments/${record.id}`;
}

function exportTransactionsCsv(rows: Transaction[], formatDate: (value: string) => string): void {
    const headers = ['Số phiếu', 'Loại giao dịch', 'Ngày thực hiện', 'Trạng thái', 'Người tạo', 'Nhà cung cấp', 'Mã tham chiếu', 'Lý do'];
    const csvRows = rows.map((item) => [
        item.soPhieu,
        getTransactionTypeLabel(item.loai),
        formatDate(item.ngay),
        getTransactionStatusLabel(item.status),
        item.nguoiTao,
        item.maNCC ?? '',
        item.maDonHangThamChieu ?? '',
        item.lyDo ?? '',
    ]);
    const csv = [headers, ...csvRows]
        .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
        .join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao-cao-giao-dich-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

export default function Transactions() {
    const { setExtraContent } = useSidebar();
    const { formatDate } = useDateFormatter();
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = useState('');
    const {
        data,
        isLoading,
        error,
        showModal,
        setShowModal,
        editingTransaction,
        typeFilter,
        setTypeFilter,
        showDetailModal,
        setShowDetailModal,
        selectedTransaction,
        formData,
        handleInputChange,
        handleSubmit,
        handleAddClick,
        handleConfirmTransaction,
        handleReverseTransaction,
        handleApproveAdjustment,
        handleRejectAdjustment,
        handleCancelAdjustment,
        items,
        warehouses,
        selectedWarehouseId,
        setSelectedWarehouseId,
        handleAddItemRow,
        handleRemoveItemRow,
        handleItemChange,
        allocationStrategy,
        setAllocationStrategy,
        allocationPreview,
        previewingItemIndex,
        handlePreviewAllocation,
    } = useTransactions();

    useEffect(() => {
        setExtraContent(
            <div className="space-y-4">
                <label className="block text-xs font-semibold uppercase text-gray-500">Loại giao dịch</label>
                <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm text-gray-600">
                        <input type="radio" name="transType" checked={typeFilter === 'All'} onChange={() => setTypeFilter('All')} className="text-pink-600 focus:ring-pink-500" />
                        <span>Tất cả</span>
                    </label>
                    {transactionTypeOptions.map((type) => (
                        <label key={type} className="flex items-center space-x-2 text-sm text-gray-600">
                            <input type="radio" name="transType" checked={typeFilter === type} onChange={() => setTypeFilter(type)} className="text-pink-600 focus:ring-pink-500" />
                            <span>{getTransactionTypeLabel(type)}</span>
                        </label>
                    ))}
                </div>
            </div>,
        );
        return () => setExtraContent(null);
    }, [setExtraContent, setTypeFilter, typeFilter]);

    const columns: ColumnProps<Transaction>[] = [
        { key: 'soPhieu', title: 'Số phiếu', className: 'font-semibold text-gray-900' },
        {
            key: 'loai',
            title: 'Loại giao dịch',
            render: (val) => {
                const transactionType = val as Transaction['loai'];
                const colors = {
                    NHAP: 'border-blue-200 bg-blue-50 text-blue-700',
                    XUAT: 'border-purple-200 bg-purple-50 text-purple-700',
                    DIEU_CHINH: 'border-orange-200 bg-orange-50 text-orange-700',
                };
                return <span className={`rounded border px-2 py-0.5 text-xs font-medium ${colors[transactionType]}`}>{getTransactionTypeLabel(transactionType)}</span>;
            },
        },
        { key: 'ngay', title: 'Ngày thực hiện', render: (value) => formatDate(value as string) },
        { key: 'status', title: 'Trạng thái', render: (value) => getTransactionStatusLabel(String(value ?? '')) },
        { key: 'nguoiTao', title: 'Người tạo' },
        {
            key: 'actions',
            title: 'Thao tác',
            render: (_, record) => {
                const status = record.status.toUpperCase();
                const canConfirm =
                    (record.loai === 'NHAP' && ['DRAFT', 'MOI_TAO', 'PENDING'].includes(status) && hasPermission('goods_receipts:confirm')) ||
                    (record.loai === 'XUAT' && ['DRAFT', 'MOI_TAO', 'PENDING'].includes(status) && hasPermission('goods_issues:confirm'));
                const canReverse =
                    status === 'CONFIRMED' &&
                    ((record.loai === 'NHAP' && hasPermission('goods_receipts:reverse')) ||
                        (record.loai === 'XUAT' && hasPermission('goods_issues:reverse')));
                const canApproveAdjustment = record.loai === 'DIEU_CHINH' && ['PENDING_APPROVAL', 'SUBMITTED', 'PENDING'].includes(status) && hasPermission('stock_adjustments:approve');
                const canRejectAdjustment = record.loai === 'DIEU_CHINH' && ['PENDING_APPROVAL', 'SUBMITTED', 'PENDING'].includes(status) && hasPermission('stock_adjustments:reject');
                const canCancelAdjustment = record.loai === 'DIEU_CHINH' && ['DRAFT', 'MOI_TAO', 'PENDING_APPROVAL', 'PENDING'].includes(status) && hasPermission('stock_adjustments:cancel');

                return (
                    <div className="flex flex-wrap gap-2">
                        <Link to={detailPath(record)} className="text-xs font-medium text-pink-600 hover:text-pink-800">Chi tiết</Link>
                        {canConfirm && <button type="button" onClick={() => handleConfirmTransaction(record)} className="text-xs font-medium text-green-700 hover:text-green-900">Xác nhận</button>}
                        {canReverse && <button type="button" onClick={() => handleReverseTransaction(record)} className="text-xs font-medium text-red-600 hover:text-red-900">Đảo phiếu</button>}
                        {canApproveAdjustment && <button type="button" onClick={() => handleApproveAdjustment(record)} className="text-xs font-medium text-green-700 hover:text-green-900">Duyệt</button>}
                        {canRejectAdjustment && <button type="button" onClick={() => handleRejectAdjustment(record)} className="text-xs font-medium text-red-600 hover:text-red-900">Từ chối</button>}
                        {canCancelAdjustment && <button type="button" onClick={() => handleCancelAdjustment(record)} className="text-xs font-medium text-gray-600 hover:text-gray-900">Hủy</button>}
                    </div>
                );
            },
        },
    ];

    const normalizedSearch = searchTerm.toLowerCase();
    const filteredData = data.filter((item) => {
        const matchesType = typeFilter === 'All' || item.loai === typeFilter;
        const haystack = [
            item.soPhieu,
            getTransactionTypeLabel(item.loai),
            getTransactionStatusLabel(item.status),
            item.nguoiTao,
            item.maNCC,
            item.maDonHangThamChieu,
            item.lyDo,
        ].join(' ').toLowerCase();
        return matchesType && (normalizedSearch === '' || haystack.includes(normalizedSearch));
    });

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-800">Lịch sử giao dịch kho</h1>
                    <div className="flex space-x-2">
                        <button type="button" onClick={() => exportTransactionsCsv(filteredData, formatDate)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Xuất báo cáo</button>
                        <button type="button" onClick={handleAddClick} className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-pink-700">+ Thêm giao dịch</button>
                    </div>
                </div>

                {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <input type="text" placeholder="Tìm kiếm mã phiếu, người tạo, nhà cung cấp..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500 md:w-1/3" />
                </div>

                <Tablelayout columns={columns} dataSource={filteredData} rowKey={(record) => `${record.loai}-${record.id}`} isLoading={isLoading} />
            </div>

            {showModal && createPortal(
                <TransactionModal
                    editingTransaction={editingTransaction}
                    formData={formData}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmit}
                    onClose={() => setShowModal(false)}
                    items={items}
                    warehouses={warehouses}
                    selectedWarehouseId={selectedWarehouseId}
                    setSelectedWarehouseId={setSelectedWarehouseId}
                    handleAddItemRow={handleAddItemRow}
                    handleRemoveItemRow={handleRemoveItemRow}
                    handleItemChange={handleItemChange}
                    allocationStrategy={allocationStrategy}
                    setAllocationStrategy={setAllocationStrategy}
                    allocationPreview={allocationPreview}
                    previewingItemIndex={previewingItemIndex}
                    handlePreviewAllocation={handlePreviewAllocation}
                />,
                document.body,
            )}

            {showDetailModal && selectedTransaction && createPortal(
                <TransactionDetailModal selectedTransaction={selectedTransaction} onClose={() => setShowDetailModal(false)} />,
                document.body,
            )}
        </DashboardLayout>
    );
}
