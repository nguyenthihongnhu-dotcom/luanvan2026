import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import DashboardLayout from "@/layouts/dashboard/DashboardLayout";
import Tablelayout from "@/shared/ui/Table/TableLayout";
import type { ColumnProps } from "@/shared/ui/Table/types";
import { transferService } from "@/features/transfers/services/transferService";
import type { CurrentStockItem, LocationStatus, StockTransfer, TransferStatus, WarehouseLocationOption } from "@/features/transfers/services/transferService";
import { getHttpErrorMessage } from "@/shared/services/httpClient";

const initialFormState = {
    transferCode: "",
    stockLocationId: "",
    destinationLocationId: "",
    quantity: "",
    note: "",
};

function statusLabel(status: TransferStatus): string {
    const labels: Record<TransferStatus, string> = {
        DRAFT: "Nháp",
        PENDING: "Chờ xử lý",
        CONFIRMED: "Đã xác nhận",
        CANCELLED: "Đã hủy",
    };
    return labels[status] ?? status;
}

function formatDate(value: string): string {
    if (!value) return "";
    return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

// Chuyển kho chỉ dời chỗ nên trần là tồn vật lý của ô, kể cả phần đang giữ chỗ
// cho đơn đặt trước (phần giữ chỗ đó được dời sang ô đích cùng với hàng).
function stockLabel(item: CurrentStockItem): string {
    const quantity = Number(item.quantity ?? 0).toLocaleString("vi-VN");
    const reserved = Number(item.reserved_quantity ?? 0);
    const batch = item.lot_number ? ` - Lô ${item.lot_number}` : "";
    const reservedNote = reserved > 0 ? ` (giữ chỗ ${reserved.toLocaleString("vi-VN")})` : "";
    return `${item.sku} - ${item.variant_name || item.product_name}${batch} | ${item.location_code} | còn ${quantity}${reservedNote}`;
}

function locationStatusLabel(status: LocationStatus): string {
    const labels: Record<LocationStatus, string> = {
        ACTIVE: "",
        INACTIVE: "ngừng dùng",
        LOCKED: "đang khóa",
        MAINTENANCE: "bảo trì",
        FULL: "đã đầy",
    };
    return labels[status] ?? status;
}

// Tên khu/kệ/vị trí lấy thẳng từ DB (người dùng có thể đặt lại trong Sơ đồ kho),
// chỉ khi cột name trống mới dựng nhãn mặc định từ mã.
function locationLabel(location: WarehouseLocationOption): string {
    const layerCode = String(location.layer_no).padStart(2, "0");
    const zone = location.zone_name?.trim() || `Khu ${location.zone_code}`;
    const shelf = location.shelf_name?.trim() || `Kệ ${location.shelf_code}`;
    const detail = location.name?.trim() || `${shelf} tầng ${layerCode}`;
    const status = locationStatusLabel(location.status);
    const suffix = status ? ` [${status}]` : "";
    return `${location.code} - ${zone} / ${detail}${suffix}`;
}

export default function TransfersPage() {
    const [transfers, setTransfers] = useState<StockTransfer[]>([]);
    const [stockItems, setStockItems] = useState<CurrentStockItem[]>([]);
    const [locations, setLocations] = useState<WarehouseLocationOption[]>([]);
    const [formData, setFormData] = useState(initialFormState);
    const [showModal, setShowModal] = useState(false);
    const [detailTransfer, setDetailTransfer] = useState<StockTransfer | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function loadData() {
        setIsLoading(true);
        setError(null);
        try {
            const [transferRows, stockRows, locationRows] = await Promise.all([
                transferService.listTransfers(),
                transferService.listCurrentStock(),
                transferService.listLocationOptions(),
            ]);
            setTransfers(transferRows);
            setStockItems(stockRows);
            setLocations(locationRows);
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không tải được dữ liệu chuyển kho từ backend"));
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => { void loadData(); }, []);

    const selectedStock = useMemo(() => {
        const stockLocationId = Number(formData.stockLocationId);
        return stockItems.find((item) => item.stock_location_id === stockLocationId);
    }, [formData.stockLocationId, stockItems]);

    const destinationOptions = useMemo(() => {
        if (!selectedStock) return locations;
        return locations.filter((location) => location.id !== selectedStock.location_id);
    }, [locations, selectedStock]);

    // Gom vị trí đích theo kho (tên kho lấy từ DB) để danh sách dài vẫn đọc được.
    const destinationGroups = useMemo(() => {
        const groups = new Map<string, WarehouseLocationOption[]>();
        destinationOptions.forEach((location) => {
            const key = location.warehouse_name || location.warehouse_code || "Kho";
            const bucket = groups.get(key);
            if (bucket) bucket.push(location);
            else groups.set(key, [location]);
        });
        return Array.from(groups.entries());
    }, [destinationOptions]);

    const selectedDestination = useMemo(() => {
        const destinationLocationId = Number(formData.destinationLocationId);
        return locations.find((location) => location.id === destinationLocationId);
    }, [formData.destinationLocationId, locations]);

    const openCreateModal = () => {
        setFormData(initialFormState);
        setShowModal(true);
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!selectedStock || !selectedDestination) {
            setError("Chọn hàng tồn nguồn và vị trí đích trước khi tạo phiếu chuyển.");
            return;
        }

        const quantity = Number(formData.quantity);
        const onHand = Number(selectedStock.quantity ?? 0);
        if (!Number.isFinite(quantity) || quantity <= 0 || quantity > onHand) {
            setError("Số lượng chuyển phải lớn hơn 0 và không vượt tồn thực tế của ô nguồn.");
            return;
        }

        setIsSaving(true);
        setError(null);
        try {
            await transferService.createTransfer({
                transferCode: formData.transferCode || undefined,
                sourceWarehouseId: selectedStock.warehouse_id,
                destinationWarehouseId: selectedDestination.warehouse_id,
                note: formData.note || undefined,
                items: [{
                    productVariantId: selectedStock.product_variant_id,
                    batchId: selectedStock.batch_id,
                    sourceLocationId: selectedStock.location_id,
                    destinationLocationId: Number(formData.destinationLocationId),
                    quantity,
                    note: formData.note || undefined,
                }],
            });
            setShowModal(false);
            setFormData(initialFormState);
            await loadData();
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không tạo được phiếu chuyển kho"));
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirm = async (id: number) => {
        if (!window.confirm("Xác nhận chuyển kho và cập nhật tồn kho?")) return;
        await transferService.confirmTransfer(id);
        await loadData();
    };

    const handleReverse = async (id: number) => {
        if (!window.confirm("Đảo phiếu chuyển kho này?")) return;
        await transferService.reverseTransfer(id);
        await loadData();
    };

    const warehouseMap = useMemo(() => {
        const map = new Map<number, string>();
        for (const item of stockItems) {
            if (item.warehouse_id && item.warehouse_name) {
                map.set(item.warehouse_id, `${item.warehouse_code ? `${item.warehouse_code} - ` : ""}${item.warehouse_name}`);
            }
        }
        for (const loc of locations) {
            if (loc.warehouse_id && loc.warehouse_name) {
                map.set(loc.warehouse_id, `${loc.warehouse_code ? `${loc.warehouse_code} - ` : ""}${loc.warehouse_name}`);
            }
        }
        return map;
    }, [stockItems, locations]);

    const columns: ColumnProps<StockTransfer>[] = [
        { key: "transfer_code", title: "Mã phiếu", className: "font-semibold text-gray-900" },
        { key: "status", title: "Trạng thái", render: (value) => statusLabel(value as TransferStatus) },
        { key: "source_warehouse_id", title: "Kho nguồn", render: (value) => warehouseMap.get(Number(value)) || (value ? `Kho #${value}` : "-") },
        { key: "destination_warehouse_id", title: "Kho đích", render: (value) => warehouseMap.get(Number(value)) || (value ? `Kho #${value}` : "-") },
        { key: "note", title: "Ghi chú", render: (value) => String(value || "-") },
        { key: "created_at", title: "Ngày tạo", render: (value) => formatDate(String(value ?? "")) },
        {
            key: "actions",
            title: "Thao tác",
            width: "160px",
            render: (_, record) => {
                const canConfirm = record.status === "DRAFT" || record.status === "PENDING";
                const canReverse = record.status === "CONFIRMED";

                return (
                    <div className="flex flex-wrap gap-1">
                        <button
                            type="button"
                            onClick={() => setDetailTransfer(record)}
                            style={{ borderRadius: '2px' }}
                            className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-300 hover:bg-pink-100 hover:border-pink-500 transition-colors"
                        >
                            Chi tiết
                        </button>
                        {canConfirm && (
                            <button
                                type="button"
                                onClick={() => handleConfirm(record.id)}
                                style={{ borderRadius: '2px' }}
                                className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-green-50 text-green-700 border border-green-300 hover:bg-green-100 hover:border-green-500 transition-colors"
                            >
                                Xác nhận
                            </button>
                        )}
                        {canReverse && (
                            <button
                                type="button"
                                onClick={() => handleReverse(record.id)}
                                style={{ borderRadius: '2px' }}
                                className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-red-50 text-red-600 border border-red-300 hover:bg-red-100 hover:border-red-500 transition-colors"
                            >
                                Đảo phiếu
                            </button>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-800">Chuyển kho</h1>
                    <button type="button" onClick={openCreateModal} className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700">+ Tạo phiếu chuyển</button>
                </div>

                {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
                <Tablelayout columns={columns} dataSource={transfers} rowKey="id" isLoading={isLoading} />
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-100 bg-pink-50 px-6 py-4">
                            <h2 className="text-lg font-bold text-pink-700">Tạo phiếu chuyển kho</h2>
                            <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600" aria-label="Đóng">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4 p-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Mã phiếu</label>
                                    <input value={formData.transferCode} onChange={(event) => setFormData({ ...formData, transferCode: event.target.value })} placeholder="Để trống để backend tự sinh" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Số lượng chuyển</label>
                                    <input required type="number" min="0.001" step="0.001" value={formData.quantity} onChange={(event) => setFormData({ ...formData, quantity: event.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Hàng tồn nguồn</label>
                                <select required value={formData.stockLocationId} onChange={(event) => setFormData({ ...formData, stockLocationId: event.target.value, destinationLocationId: "" })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500">
                                    <option value="">Chọn SKU/vị trí nguồn</option>
                                    {stockItems.map((item) => <option key={item.stock_location_id} value={item.stock_location_id}>{stockLabel(item)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Vị trí đích</label>
                                <select required value={formData.destinationLocationId} onChange={(event) => setFormData({ ...formData, destinationLocationId: event.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500">
                                    <option value="">Chọn vị trí đích</option>
                                    {destinationGroups.map(([warehouseLabel, options]) => (
                                        <optgroup key={warehouseLabel} label={warehouseLabel}>
                                            {options.map((location) => <option key={location.id} value={location.id}>{locationLabel(location)}</option>)}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Ghi chú</label>
                                <textarea value={formData.note} onChange={(event) => setFormData({ ...formData, note: event.target.value })} className="min-h-[80px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
                                <button type="submit" disabled={isSaving} className="flex-1 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-60">{isSaving ? "Đang lưu" : "Lưu phiếu"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {detailTransfer && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-100 bg-pink-50 px-6 py-4">
                            <h2 className="text-lg font-bold text-pink-700">Chi tiết phiếu chuyển {detailTransfer.transfer_code}</h2>
                            <button type="button" onClick={() => setDetailTransfer(null)} className="text-gray-400 hover:text-gray-600" aria-label="Đóng">×</button>
                        </div>
                        <div className="space-y-3 p-6 text-sm text-gray-700">
                            <div className="flex justify-between border-b pb-2"><span className="font-semibold text-gray-500">Mã phiếu:</span><span className="font-mono font-bold text-gray-900">{detailTransfer.transfer_code}</span></div>
                            <div className="flex justify-between border-b pb-2"><span className="font-semibold text-gray-500">Trạng thái:</span><span>{statusLabel(detailTransfer.status)}</span></div>
                            <div className="flex justify-between border-b pb-2"><span className="font-semibold text-gray-500">Kho nguồn:</span><span className="font-medium text-gray-900">{warehouseMap.get(detailTransfer.source_warehouse_id) || `Kho #${detailTransfer.source_warehouse_id}`}</span></div>
                            <div className="flex justify-between border-b pb-2"><span className="font-semibold text-gray-500">Kho đích:</span><span className="font-medium text-gray-900">{warehouseMap.get(detailTransfer.destination_warehouse_id) || `Kho #${detailTransfer.destination_warehouse_id}`}</span></div>
                            <div className="flex justify-between border-b pb-2"><span className="font-semibold text-gray-500">Ghi chú:</span><span>{detailTransfer.note || '-'}</span></div>
                            <div className="flex justify-between border-b pb-2"><span className="font-semibold text-gray-500">Ngày tạo:</span><span>{formatDate(detailTransfer.created_at)}</span></div>
                        </div>
                        <div className="flex justify-end gap-2 bg-gray-50 px-6 py-3">
                            {(detailTransfer.status === "DRAFT" || detailTransfer.status === "PENDING") && (
                                <button type="button" onClick={() => { const id = detailTransfer.id; setDetailTransfer(null); void handleConfirm(id); }} className="rounded-md bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700">Xác nhận chuyển kho</button>
                            )}
                            {detailTransfer.status === "CONFIRMED" && (
                                <button type="button" onClick={() => { const id = detailTransfer.id; setDetailTransfer(null); void handleReverse(id); }} className="rounded-md bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700">Đảo phiếu này</button>
                            )}
                            <button type="button" onClick={() => setDetailTransfer(null)} className="rounded-md border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}