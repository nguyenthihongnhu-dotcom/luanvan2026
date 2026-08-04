import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import DashboardLayout from "@/layouts/dashboard/DashboardLayout";
import Tablelayout from "@/shared/ui/Table/TableLayout";
import type { ColumnProps } from "@/shared/ui/Table/types";
import { stockCountService } from "@/features/stock-counts/services/stockCountService";
import type { StockCount, StockCountItem, StockCountScopeType, StockCountStatus } from "@/features/stock-counts/services/stockCountService";
import { warehouseService } from "@/features/warehouses/services/warehouseService";
import type { WarehouseOption } from "@/features/warehouses/services/warehouseService";
import { getHttpErrorMessage } from "@/shared/services/httpClient";

const initialFormState = {
    warehouseId: "",
    scopeType: "WAREHOUSE" as StockCountScopeType,
    scopeReferenceId: "",
    note: "",
};

function statusLabel(status: StockCountStatus): string {
    const labels: Record<StockCountStatus, string> = {
        DRAFT: "Nháp",
        IN_PROGRESS: "Đang kiểm kê",
        SUBMITTED: "Chờ duyệt",
        APPROVED: "Đã duyệt",
        REJECTED: "Đã từ chối",
        COMPLETED: "Hoàn tất",
        CANCELLED: "Đã hủy",
    };
    return labels[status] ?? status;
}

function scopeLabel(scope: StockCountScopeType): string {
    const labels: Record<StockCountScopeType, string> = {
        WAREHOUSE: "Toàn kho",
        ZONE: "Theo khu",
        SHELF: "Theo kệ",
        LOCATION: "Theo vị trí",
        SKU: "Theo SKU",
        CATEGORY: "Theo danh mục",
    };
    return labels[scope] ?? scope;
}

function formatNumber(value: unknown): string {
    return Number(value ?? 0).toLocaleString("vi-VN");
}

function warehouseLabel(warehouse: WarehouseOption): string {
    return `${warehouse.code} - ${warehouse.name ?? "Không tên"}`;
}

/**
 * Giản đồ Phạm vi Kiểm kê (Stock Count Scope):
 * - WAREHOUSE: Kiểm kê toàn bộ kho đã chọn.
 * - ZONE: Kiểm kê giới hạn trong một Khu kho (Zone ID - wz.id).
 * - SHELF: Kiểm kê giới hạn trên một Kệ kho (Shelf ID - ws.id).
 * - LOCATION: Kiểm kê đúng 1 Ô vị trí lưu trữ (Location ID - wl.id).
 * - SKU: Kiểm kê duy nhất 1 Biến thể sản phẩm (Variant ID - pv.id).
 * - CATEGORY: Kiểm kê tất cả sản phẩm thuộc 1 Danh mục (Category ID - p.category_id).
 */
function getScopeReferenceConfig(scopeType: StockCountScopeType) {
    switch (scopeType) {
        case "ZONE":
            return {
                label: "Mã ID Khu kho (Zone ID)",
                placeholder: "Nhập ID khu (VD: 1)",
                helpText: "Nhập mã số ID của Khu kho cần kiểm kê trong kho đã chọn (wz.id).",
            };
        case "SHELF":
            return {
                label: "Mã ID Kệ kho (Shelf ID)",
                placeholder: "Nhập ID kệ (VD: 5)",
                helpText: "Nhập mã số ID của Kệ kho cần kiểm kê (ws.id).",
            };
        case "LOCATION":
            return {
                label: "Mã ID Vị trí (Location ID)",
                placeholder: "Nhập ID vị trí (VD: 12)",
                helpText: "Nhập mã số ID của Vị trí lưu trữ chính xác cần kiểm kê (wl.id).",
            };
        case "SKU":
            return {
                label: "Mã ID Biến thể sản phẩm (Variant / SKU ID)",
                placeholder: "Nhập ID biến thể (VD: 102)",
                helpText: "Nhập mã số ID của Biến thể sản phẩm (product_variant_id) cần kiểm kê.",
            };
        case "CATEGORY":
            return {
                label: "Mã ID Danh mục sản phẩm (Category ID)",
                placeholder: "Nhập ID danh mục (VD: 3)",
                helpText: "Nhập mã số ID của Danh mục sản phẩm cần kiểm kê.",
            };
        default:
            return null;
    }
}

