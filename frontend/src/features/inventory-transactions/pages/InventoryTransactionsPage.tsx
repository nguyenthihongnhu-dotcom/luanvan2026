import { useEffect, useState } from 'react';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import Tablelayout from '@/shared/ui/Table/TableLayout';
import type { ColumnProps } from '@/shared/ui/Table/types';
import { inventoryTransactionService } from '@/features/inventory-transactions/services/inventoryTransactionService';
import type { InventoryTransaction } from '@/features/inventory-transactions/services/inventoryTransactionService';

function formatNumber(value: unknown): string {
    return Number(value ?? 0).toLocaleString('vi-VN');
}

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function typeLabel(type: string): string {
    const labels: Record<string, string> = {
        RECEIPT: 'Nhập kho',
        ISSUE: 'Xuất kho',
        TRANSFER_OUT: 'Chuyển đi',
        TRANSFER_IN: 'Chuyển đến',
        COUNT_ADJUSTMENT_IN: 'Kiểm kê tăng',
        COUNT_ADJUSTMENT_OUT: 'Kiểm kê giảm',
        MANUAL_ADJUSTMENT_IN: 'Điều chỉnh tăng',
        MANUAL_ADJUSTMENT_OUT: 'Điều chỉnh giảm',
        RETURN_IN: 'Trả nhập',
        RETURN_OUT: 'Trả xuất',
        INITIAL_STOCK: 'Tồn đầu kỳ',
        REVERSAL: 'Hoàn tác',
    };
    return labels[type] ?? type;
}

export default function InventoryTransactionsPage() {
    const [rows, setRows] = useState<InventoryTransaction[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function loadRows(search = searchTerm) {
        setIsLoading(true);
        setError(null);
        try {
            setRows(await inventoryTransactionService.listInventoryTransactions(search));
        } catch (err) {
            console.error(err);
            setError('Không tải được log giao dịch tồn kho từ backend.');
        } finally {
            setIsLoading(false);
        }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load is mount-only; filters reload via explicit user action.
    useEffect(() => { void loadRows(''); }, []);

    const columns: ColumnProps<InventoryTransaction>[] = [
        { key: 'transaction_code', title: 'Mã giao dịch', className: 'font-semibold text-gray-900' },
        { key: 'transaction_type', title: 'Loại', render: (value) => typeLabel(String(value)) },
        { key: 'warehouse_id', title: 'Kho', render: (value) => `#${String(value)}` },
        { key: 'product_variant_id', title: 'Variant', render: (value) => `#${String(value)}` },
        { key: 'source_location_id', title: 'Vị trí nguồn', render: (value) => value ? `#${String(value)}` : '-' },
        { key: 'destination_location_id', title: 'Vị trí đích', render: (value) => value ? `#${String(value)}` : '-' },
        { key: 'quantity', title: 'Số lượng', render: (value) => formatNumber(value) },
        { key: 'reference_type', title: 'Tham chiếu', render: (_, record) => record.reference_type ? `${record.reference_type} #${record.reference_id ?? '-'}` : '-' },
        { key: 'performed_by', title: 'Người thực hiện', render: (value) => `#${String(value)}` },
        { key: 'created_at', title: 'Thời gian', render: (value) => formatDateTime(String(value)) },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Log giao dịch tồn kho</h1>
                    <p className="text-sm text-gray-500">Theo dõi mọi biến động tồn phát sinh từ nhập, xuất, chuyển kho, kiểm kê và điều chỉnh.</p>
                </div>
                {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-2 md:flex-row">
                        <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm theo mã giao dịch hoặc loại tham chiếu..." className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                        <button type="button" onClick={() => void loadRows()} className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700">Lọc</button>
                    </div>
                </div>
                <Tablelayout columns={columns} dataSource={rows} rowKey="id" isLoading={isLoading} />
            </div>
        </DashboardLayout>
    );
}
