/**
 * StockPage.tsx - Giao diện Quản lý Tồn kho (/stock)
 * 
 * PHÂN HỆ THÔNG BÁO (NOTIFICATIONS):
 * 1. Warehouse Context Badge (màu hồng): Thông báo kho hiện tại đang chọn tra cứu.
 * 2. Loading State Feedback: Nút bấm "Đang tải" / "Đang xem" & hiệu ứng AG-Grid skeleton.
 * 3. Allocation Results: Bảng viền xanh hiển thị vị trí/lô được phân bổ xuất hoặc "Không có tồn khả dụng".
 * 4. Header Bell Icon: Thông báo sự kiện mới toàn hệ thống (phiếu mới, yêu cầu duyệt...).
 * 
 * PHÂN HỆ CẢNH BÁO (WARNINGS & ALERTS):
 * 1. Near-Expiry Warning Table: Cảnh báo danh sách lô hàng cận date (cột "Còn lại" x ngày) để ưu tiên xuất FEFO.
 * 2. Shortage Warning Badge (màu đỏ): Cảnh báo "Không đủ tồn" khi số lượng cần xuất > khả dụng.
 * 3. Error Banner Alert (khung đỏ): Cảnh báo lỗi thiếu dữ liệu, sai định dạng hoặc lỗi HTTP Backend.
 * 
 * Ý NGHĨA CÁC FIELD DỮ LIỆU TỒN KHO:
 * - quantity (Tồn): Tổng số lượng vật lý thực tế đang nằm tại vị trí kệ/ô trong kho.
 * - reserved_quantity (Đã giữ): Số lượng hàng đã được giữ chỗ cho các đơn hàng/phiếu xuất chưa hoàn tất.
 * - available_quantity (Khả dụng): Số lượng thực tế rảnh rỗi có thể tiếp tục bán hoặc phân bổ (Khả dụng = Tồn - Đã giữ).
 * 
 * API CLIENT SERVICE:
 * - stockService.listCurrentStock: GET /stock/current
 * - stockService.listNearExpiryStock: GET /stock/near-expiry
 * - stockService.previewAllocation: GET /stock/allocation
 */
import { useEffect, useMemo, useState } from "react";
import type { ColDef } from "ag-grid-community";
import DashboardLayout from "@/layouts/dashboard/DashboardLayout";
import DataGridLayout from "@/shared/ui/DataGrid/DataGridLayout";
import { warehouseService } from "@/features/warehouses/services/warehouseService";
import type { WarehouseOption } from "@/features/warehouses/services/warehouseService";
import { stockService } from "@/features/stock/services/stockService";
import type { CurrentStockItem, NearExpiryStockItem } from "@/features/stock/services/stockService";
import type { AllocationPreviewResult, AllocationStrategy } from "@/features/transactions/services/transactionService";
import { getHttpErrorMessage } from "@/shared/services/httpClient";

function formatNumber(value: unknown): string {
    return Number(value ?? 0).toLocaleString("vi-VN");
}

function formatDate(value: string | null): string {
    if (!value) return "Không có";
    return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
}

function toNumber(value: string | number | null | undefined): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function warehouseLabel(warehouse: WarehouseOption): string {
    return `${warehouse.code} - ${warehouse.name ?? "Không tên"}`;
}

