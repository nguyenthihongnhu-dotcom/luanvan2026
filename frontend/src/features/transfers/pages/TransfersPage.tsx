import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import DashboardLayout from "@/layouts/dashboard/DashboardLayout";
import Tablelayout from "@/shared/ui/Table/TableLayout";
import type { ColumnProps } from "@/shared/ui/Table/types";
import { transferService } from "@/features/transfers/services/transferService";
import type { CurrentStockItem, StockTransfer, TransferStatus, WarehouseLocationOption } from "@/features/transfers/services/transferService";
import { getHttpErrorMessage } from "@/shared/services/httpClient";

import { usePermissions } from "@/shared/auth/usePermissions";

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

function stockLabel(item: CurrentStockItem): string {
    const available = Number(item.available_quantity ?? 0).toLocaleString("vi-VN");
    const batch = item.lot_number ? ` - Lô ${item.lot_number}` : "";
    return `${item.sku} - ${item.variant_name || item.product_name}${batch} | ${item.location_code} | còn ${available}`;
}

function locationLabel(location: WarehouseLocationOption): string {
    return `${location.code} - Khu ${location.zone_code}, kệ ${location.shelf_code}, tầng ${String(location.layer_no).padStart(2, "0")}`;
}

export default function TransfersPage() {
    const { hasPermission } = usePermissions();
    const [transfers, setTransfers] = useState<StockTransfer[]>([]);
    const [stockItems, setStockItems] = useState<CurrentStockItem[]>([]);
    const [locations, setLocations] = useState<WarehouseLocationOption[]>([]);
    const [formData, setFormData] = useState(initialFormState);
    const [showModal, setShowModal] = useState(false);
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
        const available = Number(selectedStock.available_quantity ?? 0);
        if (!Number.isFinite(quantity) || quantity <= 0 || quantity > available) {
            setError("Số lượng chuyển phải lớn hơn 0 và không vượt tồn khả dụng.");
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

    const columns: ColumnProps<StockTransfer>[] = [
        { key: "transfer_code", title: "Mã phiếu", className: "font-semibold text-gray-900" },
        { key: "status", title: "Trạng thái", render: (value) => statusLabel(value as TransferStatus) },
        { key: "source_warehouse_id", title: "Kho nguồn" },
        { key: "destination_warehouse_id", title: "Kho đích" },
        { key: "note", title: "Ghi chú", render: (value) => String(value || "-") },
        { key: "created_at", title: "Ngày tạo", render: (value) => formatDate(String(value ?? "")) },
        {
            key: "actions",
            title: "Thao tác",
            render: (_, record) => {
                const canConfirm = (record.status === "DRAFT" || record.status === "PENDING") && hasPermission("stock_transfers:confirm");
                const canReverse = record.status === "CONFIRMED" && hasPermission("stock_transfers:reverse");

                return (
                    <div className="flex gap-2">
                        {canConfirm && (
                            <button type="button" onClick={() => handleConfirm(record.id)} className="text-xs font-medium text-green-700 hover:text-green-900">
                                Xác nhận
                            </button>
                        )}
                        {canReverse && (
                            <button type="button" onClick={() => handleReverse(record.id)} className="text-xs font-medium text-red-600 hover:text-red-900">
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
                                    {destinationOptions.map((location) => <option key={location.id} value={location.id}>{locationLabel(location)}</option>)}
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
        </DashboardLayout>
    );
}