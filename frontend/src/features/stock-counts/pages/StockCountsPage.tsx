import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/layouts/dashboard/DashboardLayout";
import Tablelayout from "@/shared/ui/Table/TableLayout";
import type { ColumnProps } from "@/shared/ui/Table/types";
import { stockCountService } from "@/features/stock-counts/services/stockCountService";
import type { StockCount, StockCountItem, StockCountScopeType, StockCountStatus } from "@/features/stock-counts/services/stockCountService";
import { warehouseService } from "@/features/warehouses/services/warehouseService";
import type { WarehouseOption } from "@/features/warehouses/services/warehouseService";
import { userService, type User } from "@/features/staff/services/userService";
import { getHttpErrorMessage } from "@/shared/services/httpClient";
import { productService, type LocationOption } from "@/features/products/services/productService";
import { categoryService, type Category } from "@/features/products/services/categoryService";
import type { ProductItem } from "@/features/products/hooks/useProducts";

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
                label: "Khu kho",
                placeholder: "-- Chọn khu cần kiểm kê --",
                helpText: "Chỉ kiểm kê hàng nằm trong khu này của kho đã chọn.",
            };
        case "SHELF":
            return {
                label: "Kệ kho",
                placeholder: "-- Chọn kệ cần kiểm kê --",
                helpText: "Chỉ kiểm kê hàng nằm trên kệ này.",
            };
        case "LOCATION":
            return {
                label: "Ô lưu trữ",
                placeholder: "-- Chọn ô cần kiểm kê --",
                helpText: "Chỉ kiểm kê đúng một ô lưu trữ.",
            };
        case "SKU":
            return {
                label: "Sản phẩm / Biến thể",
                placeholder: "-- Chọn sản phẩm cần kiểm kê --",
                helpText: "Chỉ kiểm kê một biến thể sản phẩm trong toàn kho đã chọn.",
            };
        case "CATEGORY":
            return {
                label: "Danh mục sản phẩm",
                placeholder: "-- Chọn danh mục cần kiểm kê --",
                helpText: "Kiểm kê toàn bộ sản phẩm thuộc danh mục này.",
            };
        default:
            return null;
    }
}

