import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/layouts/dashboard/DashboardLayout";
import Tablelayout from "@/shared/ui/Table/TableLayout";
import type { ColumnProps } from "@/shared/ui/Table/types";
import { batchService } from "@/features/batches/services/batchService";
import { getHttpErrorMessage } from "@/shared/services/httpClient";
import type { BatchStatus, ProductBatch } from "@/features/batches/services/batchService";
import { partnerService, type Partner } from "@/features/partners/services/partnerService";
import { transferService, type CurrentStockItem } from "@/features/transfers/services/transferService";

const statusOptions: Array<{ value: BatchStatus | ""; label: string }> = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "ACTIVE", label: "Đang hoạt động" },
    { value: "NEAR_EXPIRY", label: "Gần hết hạn" },
    { value: "EXPIRED", label: "Đã hết hạn" },
    { value: "BLOCKED", label: "Đã khóa" },
    { value: "DEPLETED", label: "Đã hết tồn" },
];

function statusLabel(status: BatchStatus): string {
    const labels: Record<BatchStatus, string> = {
        ACTIVE: "Đang hoạt động",
        NEAR_EXPIRY: "Gần hết hạn",
        EXPIRED: "Đã hết hạn",
        BLOCKED: "Đã khóa",
        DEPLETED: "Đã hết tồn",
    };
    return labels[status] ?? status;
}

function statusClass(status: BatchStatus): string {
    const classes: Record<BatchStatus, string> = {
        ACTIVE: "border-green-200 bg-green-50 text-green-700",
        NEAR_EXPIRY: "border-yellow-200 bg-yellow-50 text-yellow-800",
        EXPIRED: "border-red-200 bg-red-50 text-red-700",
        BLOCKED: "border-gray-300 bg-gray-100 text-gray-700",
        DEPLETED: "border-slate-300 bg-slate-50 text-slate-700",
    };
    return classes[status] ?? "border-gray-200 bg-gray-50 text-gray-700";
}

function formatDate(value: string | null): string {
    if (!value) return "Không có";
    return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
}

function daysUntil(value: string | null): number | null {
    if (!value) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(value);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
}

function expiryLabel(value: string | null): string {
    const days = daysUntil(value);
    if (days == null) return "Không theo dõi";
    if (days < 0) return `Quá hạn ${Math.abs(days).toLocaleString("vi-VN")} ngày`;
    if (days === 0) return "Hết hạn hôm nay";
    return `Còn ${days.toLocaleString("vi-VN")} ngày`;
}

export default function BatchesPage() {
    const [batches, setBatches] = useState<ProductBatch[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [stockItems, setStockItems] = useState<CurrentStockItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<BatchStatus | "">("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function loadBatches(nextSearch = searchTerm, nextStatus = statusFilter) {
        setIsLoading(true);
        setError(null);
        try {
            const [batchList, partnerList, stockList] = await Promise.all([
                batchService.listBatches({ search: nextSearch, status: nextStatus }),
                partnerService.listPartners().catch(() => []),
                transferService.listCurrentStock().catch(() => []),
            ]);
            setBatches(batchList);
            setPartners(partnerList);
            setStockItems(stockList);
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không tải được danh sách lô hàng từ backend"));
        } finally {
            setIsLoading(false);
        }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load is mount-only; filters reload via explicit user action.
    useEffect(() => { void loadBatches("", ""); }, []);

    const supplierMap = useMemo(() => {
        const map = new Map<number, string>();
        for (const p of partners) {
            if (p.MaNCC && p.TenNCC) {
                map.set(p.MaNCC, p.TenNCC);
            }
        }
        return map;
    }, [partners]);

    const variantMap = useMemo(() => {
        const map = new Map<number, string>();
        for (const item of stockItems) {
            if (item.product_variant_id) {
                const variantText = item.variant_name ? ` (${item.variant_name})` : "";
                map.set(item.product_variant_id, `${item.sku} - ${item.product_name}${variantText}`);
            }
        }
        return map;
    }, [stockItems]);

    const summary = useMemo(() => {
        const nearExpiry = batches.filter((batch) => batch.status === "NEAR_EXPIRY" || (daysUntil(batch.expiry_date) ?? Number.POSITIVE_INFINITY) <= 30).length;
        const expired = batches.filter((batch) => batch.status === "EXPIRED" || (daysUntil(batch.expiry_date) ?? 1) < 0).length;
        return { total: batches.length, nearExpiry, expired };
    }, [batches]);

    const columns: ColumnProps<ProductBatch>[] = [
        { key: "lot_number", title: "Số lô", className: "font-semibold text-gray-900" },
        { key: "product_variant_id", title: "Sản phẩm / Variant", render: (value) => variantMap.get(Number(value)) || `#${String(value)}` },
        { key: "supplier_id", title: "Nhà cung cấp", render: (value) => value ? (supplierMap.get(Number(value)) || `NCC #${String(value)}`) : "Không có" },
        { key: "manufacture_date", title: "Ngày sản xuất", render: (value) => formatDate(value as string | null) },
        { key: "received_date", title: "Ngày nhập", render: (value) => formatDate(value as string | null) },
        { key: "expiry_date", title: "Hạn sử dụng", render: (value) => (
            <div>
                <div className="font-medium text-gray-900">{formatDate(value as string | null)}</div>
                <div className="text-xs text-gray-500">{expiryLabel(value as string | null)}</div>
            </div>
        ) },
        { key: "status", title: "Trạng thái", render: (value) => {
            const status = value as BatchStatus;
            return <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${statusClass(status)}`}>{statusLabel(status)}</span>;
        } },
        { key: "notes", title: "Ghi chú", render: (value) => String(value || "-") },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Quản lý lô hàng</h1>
                        <p className="text-sm text-gray-500">Theo dõi số lô, hạn sử dụng và trạng thái lô của hàng mẹ & bé.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
                            <div className="font-bold text-gray-900">{summary.total}</div>
                            <div className="text-gray-500">Tổng lô</div>
                        </div>
                        <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2">
                            <div className="font-bold text-yellow-800">{summary.nearExpiry}</div>
                            <div className="text-yellow-700">Gần hạn</div>
                        </div>
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
                            <div className="font-bold text-red-700">{summary.expired}</div>
                            <div className="text-red-600">Hết hạn</div>
                        </div>
                    </div>
                </div>

                {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm theo số lô..." className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500 md:col-span-2" />
                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as BatchStatus | "")} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500">
                            {statusOptions.map((option) => <option key={option.value || "ALL"} value={option.value}>{option.label}</option>)}
                        </select>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => void loadBatches()} disabled={isLoading} className="flex-1 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-60">{isLoading ? "Đang tải" : "Lọc"}</button>
                            <button type="button" onClick={() => { setSearchTerm(""); setStatusFilter(""); void loadBatches("", ""); }} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Xóa</button>
                        </div>
                    </div>
                </div>

                <Tablelayout columns={columns} dataSource={batches} rowKey="id" isLoading={isLoading} />
            </div>
        </DashboardLayout>
    );
}