export default function StockCountsPage() {
    const [counts, setCounts] = useState<StockCount[]>([]);
    const [items, setItems] = useState<StockCountItem[]>([]);
    const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
    const [selectedCount, setSelectedCount] = useState<StockCount | null>(null);
    const [formData, setFormData] = useState(initialFormState);
    const [itemDrafts, setItemDrafts] = useState<Record<number, { actualQuantity: string; reasonCode: string; note: string }>>({});
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showItemsModal, setShowItemsModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const warehousesById = useMemo(() => new Map(warehouses.map((warehouse) => [warehouse.id, warehouse])), [warehouses]);

    async function loadCounts() {
        setIsLoading(true);
        setError(null);
        try {
            const [countRows, warehouseRows] = await Promise.all([
                stockCountService.listStockCounts(),
                warehouseService.listWarehouses(),
            ]);
            setCounts(countRows);
            setWarehouses(warehouseRows);
            setFormData((current) => ({
                ...current,
                warehouseId: current.warehouseId || (warehouseRows[0] ? String(warehouseRows[0].id) : ""),
            }));
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không tải được danh sách kiểm kê từ backend"));
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => { void loadCounts(); }, []);

    async function openItems(count: StockCount) {
        setSelectedCount(count);
        setShowItemsModal(true);
        setError(null);
        try {
            const rows = await stockCountService.listStockCountItems(count.id);
            setItems(rows);
            setItemDrafts(Object.fromEntries(rows.map((item) => [item.id, {
                actualQuantity: item.actual_quantity == null ? "" : String(item.actual_quantity),
                reasonCode: item.reason_code ?? "",
                note: item.note ?? "",
            }])));
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không tải được chi tiết kiểm kê"));
        }
    }

    async function handleCreate(event: FormEvent) {
        event.preventDefault();
        const warehouseId = Number(formData.warehouseId);
        if (!Number.isFinite(warehouseId) || warehouseId <= 0) {
            setError("Chọn kho trước khi tạo phiếu kiểm kê.");
            return;
        }

        setIsSaving(true);
        setError(null);
        try {
            await stockCountService.createStockCount({
                warehouseId,
                scopeType: formData.scopeType,
                scopeReferenceId: formData.scopeReferenceId ? Number(formData.scopeReferenceId) : undefined,
                note: formData.note || undefined,
            });
            setShowCreateModal(false);
            setFormData({ ...initialFormState, warehouseId: String(warehouseId) });
            await loadCounts();
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không tạo được phiếu kiểm kê. Kiểm tra kho có tồn để snapshot chưa."));
        } finally {
            setIsSaving(false);
        }
    }

    async function runCountAction(action: () => Promise<void>) {
        setIsSaving(true);
        setError(null);
        try {
            await action();
            await loadCounts();
            if (selectedCount) await openItems(selectedCount);
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không thực hiện được thao tác kiểm kê"));
        } finally {
            setIsSaving(false);
        }
    }

    async function handleRecordItem(item: StockCountItem) {
        if (!selectedCount) return;
        const draft = itemDrafts[item.id];
        const actualQuantity = Number(draft?.actualQuantity ?? "");
        if (!Number.isFinite(actualQuantity) || actualQuantity < 0) {
            setError("Số đếm thực tế không hợp lệ.");
            return;
        }

        await runCountAction(async () => {
            await stockCountService.recordStockCountItem(selectedCount.id, item.id, {
                actualQuantity,
                reasonCode: draft?.reasonCode || undefined,
                note: draft?.note || undefined,
            });
        });
    }

    const columns: ColumnProps<StockCount>[] = [
        { key: "count_code", title: "Mã phiếu", className: "font-semibold text-gray-900" },
        { key: "scope_type", title: "Phạm vi", render: (value) => scopeLabel(value as StockCountScopeType) },
        { key: "warehouse_id", title: "Kho", render: (value) => {
            const warehouse = warehousesById.get(Number(value));
            return warehouse ? warehouseLabel(warehouse) : `#${String(value)}`;
        } },
        { key: "status", title: "Trạng thái", render: (value) => statusLabel(value as StockCountStatus) },
        { key: "assigned_to", title: "Người phụ trách", render: (value) => value ? String(value) : "-" },
        {
            key: "actions",
            title: "Thao tác",
            render: (_, record) => (
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void openItems(record)} className="text-xs font-medium text-blue-600 hover:text-blue-900">Chi tiết</button>
                    {record.status === "DRAFT" && <button type="button" onClick={() => runCountAction(() => stockCountService.startStockCount(record.id))} className="text-xs font-medium text-green-700 hover:text-green-900">Bắt đầu</button>}
                    {record.status === "IN_PROGRESS" && <button type="button" onClick={() => runCountAction(() => stockCountService.submitStockCount(record.id))} className="text-xs font-medium text-pink-600 hover:text-pink-900">Gửi duyệt</button>}
                    {record.status === "SUBMITTED" && <button type="button" onClick={() => runCountAction(() => stockCountService.approveStockCount(record.id))} className="text-xs font-medium text-green-700 hover:text-green-900">Duyệt</button>}
                </div>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-800">Kiểm kê kho</h1>
                    <button type="button" onClick={() => setShowCreateModal(true)} className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700">+ Tạo phiếu kiểm kê</button>
                </div>
                {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
                <Tablelayout columns={columns} dataSource={counts} rowKey="id" isLoading={isLoading} />
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-100 bg-pink-50 px-6 py-4">
                            <h2 className="text-lg font-bold text-pink-700">Tạo phiếu kiểm kê</h2>
                            <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600" aria-label="Đóng">×</button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4 p-6">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Kho</label>
                                <select required value={formData.warehouseId} onChange={(event) => setFormData({ ...formData, warehouseId: event.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500">
                                    <option value="">Chọn kho</option>
                                    {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouseLabel(warehouse)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Phạm vi</label>
                                <select value={formData.scopeType} onChange={(event) => setFormData({ ...formData, scopeType: event.target.value as StockCountScopeType, scopeReferenceId: "" })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500">
                                    <option value="WAREHOUSE">Toàn kho</option>
                                    <option value="ZONE">Theo khu</option>
                                    <option value="SHELF">Theo kệ</option>
                                    <option value="LOCATION">Theo vị trí</option>
                                    <option value="SKU">Theo SKU</option>
                                    <option value="CATEGORY">Theo danh mục</option>
                                </select>
                            </div>
                            {formData.scopeType !== "WAREHOUSE" && (() => {
                                const scopeConfig = getScopeReferenceConfig(formData.scopeType);
                                if (!scopeConfig) return null;
                                return (
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">{scopeConfig.label}</label>
                                        <input required type="number" min="1" placeholder={scopeConfig.placeholder} value={formData.scopeReferenceId} onChange={(event) => setFormData({ ...formData, scopeReferenceId: event.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                                        <p className="mt-1 text-xs text-gray-500">{scopeConfig.helpText}</p>
                                    </div>
                                );
                            })()}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Ghi chú</label>
                                <textarea value={formData.note} onChange={(event) => setFormData({ ...formData, note: event.target.value })} className="min-h-[80px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
                                <button type="submit" disabled={isSaving} className="flex-1 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-60">{isSaving ? "Đang lưu" : "Lưu phiếu"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showItemsModal && selectedCount && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-100 bg-pink-50 px-6 py-4">
                            <h2 className="text-lg font-bold text-pink-700">Chi tiết kiểm kê {selectedCount.count_code}</h2>
                            <button type="button" onClick={() => setShowItemsModal(false)} className="text-gray-400 hover:text-gray-600" aria-label="Đóng">×</button>
                        </div>
                        <div className="max-h-[72vh] overflow-auto p-6">
                            {items.length === 0 ? (
                                <div className="text-sm text-gray-500">Phiếu chưa có dòng kiểm kê.</div>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                                        <tr>
                                            <th className="py-2">Variant</th>
                                            <th className="py-2">Vị trí</th>
                                            <th className="py-2">Hệ thống</th>
                                            <th className="py-2">Thực tế</th>
                                            <th className="py-2">Lệch</th>
                                            <th className="py-2">Lý do</th>
                                            <th className="py-2">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {items.map((item) => {
                                            const draft = itemDrafts[item.id] ?? { actualQuantity: "", reasonCode: "", note: "" };
                                            return (
                                                <tr key={item.id}>
                                                    <td className="py-2 font-medium text-gray-900">{item.sku ? `${item.sku} - ${item.product_name || ''}` : `#${item.product_variant_id}`}</td>
                                                    <td className="py-2 font-mono text-xs text-gray-700">{item.location_code || `#${item.location_id}`}</td>
                                                    <td className="py-2">{formatNumber(item.system_quantity)}</td>
                                                    <td className="py-2">
                                                        <input type="number" min="0" step="0.001" value={draft.actualQuantity} onChange={(event) => setItemDrafts({ ...itemDrafts, [item.id]: { ...draft, actualQuantity: event.target.value } })} disabled={selectedCount.status !== "IN_PROGRESS"} className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-50" />
                                                    </td>
                                                    <td className="py-2">{item.difference_quantity == null ? "-" : formatNumber(item.difference_quantity)}</td>
                                                    <td className="py-2">
                                                        <input value={draft.reasonCode} onChange={(event) => setItemDrafts({ ...itemDrafts, [item.id]: { ...draft, reasonCode: event.target.value } })} disabled={selectedCount.status !== "IN_PROGRESS"} className="w-32 rounded-md border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-50" placeholder="Lý do" />
                                                    </td>
                                                    <td className="py-2">
                                                        {selectedCount.status === "IN_PROGRESS" && <button type="button" onClick={() => handleRecordItem(item)} disabled={isSaving} className="rounded-md bg-pink-600 px-3 py-1 text-xs font-medium text-white hover:bg-pink-700 disabled:opacity-60">Lưu đếm</button>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}