export default function StockPage() {
    const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
    const [productVariantId, setProductVariantId] = useState("");
    const [allocationQuantity, setAllocationQuantity] = useState("");
    const [allocationStrategy, setAllocationStrategy] = useState<AllocationStrategy>("FEFO");
    const [currentStock, setCurrentStock] = useState<CurrentStockItem[]>([]);
    const [nearExpiryStock, setNearExpiryStock] = useState<NearExpiryStockItem[]>([]);
    const [allocationPreview, setAllocationPreview] = useState<AllocationPreviewResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedWarehouse = useMemo(
        () => warehouses.find((warehouse) => String(warehouse.id) === selectedWarehouseId),
        [selectedWarehouseId, warehouses],
    );

    async function loadStock(nextWarehouseId = selectedWarehouseId, nextProductVariantId = productVariantId) {
        const warehouseId = Number(nextWarehouseId);
        const variantId = Number(nextProductVariantId);
        const filters = {
            warehouseId: Number.isFinite(warehouseId) && warehouseId > 0 ? warehouseId : undefined,
            productVariantId: Number.isFinite(variantId) && variantId > 0 ? variantId : undefined,
        };

        setIsLoading(true);
        setError(null);
        try {
            const [stockRows, expiryRows] = await Promise.all([
                stockService.listCurrentStock(filters),
                stockService.listNearExpiryStock({ warehouseId: filters.warehouseId }),
            ]);
            setCurrentStock(stockRows);
            setNearExpiryStock(expiryRows);
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không tải được dữ liệu tồn kho từ backend"));
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        let isMounted = true;

        async function loadInitialData() {
            setIsLoading(true);
            setError(null);
            try {
                const warehouseRows = await warehouseService.listWarehouses();
                if (!isMounted) return;
                const defaultWarehouseId = warehouseRows[0] ? String(warehouseRows[0].id) : "";
                setWarehouses(warehouseRows);
                setSelectedWarehouseId(defaultWarehouseId);

                const [stockRows, expiryRows] = await Promise.all([
                    stockService.listCurrentStock(defaultWarehouseId ? { warehouseId: Number(defaultWarehouseId) } : {}),
                    stockService.listNearExpiryStock(defaultWarehouseId ? { warehouseId: Number(defaultWarehouseId) } : {}),
                ]);
                if (isMounted) {
                    setCurrentStock(stockRows);
                    setNearExpiryStock(expiryRows);
                }
            } catch (err) {
                console.error(err);
                if (isMounted) setError(getHttpErrorMessage(err, "Không tải được dữ liệu tồn kho từ backend"));
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        void loadInitialData();
        return () => { isMounted = false; };
    }, []);

    async function handlePreviewAllocation() {
        const warehouseId = Number(selectedWarehouseId);
        const variantId = Number(productVariantId);
        const quantity = Number(allocationQuantity);

        if (!Number.isFinite(warehouseId) || warehouseId <= 0) {
            setError("Chọn kho trước khi xem phân bổ.");
            return;
        }

        if (!Number.isFinite(variantId) || variantId <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
            setError("Nhập Variant ID và số lượng hợp lệ trước khi xem phân bổ.");
            return;
        }

        setIsPreviewing(true);
        setError(null);
        try {
            setAllocationPreview(await stockService.previewAllocation({
                warehouseId,
                productVariantId: variantId,
                quantity,
                strategy: allocationStrategy,
            }));
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không xem được phân bổ tồn kho. Kiểm tra dữ liệu tồn và backend."));
            setAllocationPreview(null);
        } finally {
            setIsPreviewing(false);
        }
    }

    const stockColumns = useMemo<ColDef<CurrentStockItem>[]>(() => [
        { field: "sku", headerName: "SKU", pinned: "left", cellClass: "font-semibold text-gray-900", minWidth: 140 },
        {
            headerName: "Sản phẩm",
            valueGetter: ({ data }) => data ? `${data.product_name} - ${data.variant_name}` : "",
            minWidth: 240,
        },
        {
            headerName: "Kho",
            valueGetter: ({ data }) => data ? `${data.warehouse_code} - ${data.warehouse_name}` : "",
            minWidth: 180,
        },
        { field: "location_code", headerName: "Vị trí", minWidth: 130 },
        {
            field: "lot_number",
            headerName: "Lô",
            minWidth: 160,
            // Kèm id lô: số lô nhà sản xuất có thể trùng giữa các lần nhập nên
            // chỉ mình lot_number không đủ để đối chiếu với phiếu.
            valueGetter: ({ data }) => {
                if (!data?.batch_id) return data?.lot_number || "Không có";
                return data.lot_number ? `#${data.batch_id} - ${data.lot_number}` : `#${data.batch_id}`;
            },
        },
        {
            field: "expiry_date",
            headerName: "Hạn sử dụng",
            filter: "agDateColumnFilter",
            minWidth: 150,
            valueFormatter: ({ value }) => formatDate(value as string | null),
        },
        {
            field: "quantity",
            headerName: "Tồn",
            filter: "agNumberColumnFilter",
            type: "rightAligned",
            valueGetter: ({ data }) => toNumber(data?.quantity),
            valueFormatter: ({ value }) => formatNumber(value),
            width: 120,
        },
        {
            field: "reserved_quantity",
            headerName: "Đã giữ",
            filter: "agNumberColumnFilter",
            type: "rightAligned",
            valueGetter: ({ data }) => toNumber(data?.reserved_quantity),
            valueFormatter: ({ value }) => formatNumber(value),
            width: 120,
        },
        {
            field: "available_quantity",
            headerName: "Khả dụng",
            filter: "agNumberColumnFilter",
            type: "rightAligned",
            valueGetter: ({ data }) => toNumber(data?.available_quantity),
            valueFormatter: ({ value }) => formatNumber(value),
            width: 130,
        },
    ], []);

    const expiryColumns = useMemo<ColDef<NearExpiryStockItem>[]>(() => [
        { field: "sku", headerName: "SKU", pinned: "left", cellClass: "font-semibold text-gray-900", minWidth: 140 },
        { field: "product_name", headerName: "Sản phẩm", minWidth: 240 },
        {
            field: "lot_number",
            headerName: "Lô",
            minWidth: 170,
            valueGetter: ({ data }) => {
                if (!data?.batch_id) return data?.lot_number || "Không có";
                return data.lot_number ? `#${data.batch_id} - ${data.lot_number}` : `#${data.batch_id}`;
            },
        },
        { field: "location_code", headerName: "Vị trí", minWidth: 130 },
        {
            field: "expiry_date",
            headerName: "Hạn sử dụng",
            filter: "agDateColumnFilter",
            minWidth: 150,
            valueFormatter: ({ value }) => formatDate(value as string | null),
        },
        {
            field: "days_until_expiry",
            headerName: "Còn lại",
            filter: "agNumberColumnFilter",
            type: "rightAligned",
            valueFormatter: ({ value }) => `${formatNumber(value)} ngày`,
            width: 130,
        },
        {
            field: "available_quantity",
            headerName: "Khả dụng",
            filter: "agNumberColumnFilter",
            type: "rightAligned",
            valueGetter: ({ data }) => toNumber(data?.available_quantity),
            valueFormatter: ({ value }) => formatNumber(value),
            width: 130,
        },
    ], []);

    const allocationShortage = allocationPreview ? allocationPreview.allocatedQuantity < allocationPreview.requestedQuantity : false;

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Tồn kho</h1>
                        <p className="text-sm text-gray-500">Theo dõi tồn khả dụng, lô gần hết hạn và preview xuất kho FEFO/FIFO.</p>
                    </div>
                    {selectedWarehouse && <span className="rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">{warehouseLabel(selectedWarehouse)}</span>}
                </div>

                {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Kho</label>
                            <select value={selectedWarehouseId} onChange={(event) => setSelectedWarehouseId(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500">
                                <option value="">Tất cả kho</option>
                                {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouseLabel(warehouse)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Variant ID</label>
                            <input type="number" min="1" value={productVariantId} onChange={(event) => setProductVariantId(event.target.value)} placeholder="Lọc theo variant" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                        </div>
                        <div className="flex items-end">
                            <button type="button" onClick={() => void loadStock()} disabled={isLoading} className="w-full rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-60">{isLoading ? "Đang tải" : "Lọc tồn kho"}</button>
                        </div>
                        <div className="flex items-end">
                            <button type="button" onClick={() => { setProductVariantId(""); setAllocationPreview(null); void loadStock(selectedWarehouseId, ""); }} className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Xóa lọc variant</button>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-base font-semibold text-gray-800">Preview phân bổ xuất kho</h2>
                        {allocationShortage && <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">Không đủ tồn</span>}
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                        <input type="number" min="1" value={productVariantId} onChange={(event) => setProductVariantId(event.target.value)} placeholder="Variant ID" className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                        <input type="number" min="0.001" step="0.001" value={allocationQuantity} onChange={(event) => setAllocationQuantity(event.target.value)} placeholder="Số lượng cần xuất" className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                        <select value={allocationStrategy} onChange={(event) => setAllocationStrategy(event.target.value as AllocationStrategy)} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500">
                            <option value="FEFO">FEFO</option>
                            <option value="FIFO">FIFO</option>
                        </select>
                        <button type="button" onClick={() => void handlePreviewAllocation()} disabled={isPreviewing} className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60">{isPreviewing ? "Đang xem" : "Xem phân bổ"}</button>
                        <button type="button" onClick={() => setAllocationPreview(null)} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Xóa preview</button>
                    </div>
                    {allocationPreview && (
                        <div className="mt-4 space-y-3">
                            {allocationShortage ? (
                                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                                    <div className="font-semibold text-red-900 mb-1">⚠️ CẢNH BÁO THIẾU HỤT TỒN KHO:</div>
                                    <p>
                                        Yêu cầu xuất <strong>{formatNumber(allocationPreview.requestedQuantity)}</strong> sản phẩm, nhưng tổng tồn khả dụng trong kho chỉ có <strong>{formatNumber(allocationPreview.allocatedQuantity)}</strong> sản phẩm.
                                        Còn thiếu <strong className="text-red-700">{formatNumber(allocationPreview.requestedQuantity - allocationPreview.allocatedQuantity)}</strong> sản phẩm.
                                    </p>
                                    {allocationPreview.items.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-red-200 text-red-900">
                                            <strong>Chi tiết số lượng tại từng vị trí:</strong>
                                            <ul className="mt-1 list-disc pl-4 space-y-0.5">
                                                {allocationPreview.items.map((item) => (
                                                    <li key={item.stockLocationId}>
                                                        Vị trí <strong>{item.locationCode}</strong>: chỉ có <strong>{formatNumber(item.quantity)}</strong> sản phẩm khả dụng {item.lotNumber ? `(Lô: ${item.lotNumber})` : ""}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-xs text-green-800">
                                    <div className="font-semibold text-green-900 mb-1">📢 THÔNG BÁO PHÂN BỔ ĐỦ SỐ LƯỢNG:</div>
                                    <p>
                                        Đã tìm thấy đủ <strong>{formatNumber(allocationPreview.requestedQuantity)}</strong> sản phẩm từ <strong>{allocationPreview.items.length}</strong> vị trí trong kho theo chiến lược <strong>{allocationPreview.strategy}</strong>.
                                    </p>
                                </div>
                            )}

                            <div className="overflow-x-auto rounded-lg border border-green-100">
                                <table className="min-w-full text-left text-xs">
                                    <thead className="bg-green-50 text-green-900">
                                        <tr>
                                            <th className="px-3 py-2 font-semibold">Vị trí</th>
                                            <th className="px-3 py-2 font-semibold">Batch ID</th>
                                            <th className="px-3 py-2 font-semibold">Lô</th>
                                            <th className="px-3 py-2 font-semibold">Hạn sử dụng</th>
                                            <th className="px-3 py-2 font-semibold">Ngày nhập</th>
                                            <th className="px-3 py-2 text-right font-semibold">Số lượng khả dụng trích xuất</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-gray-700">
                                        {allocationPreview.items.length === 0 ? (
                                            <tr><td colSpan={6} className="px-3 py-4 text-center text-gray-500">Không có tồn khả dụng.</td></tr>
                                        ) : allocationPreview.items.map((item) => (
                                            <tr key={item.stockLocationId}>
                                                <td className="px-3 py-2 font-semibold text-gray-900">{item.locationCode}</td>
                                                <td className="px-3 py-2">{item.batchId ?? "Không có"}</td>
                                                <td className="px-3 py-2">{item.lotNumber ?? "Không có"}</td>
                                                <td className="px-3 py-2">{formatDate(item.expiryDate)}</td>
                                                <td className="px-3 py-2">{formatDate(item.receivedDate)}</td>
                                                <td className="px-3 py-2 text-right font-semibold text-green-700">{formatNumber(item.quantity)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <h2 className="text-base font-semibold text-gray-800">Tồn hiện tại</h2>
                    <DataGridLayout
                        columns={stockColumns}
                        getRowId={({ data }) => String(data.stock_location_id)}
                        isLoading={isLoading}
                        rows={currentStock}
                    />
                </div>

                <div className="space-y-3">
                    <h2 className="text-base font-semibold text-gray-800">Lô gần hết hạn</h2>
                    <DataGridLayout
                        columns={expiryColumns}
                        getRowId={({ data }) => `${data.batch_id}-${data.location_code}`}
                        height={420}
                        isLoading={isLoading}
                        rows={nearExpiryStock}
                    />
                </div>
            </div>
        </DashboardLayout>
    );
}
