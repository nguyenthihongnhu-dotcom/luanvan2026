import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/layouts/dashboard/DashboardLayout";
import Tablelayout from "@/shared/ui/Table/TableLayout";
import type { ColumnProps } from "@/shared/ui/Table/types";
import { batchService } from "@/features/batches/services/batchService";
import { getHttpErrorMessage } from "@/shared/services/httpClient";
import type { BatchStatus, ProductBatch } from "@/features/batches/services/batchService";
import { partnerService, type Partner } from "@/features/partners/services/partnerService";
import { productService } from "@/features/products/services/productService";
import type { ProductItem } from "@/features/products/hooks/useProducts";
import BatchModal from "@/features/batches/components/BatchModal";

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
    // Lấy toàn bộ SKU trong danh mục, không lấy theo tồn kho: lô mới thường thuộc SKU chưa có hàng.
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<BatchStatus | "">("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBatch, setEditingBatch] = useState<ProductBatch | null>(null);

    async function handleDelete(batch: ProductBatch) {
        if (!window.confirm(`Xóa lô ${batch.lot_number}?`)) return;
        setError(null);
        setNotice(null);
        try {
            await batchService.deleteBatch(batch.id);
            setNotice(`Đã xóa lô ${batch.lot_number}.`);
            await loadBatches();
        } catch (err) {
            // Backend chặn xóa lô còn tồn hoặc đã có giao dịch, thông điệp đã đủ rõ để hiện thẳng.
            setError(getHttpErrorMessage(err, "Không xóa được lô hàng"));
        }
    }

    async function loadBatches(nextSearch = searchTerm, nextStatus = statusFilter) {
        setIsLoading(true);
        setError(null);
        try {
            const [batchList, partnerList, productList] = await Promise.all([
                batchService.listBatches({ search: nextSearch, status: nextStatus }),
                partnerService.listPartners().catch(() => []),
                productService.listProducts().catch(() => []),
            ]);
            setBatches(batchList);
            setPartners(partnerList);
            setProducts(productList);
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

    // Trước đây map này dựng từ tồn kho, nên lô của SKU chưa có hàng chỉ hiện được "#8".
    const variantMap = useMemo(() => {
        const map = new Map<number, string>();
        for (const product of products) {
            map.set(product.id, `${product.sku} - ${product.name}`);
        }
        return map;
    }, [products]);

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
        { key: "id", title: "Thao tác", render: (_value, record) => (
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => { setEditingBatch(record); setIsModalOpen(true); }}
                    className="rounded border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-600 hover:border-pink-300 hover:text-pink-600"
                >
                    Sửa
                </button>
                <button
                    type="button"
                    onClick={() => void handleDelete(record)}
                    className="rounded border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-600 hover:border-red-300 hover:text-red-600"
                >
                    Xóa
                </button>
            </div>
        ) },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Quản lý lô hàng</h1>
                        <p className="text-sm text-gray-500">Theo dõi số lô, hạn sử dụng và trạng thái lô của hàng mẹ & bé.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
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
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-pink-700"
                        >
                            + Thêm lô hàng mới
                        </button>
                    </div>
                </div>

                {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
                {notice && (
                    <div className="flex items-start justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                        <span>{notice}</span>
                        <button type="button" onClick={() => setNotice(null)} className="shrink-0 font-bold text-emerald-600 hover:text-emerald-800" aria-label="Đóng">×</button>
                    </div>
                )}

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

            <BatchModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingBatch(null); }}
                onSuccess={(message) => {
                    setNotice(message);
                    void loadBatches();
                }}
                products={products}
                partners={partners}
                editingBatch={editingBatch}
            />
        </DashboardLayout>
    );
}