export default function StockCountsPage() {
    const [counts, setCounts] = useState<StockCount[]>([]);
    const [items, setItems] = useState<StockCountItem[]>([]);
    const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
    const [variants, setVariants] = useState<ProductItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCount, setSelectedCount] = useState<StockCount | null>(null);
    const [formData, setFormData] = useState(initialFormState);
    const [itemDrafts, setItemDrafts] = useState<Record<number, { actualQuantity: string; reasonCode: string; note: string }>>({});
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showItemsModal, setShowItemsModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Phiếu điều chỉnh sinh ra sau khi duyệt kiểm kê. Duyệt kiểm kê CHƯA trừ tồn:
    // phải duyệt tiếp phiếu này thì tồn mới đổi, nên phải nói rõ cho người dùng.
    const [pendingAdjustment, setPendingAdjustment] = useState<{ id: number; code: string } | null>(null);

    const warehousesById = useMemo(() => new Map(warehouses.map((warehouse) => [warehouse.id, warehouse])), [warehouses]);
    const userMap = useMemo(() => new Map(users.map((u) => [u.MaNguoiDung, u.HoTen])), [users]);

    /**
     * Danh sách để chọn cho ô "phạm vi", lấy theo đúng loại phạm vi đang chọn và
     * giới hạn trong kho đã chọn. Trước đây ô này bắt người dùng tự gõ id trong DB.
     */
    const scopeOptions = useMemo<Array<{ id: number; label: string }>>(() => {
        const inWarehouse = locationOptions.filter(
            (loc) => !formData.warehouseId || String(loc.warehouseId) === formData.warehouseId,
        );
        const dedupe = (rows: Array<{ id: number; label: string }>) => {
            const seen = new Map<number, string>();
            rows.forEach((row) => {
                if (row.id && !seen.has(row.id)) seen.set(row.id, row.label);
            });
            return [...seen.entries()]
                .map(([id, label]) => ({ id, label }))
                .sort((a, b) => a.label.localeCompare(b.label, "vi"));
        };

        switch (formData.scopeType) {
            case "ZONE":
                return dedupe(inWarehouse.map((loc) => ({ id: loc.zoneId, label: loc.zoneLabel })));
            case "SHELF":
                return dedupe(inWarehouse.map((loc) => ({ id: loc.shelfId, label: loc.shelfLabel })));
            case "LOCATION":
                return dedupe(inWarehouse.map((loc) => ({ id: loc.id, label: loc.label })));
            case "SKU":
                return dedupe(variants.map((variant) => ({ id: variant.id, label: `${variant.sku} - ${variant.name}` })));
            case "CATEGORY":
                return dedupe(categories.map((category) => ({ id: category.id, label: category.name })));
            default:
                return [];
        }
    }, [formData.scopeType, formData.warehouseId, locationOptions, variants, categories]);

    /** Trả về danh sách phiếu vừa tải để nơi gọi lấy được trạng thái mới nhất ngay. */
    async function loadCounts(): Promise<StockCount[]> {
        setIsLoading(true);
        setError(null);
        try {
            const [countRows, warehouseRows, userRows, locationRows, variantRows, categoryRows] = await Promise.all([
                stockCountService.listStockCounts(),
                warehouseService.listWarehouses(),
                userService.listUsers().catch(() => []),
                productService.listLocationOptions().catch(() => []),
                productService.listProducts().catch(() => []),
                categoryService.listCategories().catch(() => []),
            ]);
            setCounts(countRows);
            setWarehouses(warehouseRows);
            setUsers(userRows);
            setLocationOptions(locationRows);
            setVariants(variantRows);
            setCategories(categoryRows);
            setFormData((current) => ({
                ...current,
                warehouseId: current.warehouseId || (warehouseRows[0] ? String(warehouseRows[0].id) : ""),
            }));
            return countRows;
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không tải được danh sách kiểm kê từ backend"));
            return [];
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
            const freshCounts = await loadCounts();
            // Phải mở lại modal bằng bản vừa tải chứ không phải `selectedCount` cũ:
            // giữ bản cũ thì sau khi Gửi duyệt, modal vẫn tưởng phiếu đang ở trạng thái
            // Đang kiểm kê và tiếp tục hiện nút Lưu đếm, bấm vào là 409 NOT_COUNTABLE.
            if (selectedCount) {
                const fresh = freshCounts.find((count) => count.id === selectedCount.id);
                if (fresh) await openItems(fresh);
            }
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không thực hiện được thao tác kiểm kê"));
        } finally {
            setIsSaving(false);
        }
    }

    /**
     * Duyệt phiếu kiểm kê. Bước này KHÔNG trừ tồn: nó sinh ra một phiếu điều chỉnh
     * ở trạng thái chờ xử lý, phải duyệt tiếp phiếu đó tồn mới thay đổi. Giữ hai
     * bước để tách người kiểm đếm khỏi người chốt tồn, nhưng phải chỉ đường rõ
     * ràng, nếu không ai cũng tưởng duyệt xong là số liệu đã được cập nhật.
     */
    async function handleApproveCount(count: StockCount) {
        setIsSaving(true);
        setError(null);
        try {
            const result = await stockCountService.approveStockCount(count.id);
            const freshCounts = await loadCounts();
            const fresh = freshCounts.find((row) => row.id === count.id);
            if (showItemsModal && fresh) await openItems(fresh);

            setPendingAdjustment(
                result.adjustmentId && result.adjustmentCode
                    ? { id: result.adjustmentId, code: result.adjustmentCode }
                    : null,
            );
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không duyệt được phiếu kiểm kê"));
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

        // Lưu một dòng thì chỉ tải lại danh sách dòng của phiếu này. Trước đây dùng
        // runCountAction nên nó nạp lại cả trang (phiếu, kho, người dùng, vị trí,
        // sản phẩm, danh mục) rồi dựng lại toàn bộ ô nhập từ server — màn hình giật
        // và số đang gõ dở ở những dòng chưa lưu bị xoá sạch.
        const hasVariance = actualQuantity !== Number(item.system_quantity);
        setIsSaving(true);
        setError(null);
        try {
            await stockCountService.recordStockCountItem(selectedCount.id, item.id, {
                actualQuantity,
                // Khớp số thì không gửi lý do, tránh dính lý do thừa từ lần gõ trước.
                reasonCode: hasVariance ? draft?.reasonCode || undefined : undefined,
                note: draft?.note || undefined,
            });

            const rows = await stockCountService.listStockCountItems(selectedCount.id);
            setItems(rows);
            setItemDrafts((current) => Object.fromEntries(rows.map((row) => {
                const typed = current[row.id];
                // Chỉ dòng vừa lưu mới lấy lại giá trị từ server; các dòng khác giữ
                // nguyên những gì người dùng đang gõ.
                if (row.id !== item.id && typed) return [row.id, typed];
                return [row.id, {
                    actualQuantity: row.actual_quantity == null ? "" : String(row.actual_quantity),
                    reasonCode: row.reason_code ?? "",
                    note: row.note ?? "",
                }];
            })));
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không lưu được số đếm"));
        } finally {
            setIsSaving(false);
        }
    }

    const columns: ColumnProps<StockCount>[] = [
        { key: "count_code", title: "Mã phiếu", className: "font-semibold text-gray-900" },
        { key: "scope_type", title: "Phạm vi", render: (value) => scopeLabel(value as StockCountScopeType) },
        { key: "warehouse_id", title: "Kho", render: (value) => {
            const warehouse = warehousesById.get(Number(value));
            return warehouse ? warehouseLabel(warehouse) : `#${String(value)}`;
        } },
        { key: "status", title: "Trạng thái", render: (value) => statusLabel(value as StockCountStatus) },
        { key: "assigned_to", title: "Người phụ trách", render: (_, record) => record.assigned_to_name || (record.assigned_to ? (userMap.get(Number(record.assigned_to)) || `Người dùng #${String(record.assigned_to)}`) : "-") },
        {
            key: "actions",
            title: "Thao tác",
            width: "200px",
            render: (_, record) => (
                <div className="flex flex-wrap gap-1">
                    <button type="button" onClick={() => void openItems(record)} className="btn-action btn-blue">Chi tiết</button>
                    {record.status === "DRAFT" && <button type="button" onClick={() => runCountAction(() => stockCountService.startStockCount(record.id))} className="btn-action btn-green">Bắt đầu</button>}
                    {record.status === "IN_PROGRESS" && <button type="button" onClick={() => runCountAction(() => stockCountService.submitStockCount(record.id))} className="btn-action btn-pink">Gửi duyệt</button>}
                    {record.status === "SUBMITTED" && <button type="button" onClick={() => void handleApproveCount(record)} className="btn-action btn-green">Duyệt</button>}
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
                {pendingAdjustment && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                        <p>
                            Đã duyệt kiểm kê và tạo phiếu điều chỉnh <strong className="font-mono">{pendingAdjustment.code}</strong>.
                            {" "}<strong>Tồn kho chưa thay đổi</strong> — cần duyệt tiếp phiếu điều chỉnh này.
                        </p>
                        <div className="flex items-center gap-2">
                            <Link
                                to={`/adjustments/${pendingAdjustment.id}`}
                                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                                Đi duyệt phiếu điều chỉnh
                            </Link>
                            <button
                                type="button"
                                onClick={() => setPendingAdjustment(null)}
                                className="rounded-md border border-blue-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-800 hover:bg-blue-50"
                            >
                                Để sau
                            </button>
                        </div>
                    </div>
                )}
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
                                        <select
                                            required
                                            value={formData.scopeReferenceId}
                                            onChange={(event) => setFormData({ ...formData, scopeReferenceId: event.target.value })}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                                        >
                                            <option value="">{scopeConfig.placeholder}</option>
                                            {scopeOptions.map((option) => (
                                                <option key={option.id} value={option.id}>{option.label}</option>
                                            ))}
                                        </select>
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

            {showItemsModal && selectedCount && (() => {
                // Backend chỉ nhận ghi số đếm khi phiếu Đang kiểm kê; ngoài trạng thái đó
                // thì hiện dạng chỉ đọc thay vì rải ô nhập mờ khắp bảng.
                const canCount = selectedCount.status === "IN_PROGRESS";
                const variedCount = items.filter((item) => Number(item.difference_quantity ?? 0) !== 0).length;
                const uncountedCount = items.filter((item) => item.actual_quantity == null).length;

                return (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
                        <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-pink-50 px-6 py-4">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h2 className="text-lg font-bold text-pink-700">Chi tiết kiểm kê</h2>
                                    <span className="rounded-full border border-pink-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-pink-700">
                                        {statusLabel(selectedCount.status)}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-500">
                                    <span className="font-mono">{selectedCount.count_code}</span>
                                    {items.length > 0 && (
                                        <>
                                            <span className="mx-2 text-gray-300">·</span>
                                            {items.length} dòng
                                            {variedCount > 0 && <span className="text-red-600">, {variedCount} dòng lệch</span>}
                                        </>
                                    )}
                                </p>
                            </div>
                            <button type="button" onClick={() => setShowItemsModal(false)} className="shrink-0 rounded p-1 text-2xl leading-none text-gray-400 hover:bg-white/70 hover:text-gray-600" aria-label="Đóng">×</button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
                            {!canCount && (
                                <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                    Phiếu đang ở trạng thái <strong>{statusLabel(selectedCount.status)}</strong> nên không nhập được số đếm.
                                    {selectedCount.status === "DRAFT" && " Bấm \"Bắt đầu kiểm kê\" bên dưới để mở phiếu ra đếm."}
                                </div>
                            )}
                            {items.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500">
                                    Phiếu chưa có dòng kiểm kê nào.
                                </div>
                            ) : (
                                <table className="w-full table-auto text-left text-sm">
                                    <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                                        <tr>
                                            <th className="py-2.5 pr-3">Sản phẩm</th>
                                            <th className="whitespace-nowrap px-3 py-2.5">Vị trí</th>
                                            <th className="whitespace-nowrap px-3 py-2.5 text-right">Hệ thống</th>
                                            <th className="whitespace-nowrap px-3 py-2.5 text-right">Thực tế</th>
                                            <th className="whitespace-nowrap px-3 py-2.5 text-right">Lệch</th>
                                            <th className="px-3 py-2.5">Lý do</th>
                                            {canCount && <th className="whitespace-nowrap py-2.5 pl-3 text-right">Thao tác</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {items.map((item) => {
                                            const draft = itemDrafts[item.id] ?? { actualQuantity: "", reasonCode: "", note: "" };
                                            // Còn Đang kiểm kê (chưa gửi duyệt) thì sửa lại bao nhiêu lần cũng được,
                                            // kể cả dòng đã lưu. Gửi duyệt xong là chốt — đúng như backend chặn ghi
                                            // khi phiếu rời khỏi trạng thái IN_PROGRESS.
                                            const isCounted = item.actual_quantity != null;
                                            const canEditRow = canCount;
                                            // Khi đang sửa thì tính lệch ngay từ số đang gõ, không đợi lưu —
                                            // nhờ vậy người đếm thấy ngay chênh lệch và hiểu vì sao ô lý do mở hay khoá.
                                            const typedActual = draft.actualQuantity.trim();
                                            const difference = canEditRow
                                                ? (typedActual === "" || !Number.isFinite(Number(typedActual))
                                                    ? null
                                                    : Number(typedActual) - Number(item.system_quantity))
                                                : (item.difference_quantity == null ? null : Number(item.difference_quantity));
                                            // Không lệch thì không có gì để giải thích.
                                            const hasVariance = difference != null && difference !== 0;
                                            return (
                                                <tr key={item.id} className="align-middle hover:bg-gray-50/70">
                                                    <td className="py-3 pr-3">
                                                        <div className="font-semibold text-gray-900">{item.sku ?? `#${item.product_variant_id}`}</div>
                                                        {item.product_name && <div className="text-xs text-gray-500">{item.product_name}</div>}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-gray-600">{item.location_code || `#${item.location_id}`}</td>
                                                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-gray-600">{formatNumber(item.system_quantity)}</td>
                                                    <td className="whitespace-nowrap px-3 py-3 text-right">
                                                        {canEditRow ? (
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.001"
                                                                aria-label={`Số thực tế của ${item.sku ?? item.product_variant_id}`}
                                                                value={draft.actualQuantity}
                                                                onChange={(event) => setItemDrafts({ ...itemDrafts, [item.id]: { ...draft, actualQuantity: event.target.value } })}
                                                                className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-right text-sm tabular-nums outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                                                            />
                                                        ) : (
                                                            <span className="font-semibold tabular-nums text-gray-900">
                                                                {item.actual_quantity == null ? "—" : formatNumber(item.actual_quantity)}
                                                            </span>
                                                        )}
                                                    </td>
                                                    {/* Lệch là thứ người dùng mở phiếu ra để xem, nên được nhấn bằng pill màu. */}
                                                    <td className="whitespace-nowrap px-3 py-3 text-right">
                                                        {difference == null ? (
                                                            <span className="text-gray-300">—</span>
                                                        ) : (
                                                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${difference < 0 ? "bg-red-50 text-red-700" : difference > 0 ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                                                {difference > 0 ? `+${formatNumber(difference)}` : formatNumber(difference)}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        {canEditRow ? (
                                                            <input
                                                                value={hasVariance ? draft.reasonCode : ""}
                                                                disabled={!hasVariance}
                                                                aria-label={`Lý do lệch của ${item.sku ?? item.product_variant_id}`}
                                                                onChange={(event) => setItemDrafts({ ...itemDrafts, [item.id]: { ...draft, reasonCode: event.target.value } })}
                                                                className="w-full min-w-[9rem] rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
                                                                placeholder={difference == null ? "Nhập số thực tế trước" : hasVariance ? "Lý do lệch" : "Khớp, không cần lý do"}
                                                            />
                                                        ) : (
                                                            <span className="text-gray-600">{item.reason_code || "—"}</span>
                                                        )}
                                                    </td>
                                                    {canCount && (
                                                        <td className="whitespace-nowrap py-3 pl-3 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {isCounted && (
                                                                    <span className="whitespace-nowrap text-xs font-semibold text-green-700" title="Dòng này đã được lưu, vẫn sửa lại được cho tới khi gửi duyệt">
                                                                        ✓ Đã đếm
                                                                    </span>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRecordItem(item)}
                                                                    disabled={isSaving}
                                                                    className={`rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${isCounted
                                                                        ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                                                        : "bg-pink-600 text-white hover:bg-pink-700"}`}
                                                                >
                                                                    {isCounted ? "Lưu lại" : "Lưu đếm"}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        {/* Hành động của phiếu để ngay trong modal: trước đây người dùng phải
                            đóng modal, tìm lại đúng dòng trong danh sách rồi mới bấm được. */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                            <p className="text-sm text-gray-500">
                                {selectedCount.status === "DRAFT" && "Bắt đầu để chốt số liệu hệ thống và mở phiếu ra đếm."}
                                {selectedCount.status === "IN_PROGRESS" && (
                                    uncountedCount > 0
                                        ? `Còn ${uncountedCount}/${items.length} dòng chưa nhập số thực tế.`
                                        : "Đã nhập đủ số thực tế, có thể gửi duyệt."
                                )}
                                {selectedCount.status === "SUBMITTED" && "Duyệt sẽ sinh phiếu điều chỉnh tồn cho các dòng lệch."}
                                {selectedCount.status === "APPROVED" && "Phiếu đã duyệt, chỉ xem lại."}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowItemsModal(false)}
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Đóng
                                </button>
                                {selectedCount.status === "DRAFT" && (
                                    <button
                                        type="button"
                                        disabled={isSaving}
                                        onClick={() => void runCountAction(() => stockCountService.startStockCount(selectedCount.id))}
                                        className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                                    >
                                        {isSaving ? "Đang xử lý" : "Bắt đầu kiểm kê"}
                                    </button>
                                )}
                                {selectedCount.status === "IN_PROGRESS" && (
                                    <button
                                        type="button"
                                        disabled={isSaving}
                                        onClick={() => {
                                            if (uncountedCount > 0 && !window.confirm(`Còn ${uncountedCount} dòng chưa nhập số thực tế. Vẫn gửi duyệt?`)) return;
                                            void runCountAction(() => stockCountService.submitStockCount(selectedCount.id));
                                        }}
                                        className="rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-60"
                                    >
                                        {isSaving ? "Đang xử lý" : "Gửi duyệt"}
                                    </button>
                                )}
                                {selectedCount.status === "SUBMITTED" && (
                                    <button
                                        type="button"
                                        disabled={isSaving}
                                        onClick={() => {
                                            if (!window.confirm(`Duyệt phiếu ${selectedCount.count_code}? Hệ thống sẽ sinh phiếu điều chỉnh cho ${variedCount} dòng lệch.`)) return;
                                            void handleApproveCount(selectedCount);
                                        }}
                                        className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                                    >
                                        {isSaving ? "Đang xử lý" : "Duyệt phiếu"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                );
            })()}
        </DashboardLayout>
    );
}