import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import Tablelayout from '@/shared/ui/Table/TableLayout';
import type { ColumnProps } from '@/shared/ui/Table/types';
import { reportService } from '@/features/reports/services/reportService';
import { getHttpErrorMessage } from '@/shared/services/httpClient';
import type { ReportFilters, ReportRow } from '@/features/reports/services/reportService';

type ReportTab = 'product-stock' | 'near-expiry' | 'inventory-movements' | 'inventory-transactions';

const tabs: Array<{ key: ReportTab; label: string }> = [
    { key: 'product-stock', label: 'Tồn theo sản phẩm' },
    { key: 'near-expiry', label: 'Gần hết hạn' },
    { key: 'inventory-movements', label: 'Biến động tồn' },
    { key: 'inventory-transactions', label: 'Giao dịch tồn' },
];

function formatValue(value: unknown): string {
    if (value == null || value === '') return '-';
    if (typeof value === 'number') return value.toLocaleString('vi-VN');
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat('vi-VN').format(date);
    }
    return String(value);
}

function titleOf(key: string): string {
    const labels: Record<string, string> = {
        warehouse_id: 'Kho',
        warehouse_code: 'Mã kho',
        warehouse_name: 'Tên kho',
        product_variant_id: 'Variant',
        product_name: 'Sản phẩm',
        variant_name: 'Biến thể',
        sku: 'SKU',
        total_quantity: 'Tổng tồn',
        available_quantity: 'Khả dụng',
        reserved_quantity: 'Đã giữ',
        lot_number: 'Số lô',
        expiry_date: 'Hạn sử dụng',
        days_until_expiry: 'Còn lại',
        location_code: 'Vị trí',
        movement_date: 'Ngày',
        transaction_type: 'Loại giao dịch',
        transaction_count: 'Số giao dịch',
        transaction_code: 'Mã giao dịch',
        quantity: 'Số lượng',
        created_at: 'Thời gian',
    };
    return labels[key] ?? key;
}

function columnsFor(rows: ReportRow[]): ColumnProps<ReportRow>[] {
    const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).filter((key) => key !== 'id').slice(0, 10);
    return keys.map((key) => ({
        key,
        title: titleOf(key),
        className: key === 'sku' || key === 'transaction_code' ? 'font-semibold text-gray-900' : undefined,
        render: (value) => formatValue(value),
    }));
}

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState<ReportTab>('product-stock');
    const [rows, setRows] = useState<ReportRow[]>([]);
    const [filters, setFilters] = useState<ReportFilters>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function loadReport(tab = activeTab, nextFilters = filters) {
        setIsLoading(true);
        setError(null);
        try {
            const loader = {
                'product-stock': reportService.productStock,
                'near-expiry': reportService.nearExpiry,
                'inventory-movements': reportService.inventoryMovements,
                'inventory-transactions': reportService.inventoryTransactions,
            }[tab];
            setRows(await loader(nextFilters));
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, 'Không tải được báo cáo từ backend'));
        } finally {
            setIsLoading(false);
        }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load is mount-only; filters reload via explicit user action.
    useEffect(() => { void loadReport('product-stock', {}); }, []);

    const columns = useMemo(() => columnsFor(rows), [rows]);

    function switchTab(tab: ReportTab) {
        setActiveTab(tab);
        setRows([]);
        void loadReport(tab, filters);
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Báo cáo kho</h1>
                    <p className="text-sm text-gray-500">Tổng hợp tồn kho, hạn dùng và biến động tồn từ các endpoint report backend.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => <button key={tab.key} type="button" onClick={() => switchTab(tab.key)} className={`rounded-md px-3 py-2 text-sm font-medium ${activeTab === tab.key ? 'bg-pink-600 text-white' : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>{tab.label}</button>)}
                </div>
                {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                        <input value={filters.search ?? ''} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Tìm kiếm..." className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                        <input value={filters.warehouseId ?? ''} onChange={(event) => setFilters({ ...filters, warehouseId: event.target.value })} placeholder="Warehouse ID" className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                        <input value={filters.productVariantId ?? ''} onChange={(event) => setFilters({ ...filters, productVariantId: event.target.value })} placeholder="Variant ID" className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                        <input type="date" value={filters.dateFrom ?? ''} onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                        <div className="flex gap-2">
                            <input type="date" value={filters.dateTo ?? ''} onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })} className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            <button type="button" onClick={() => void loadReport()} className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700">Lọc</button>
                        </div>
                    </div>
                </div>
                <Tablelayout columns={columns.length ? columns : [{ key: 'empty', title: 'Dữ liệu' }]} dataSource={rows} rowKey={(record) => String(record.id ?? record.transaction_code ?? JSON.stringify(record))} isLoading={isLoading} />
            </div>
        </DashboardLayout>
    );
}
