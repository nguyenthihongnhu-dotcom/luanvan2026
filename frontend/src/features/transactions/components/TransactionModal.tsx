import React, { useEffect, useRef, useState } from "react";
import { formatQuantity } from "@/shared/utils/number";
import type { Transaction, TransactionItem } from "@/features/transactions/hooks/useTransactions";
import type { AllocationPreviewItem, AllocationPreviewResult, AllocationStrategy, CurrentStockRow } from "@/features/transactions/services/transactionService";
import { batchService } from "@/features/batches/services/batchService";
import type { ProductBatch } from "@/features/batches/services/batchService";
import type { WarehouseOption } from "@/features/warehouses/services/warehouseService";
import type { Partner } from "@/features/partners/services/partnerService";
import type { ProductItem } from "@/features/products/hooks/useProducts";
import type { LocationOption } from "@/features/products/services/productService";

interface TransactionModalProps {
    editingTransaction: Transaction | null;
    formData: {
        soPhieu: string;
        loai: "NHAP" | "XUAT" | "DIEU_CHINH";
        // Các trường này do useForm(initialFormState) cấp nên luôn là chuỗi;
        // <input type="date"> và <select> cũng chỉ nhận chuỗi.
        ngay: string;
        status: string;
        nguoiTao: string;
        maNCC: string;
        maDonHangThamChieu: string;
        maTonKho: string;
        soLuongCu: string;
        soLuongMoi: string;
        lyDo: string;
        nguoiPheDuyet: string;
    };
    error?: string | null;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
    items: TransactionItem[];
    handleAddItemRow: () => void;
    handleRemoveItemRow: (index: number) => void;
    handleItemChange: (index: number, field: keyof TransactionItem, value: string) => void;
    warehouses: WarehouseOption[];
    suppliers?: Partner[];
    productVariants?: ProductItem[];
    locationOptions?: LocationOption[];
    currentStock?: CurrentStockRow[];
    selectedWarehouseId: string;
    setSelectedWarehouseId: (warehouseId: string) => void;
    allocationStrategy: AllocationStrategy;
    setAllocationStrategy: (strategy: AllocationStrategy) => void;
    allocationPreview: AllocationPreviewResult | null;
    previewingItemIndex: number | null;
    handlePreviewAllocation: (index: number) => void;
    /** Điền nhà cung cấp cho phiếu nhập theo lô vừa chọn (lô đã khai nhà cung cấp). */
    onSupplierAutofill?: (supplierId: string) => void;
}

function formatDate(value: string | null): string {
    if (!value) return "Không có";
    return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
}

/** Gom danh sách vị trí thành các mục [id, nhãn] duy nhất theo khu hoặc theo kệ. */
function groupBy(
    locations: LocationOption[],
    idOf: (loc: LocationOption) => number,
    labelOf: (loc: LocationOption) => string,
): Array<[number, string]> {
    const groups = new Map<number, string>();

    locations.forEach((loc) => {
        const id = idOf(loc);
        if (id && !groups.has(id)) {
            groups.set(id, labelOf(loc) || `#${id}`);
        }
    });

    return [...groups.entries()].sort((a, b) => a[1].localeCompare(b[1], "vi"));
}

/**
 * Chọn ô lưu trữ theo đúng thứ tự khu -> kệ -> ô, thay cho một dropdown phẳng
 * đổ toàn bộ ô của kho ra cùng lúc. Kho đã được chọn ở phía trên nên danh sách
 * `locations` truyền vào đây đã lọc sẵn theo kho.
 */
function LocationCascadePicker({
    locations,
    hasWarehouse,
    value,
    onChange,
}: {
    locations: LocationOption[];
    hasWarehouse: boolean;
    value: string;
    onChange: (locationId: string) => void;
}) {
    const selected = locations.find((loc) => String(loc.id) === value) ?? null;
    const [draftZoneId, setDraftZoneId] = useState("");
    const [draftShelfId, setDraftShelfId] = useState("");

    // Chưa chọn kho thì khu của mọi kho sẽ trộn lẫn, nên chặn từ bước đầu.
    const zones = hasWarehouse ? groupBy(locations, (loc) => loc.zoneId, (loc) => loc.zoneLabel) : [];
    // Khi đã chốt được ô thì khu và kệ phải bám theo ô đó, để lúc mở lại phiếu
    // hoặc đổi kho hai ô trên không hiển thị lệch với ô đang chọn.
    const pickedZoneId = selected ? String(selected.zoneId) : draftZoneId;
    // Đổi kho làm khu/kệ đang chọn biến mất khỏi danh sách, khi đó phải quay về
    // rỗng thay vì giữ một id không còn tồn tại.
    const zoneId = zones.some(([id]) => String(id) === pickedZoneId) ? pickedZoneId : "";

    const shelves = groupBy(
        locations.filter((loc) => String(loc.zoneId) === zoneId),
        (loc) => loc.shelfId,
        (loc) => loc.shelfLabel,
    );
    const pickedShelfId = selected ? String(selected.shelfId) : draftShelfId;
    const shelfId = shelves.some(([id]) => String(id) === pickedShelfId) ? pickedShelfId : "";

    const cells = shelfId ? locations.filter((loc) => String(loc.shelfId) === shelfId) : [];

    const selectClass = "w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500";

    return (
        <div className="grid grid-cols-3 gap-2">
            <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Khu (Zone)</label>
                <select
                    value={zoneId}
                    onChange={(event) => {
                        setDraftZoneId(event.target.value);
                        setDraftShelfId("");
                        onChange("");
                    }}
                    className={selectClass}
                >
                    <option value="">{hasWarehouse ? "-- Chọn khu --" : "-- Chọn kho trước --"}</option>
                    {zones.map(([id, label]) => (
                        <option key={id} value={id}>{label}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Kệ (Shelf)</label>
                <select
                    value={shelfId}
                    onChange={(event) => {
                        setDraftShelfId(event.target.value);
                        onChange("");
                    }}
                    className={selectClass}
                >
                    <option value="">{zoneId ? "-- Chọn kệ --" : "-- Chọn khu trước --"}</option>
                    {shelves.map(([id, label]) => (
                        <option key={id} value={id}>{label}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Ô lưu trữ</label>
                <select
                    required
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className={selectClass}
                >
                    <option value="">{shelfId ? "-- Chọn ô --" : "-- Chọn kệ trước --"}</option>
                    {cells.map((loc) => (
                        <option key={loc.id} value={loc.id}>{loc.label} (ID #{loc.id})</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

/**
 * Chọn hàng cần điều chỉnh bằng cách bấm thẳng vào một dòng tồn đang có, thay vì
 * tự dò lại khu/kệ/ô. Chọn xong là điền sẵn cả ô lưu trữ lẫn lô, người dùng chỉ
 * còn nhập số lượng. Đây cũng là cách chặn lỗi điều chỉnh giảm vào một ô không
 * hề có tồn (STOCK_LOCATION_NOT_FOUND).
 *
 * Vẫn để lối chọn thủ công cho trường hợp điều chỉnh tăng vào một ô còn trống.
 */
function AdjustmentStockPicker({
    stockRows,
    locations,
    hasWarehouse,
    locationId,
    batchId,
    onPick,
}: {
    stockRows: CurrentStockRow[];
    locations: LocationOption[];
    hasWarehouse: boolean;
    locationId: string;
    batchId: string;
    onPick: (locationId: string, batchId: string) => void;
}) {
    const keyOf = (row: CurrentStockRow) => `${row.locationId}:${row.batchId ?? ""}`;
    const currentKey = locationId ? `${locationId}:${batchId}` : "";
    const matched = stockRows.find((row) => keyOf(row) === currentKey);
    const [manual, setManual] = useState(false);
    // Sản phẩm chưa có tồn nào trong kho thì không có gì để chọn: đi thẳng vào
    // chọn ô thủ công, thay vì bắt người dùng mở một dropdown chỉ có dòng báo rỗng.
    const noStock = hasWarehouse && stockRows.length === 0;
    // Đang chỉ vào một ô không nằm trong danh sách tồn thì chắc chắn là chọn tay.
    const isManual = manual || noStock || (Boolean(locationId) && !matched);

    return (
        <div className="space-y-2">
            {noStock ? (
                <p className="text-xs text-gray-500">
                    Sản phẩm chưa có tồn trong kho này — chọn ô để nhập hàng vào.
                </p>
            ) : (
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Tồn hiện có</label>
                    <select
                        value={isManual ? "__manual__" : currentKey}
                        onChange={(event) => {
                            if (event.target.value === "__manual__") {
                                setManual(true);
                                onPick("", "");
                                return;
                            }
                            setManual(false);
                            const picked = stockRows.find((row) => keyOf(row) === event.target.value);
                            onPick(picked ? String(picked.locationId) : "", picked?.batchId ? String(picked.batchId) : "");
                        }}
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500"
                    >
                        <option value="">
                            {!hasWarehouse
                                ? "-- Chọn kho trước --"
                                : stockRows.length === 0
                                    ? "-- Sản phẩm chưa có tồn trong kho này --"
                                    : "-- Chọn nơi đang có hàng --"}
                        </option>
                        {stockRows.map((row) => (
                            <option key={keyOf(row)} value={keyOf(row)}>
                                {row.locationCode}
                                {row.batchId ? ` — Lô #${row.batchId}${row.lotNumber ? ` (${row.lotNumber})` : ""}` : " — Không theo lô"}
                                {` — tồn ${formatQuantity(row.quantity)}`}
                            </option>
                        ))}
                        <option value="__manual__">-- Chọn ô khác (thêm vào ô trống) --</option>
                    </select>
                </div>
            )}
            {isManual && (
                <LocationCascadePicker
                    locations={locations}
                    hasWarehouse={hasWarehouse}
                    value={locationId}
                    onChange={(nextLocationId) => onPick(nextLocationId, "")}
                />
            )}
        </div>
    );
}

const batchStatusNote: Record<ProductBatch["status"], string> = {
    ACTIVE: "",
    NEAR_EXPIRY: "cận hạn",
    EXPIRED: "hết hạn",
    BLOCKED: "đang khóa",
    DEPLETED: "đã hết",
};

function batchOptionLabel(batch: ProductBatch, supplierName: string): string {
    const parts = [`Lô ${batch.lot_number}`];
    if (batch.expiry_date) parts.push(`HSD ${formatDate(batch.expiry_date)}`);
    if (supplierName) parts.push(supplierName);
    const note = batchStatusNote[batch.status];
    if (note) parts.push(note);
    return parts.join(" • ");
}

/**
 * Chọn lô từ danh sách lô đã khai báo của sản phẩm (bảng product_batches) thay vì
 * bắt người dùng nhớ rồi gõ tay ID lô. Nhà cung cấp đã được khai ngay trên lô nên
 * component trả luôn bản ghi lô về cho nơi gọi để điền nhà cung cấp cho phiếu nhập.
 */
function BatchSelect({
    productVariantId,
    value,
    suppliers,
    onChange,
}: {
    productVariantId: string;
    value: string;
    suppliers: Partner[];
    onChange: (batchId: string, batch: ProductBatch | null) => void;
}) {
    const [batches, setBatches] = useState<ProductBatch[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadFailed, setLoadFailed] = useState(false);
    // Giữ qua ref để effect chỉ chạy lại khi đổi sản phẩm; nếu đưa vào deps thì
    // hàm onChange dựng mới mỗi lần render sẽ khiến effect gọi API vô hạn.
    const onChangeRef = useRef(onChange);
    const valueRef = useRef(value);

    useEffect(() => {
        onChangeRef.current = onChange;
        valueRef.current = value;
    });

    useEffect(() => {
        const variantId = Number(productVariantId);
        if (!variantId) {
            setBatches([]);
            setLoadFailed(false);
            return;
        }

        let cancelled = false;
        setIsLoading(true);
        setLoadFailed(false);
        batchService.listBatches({ productVariantId: variantId })
            .then((rows) => {
                if (cancelled) return;
                setBatches(rows);
                // Đổi sản phẩm làm lô đang chọn không còn thuộc sản phẩm nữa,
                // giữ lại sẽ gửi lên backend một batch_id sai sản phẩm.
                if (valueRef.current && !rows.some((row) => String(row.id) === valueRef.current)) {
                    onChangeRef.current("", null);
                }
            })
            .catch(() => {
                if (cancelled) return;
                setBatches([]);
                setLoadFailed(true);
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => { cancelled = true; };
    }, [productVariantId]);

    const supplierName = (supplierId: number | null) =>
        suppliers.find((supplier) => String(supplier.MaNCC) === String(supplierId))?.TenNCC ?? "";

    const placeholder = !productVariantId
        ? "-- Chọn sản phẩm trước --"
        : isLoading
            ? "Đang tải lô..."
            : loadFailed
                ? "-- Không tải được danh sách lô --"
                : batches.length === 0
                    ? "-- Sản phẩm chưa khai báo lô --"
                    : "-- Không theo lô --";

    return (
        <select
            value={value}
            disabled={!productVariantId || isLoading}
            onChange={(event) => {
                const batchId = event.target.value;
                onChange(batchId, batches.find((row) => String(row.id) === batchId) ?? null);
            }}
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500 disabled:bg-gray-100"
        >
            <option value="">{placeholder}</option>
            {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                    {batchOptionLabel(batch, supplierName(batch.supplier_id))}
                </option>
            ))}
        </select>
    );
}

const formatQty = (value: number) => Number(value).toLocaleString("vi-VN");

/**
 * Cho người điều chỉnh thấy mình đang tác động lên con số nào: tồn hiện tại ở ô
 * nguồn, ở ô đích, tổng tồn trong kho, và số sau khi phiếu được duyệt. Thiếu
 * phần này thì thao tác chỉ là nhập số vào chỗ trống, và sai sót chỉ lộ ra khi
 * duyệt phiếu (INSUFFICIENT_STOCK).
 */
function AdjustmentSummary({
    stockRows,
    item,
}: {
    stockRows: CurrentStockRow[];
    item: TransactionItem;
}) {
    if (!item.productVariantId) return null;

    const quantity = Number(item.quantity) || 0;
    const targetQuantity = Number(item.targetQuantity) || 0;
    const totalInWarehouse = stockRows.reduce((sum, row) => sum + row.quantity, 0);

    const sourceRow = stockRows.find(
        (row) => String(row.locationId) === item.locationId
            && String(row.batchId ?? "") === (item.batchId || ""),
    );
    const sourceQty = sourceRow?.quantity ?? 0;
    const targetRow = stockRows.find((row) => String(row.locationId) === item.targetLocationId);
    const targetQty = targetRow?.quantity ?? 0;

    const movesOut = item.adjustmentMode !== "QUANTITY" || item.adjustmentDirection === "OUT";
    const sourceAfter = item.adjustmentMode === "QUANTITY"
        ? sourceQty + (item.adjustmentDirection === "IN" ? quantity : -quantity)
        : sourceQty - quantity;
    const targetAfter = targetQty + (item.adjustmentMode === "BOTH" ? targetQuantity : quantity);
    const shortOfStock = movesOut && quantity > sourceQty;

    return (
        <div className="col-span-12 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-gray-600">
                <span>
                    Tổng tồn trong kho: <strong className="text-gray-900">{formatQty(totalInWarehouse)}</strong>
                </span>
                {item.locationId && (
                    <span>
                        Ô hiện tại: <strong className="text-gray-900">{formatQty(sourceQty)}</strong>
                        {quantity > 0 && <> → <strong className={shortOfStock ? "text-red-600" : "text-gray-900"}>{formatQty(sourceAfter)}</strong></>}
                    </span>
                )}
                {item.adjustmentMode !== "QUANTITY" && item.targetLocationId && (
                    <span>
                        Ô chuyển đến: <strong className="text-gray-900">{formatQty(targetQty)}</strong>
                        {(quantity > 0 || targetQuantity > 0) && <> → <strong className="text-green-700">{formatQty(targetAfter)}</strong></>}
                    </span>
                )}
            </div>
            {shortOfStock && (
                <p className="mt-1 font-semibold text-red-600">
                    Ô hiện tại chỉ có {formatQty(sourceQty)} — không đủ để trừ {formatQty(quantity)}. Phiếu sẽ bị từ chối khi duyệt.
                </p>
            )}
        </div>
    );
}

export default function TransactionModal({
    editingTransaction,
    formData,
    error,
    handleInputChange,
    handleSubmit,
    onClose,
    items,
    handleAddItemRow,
    handleRemoveItemRow,
    handleItemChange,
    warehouses,
    suppliers = [],
    productVariants = [],
    locationOptions = [],
    currentStock = [],
    selectedWarehouseId,
    setSelectedWarehouseId,
    allocationStrategy,
    setAllocationStrategy,
    allocationPreview,
    previewingItemIndex,
    handlePreviewAllocation,
    onSupplierAutofill,
}: TransactionModalProps) {
    const [manualPickMap, setManualPickMap] = useState<Record<number, boolean>>({});

    const isIssue = formData.loai === "XUAT";
    const isAdjustment = formData.loai === "DIEU_CHINH";
    // Số phiếu do backend sinh theo dạng <tiền tố>-YYYYMM-NNN, ở đây chỉ báo trước cho người dùng.
    const codePrefixLabel = isIssue ? "PX-…" : isAdjustment ? "DC-…" : "PN-…";
    const isShortAllocated = allocationPreview ? allocationPreview.allocatedQuantity < allocationPreview.requestedQuantity : false;

    const selectedSupplier = suppliers.find((s) => String(s.MaNCC) === String(formData.maNCC));

    const isSupplierMatch = (pv: ProductItem) => {
        if (!formData.maNCC) return true;
        const sId = String(formData.maNCC);
        const skuName = `${pv.sku} ${pv.name}`.toUpperCase();
        if (sId === "1") return skuName.includes("FRISO") || skuName.includes("SUA");
        if (sId === "2") return skuName.includes("HUG");
        if (sId === "3") return skuName.includes("CHICCO") || skuName.includes("HEINZ") || skuName.includes("PIGEON") || skuName.includes("MOONY");
        return true;
    };

    const supplierMatchedVariants = productVariants.filter(isSupplierMatch);
    const otherVariants = productVariants.filter((pv) => !isSupplierMatch(pv));
    const filteredLocations = locationOptions.filter((loc) => !selectedWarehouseId || String(loc.warehouseId) === String(selectedWarehouseId));

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between border-b border-gray-100 bg-pink-50 px-6 py-4">
                    <h2 className="text-lg font-bold text-pink-700">{editingTransaction ? "Chỉnh sửa giao dịch" : "Thêm giao dịch mới"}</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold" aria-label="Đóng">×</button>
                </div>
                <form onSubmit={handleSubmit} className="max-h-[calc(92vh-72px)] space-y-4 overflow-y-auto p-6">
                    {error && (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 font-medium">
                            ⚠️ {error}
                        </div>
                    )}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Số phiếu</label>
                            <div className="w-full rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                                {editingTransaction ? formData.soPhieu : `Tự sinh khi lưu (${codePrefixLabel})`}
                            </div>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Loại giao dịch</label>
                            <select name="loai" value={formData.loai} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500">
                                <option value="NHAP">Phiếu nhập kho</option>
                                <option value="XUAT">Phiếu xuất kho</option>
                                <option value="DIEU_CHINH">Phiếu điều chỉnh</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                {isIssue ? "Kho xuất hàng" : isAdjustment ? "Kho điều chỉnh" : "Kho nhập hàng"} <span className="text-pink-600">*</span>
                            </label>
                            <select
                                value={selectedWarehouseId}
                                onChange={(event) => setSelectedWarehouseId(event.target.value)}
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                                required
                            >
                                <option value="">-- Chọn kho thực hiện --</option>
                                {warehouses.map((warehouse) => (
                                    <option key={warehouse.id} value={warehouse.id}>{warehouse.code} - {warehouse.name ?? "Không tên"}</option>
                                ))}
                            </select>
                        </div>

                        {isIssue && (
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Chiến lược xuất kho</label>
                                <select
                                    value={allocationStrategy}
                                    onChange={(event) => setAllocationStrategy(event.target.value as AllocationStrategy)}
                                    className="w-full rounded-md border border-pink-300 bg-pink-50/50 px-3 py-2 text-sm font-semibold text-pink-800 outline-none focus:ring-2 focus:ring-pink-500"
                                >
                                    <option value="FEFO">FEFO - Hết hạn trước xuất trước (Khuyến nghị)</option>
                                    <option value="FIFO">FIFO - Nhập trước xuất trước</option>
                                </select>
                            </div>
                        )}

                        {formData.loai === "NHAP" && (
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Nhà cung cấp</label>
                                <select name="maNCC" value={formData.maNCC} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500">
                                    <option value="">-- Chọn Nhà cung cấp --</option>
                                    {suppliers.map((supplier) => (
                                        <option key={supplier.MaNCC} value={supplier.MaNCC}>
                                            {supplier.TenNCC} ({supplier.NguoiLienHe ? `LH: ${supplier.NguoiLienHe}` : `ID: #${supplier.MaNCC}`})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Ngày thực hiện</label>
                            <input type="date" name="ngay" required value={formData.ngay} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                        </div>

                        {(isIssue || formData.loai === "NHAP") && (
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    {isIssue ? "Mã đơn hàng tham chiếu" : "Mã chứng từ / Đơn nhập"}
                                </label>
                                <input
                                    type="text"
                                    name="maDonHangThamChieu"
                                    value={formData.maDonHangThamChieu}
                                    onChange={handleInputChange}
                                    placeholder={isIssue ? "VD: DH-SHOPEE-01, SO-2026-01 (tùy chọn)" : "VD: PO-2026-001, HĐ-8821 (tùy chọn)"}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                                />
                            </div>
                        )}

                        <div className="md:col-span-3">
                            <label className="mb-1 block text-sm font-medium text-gray-700">Ghi chú / lý do</label>
                            <textarea
                                name="lyDo"
                                value={formData.lyDo}
                                onChange={handleInputChange}
                                placeholder={isIssue ? "Ghi chú lý do xuất kho..." : isAdjustment ? "Lý do điều chỉnh kiểm kê hoặc chuyển ô..." : "Ghi chú nhập kho..."}
                                className="min-h-[64px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <label className="text-sm font-bold text-pink-700">Dòng hàng chi tiết</label>
                                {isIssue && (
                                    <span className="rounded-md border border-pink-200 bg-pink-50 px-2 py-0.5 text-xs text-pink-700 font-medium">
                                        ⚡ Xuất kho tự động phân bổ Lô & Vị trí theo <strong>{allocationStrategy}</strong>. Chỉ cần chọn SP & Số lượng.
                                    </span>
                                )}
                                {formData.loai === "NHAP" && selectedSupplier && (
                                    <span className="rounded-md border border-pink-200 bg-pink-50 px-2 py-0.5 text-xs text-pink-700 font-medium">
                                        📌 Ưu tiên sản phẩm thuộc <strong>{selectedSupplier.TenNCC}</strong>
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={handleAddItemRow}
                                className="rounded-lg bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-pink-700 transition"
                            >
                                + Thêm dòng hàng
                            </button>
                        </div>
                        <div className="space-y-3">
                            {items.map((item, index) => {
                                const variantStockRows = currentStock
                                    .filter((s) => (!selectedWarehouseId || String(s.warehouseId) === String(selectedWarehouseId))
                                        && String(s.productVariantId) === String(item.productVariantId));
                                // Phân bổ FEFO/FIFO chỉ lấy phần khả dụng (tồn trừ giữ chỗ), nên nhãn
                                // phải bám theo số đó; lấy tổng tồn sẽ hứa nhiều hơn số thật sự xuất được.
                                const variantAvailQty = variantStockRows.reduce((sum, r) => sum + Number(r.availableQuantity || 0), 0);
                                const variantReservedQty = variantStockRows.reduce((sum, r) => sum + Number(r.reservedQuantity || 0), 0);

                                return (
                                    <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-3 shadow-xs transition hover:border-gray-300">
                                        {isIssue ? (
                                            /* Layout tinh gọn cho Phiếu Xuất Kho */
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-12 items-start gap-2">
                                                    <div className="col-span-12 md:col-span-6">
                                                        <label className="mb-1 block text-xs font-semibold text-gray-700">
                                                            Sản phẩm / Biến thể (SKU) <span className="text-pink-600">*</span>
                                                        </label>
                                                        <select
                                                            required
                                                            value={item.productVariantId}
                                                            onChange={(e) => handleItemChange(index, "productVariantId", e.target.value)}
                                                            className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500 font-medium text-gray-800"
                                                        >
                                                            <option value="">-- Chọn sản phẩm cần xuất --</option>
                                                            {productVariants.map((pv) => (
                                                                <option key={pv.id} value={pv.id}>
                                                                    {pv.sku} - {pv.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {item.productVariantId && (
                                                            <div className="mt-1 flex items-center gap-1.5">
                                                                {variantAvailQty > 0 ? (
                                                                    <>
                                                                        <span className="inline-flex items-center rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                                                                            📦 Khả dụng tại kho: {formatQty(variantAvailQty)}
                                                                        </span>
                                                                        {variantReservedQty > 0 && (
                                                                            <span
                                                                                className="inline-flex items-center rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200"
                                                                                title="Phần đang bị phiếu khác giữ chỗ, không nằm trong số xuất được"
                                                                            >
                                                                                🔒 Đang giữ chỗ: {formatQty(variantReservedQty)}
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <span className="inline-flex items-center rounded bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
                                                                        ⚠️ Hết hàng khả dụng tại kho này
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="col-span-6 md:col-span-2">
                                                        <label className="mb-1 block text-xs font-semibold text-gray-700">
                                                            Số lượng xuất <span className="text-pink-600">*</span>
                                                        </label>
                                                        <input
                                                            required
                                                            type="number"
                                                            min="0.001"
                                                            step="0.001"
                                                            max={variantAvailQty > 0 ? variantAvailQty : undefined}
                                                            value={item.quantity}
                                                            onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                                            placeholder="VD: 10"
                                                            className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500 font-bold text-gray-900"
                                                        />
                                                        {/* Báo ngay tại ô nhập, thay vì để người dùng bấm lưu rồi mới nhận phân bổ thiếu. */}
                                                        {Number(item.quantity) > variantAvailQty && variantAvailQty > 0 && (
                                                            <p className="mt-1 text-[11px] font-medium text-rose-600">
                                                                Vượt tồn khả dụng, chỉ xuất được tối đa {formatQty(variantAvailQty)}.
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="col-span-6 md:col-span-2">
                                                        <label className="mb-1 block text-xs font-medium text-gray-600">Ghi chú</label>
                                                        <input
                                                            value={item.note}
                                                            onChange={(e) => handleItemChange(index, "note", e.target.value)}
                                                            placeholder="Ghi chú dòng"
                                                            className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500"
                                                        />
                                                    </div>

                                                    <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-1.5 pt-4 md:pt-5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePreviewAllocation(index)}
                                                            disabled={previewingItemIndex === index || !item.productVariantId || !item.quantity || Number(item.quantity) <= 0}
                                                            className="rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-xs hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 transition"
                                                            title="Xem trước lộ trình lấy hàng theo FEFO/FIFO"
                                                        >
                                                            {previewingItemIndex === index ? "Đang tính..." : "🔍 Xem phân bổ"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveItemRow(index)}
                                                            className="rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                                                            title="Xóa dòng này"
                                                        >
                                                            Xóa
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => setManualPickMap((prev) => ({ ...prev, [index]: !prev[index] }))}
                                                        className="text-[11px] text-gray-500 hover:text-pink-600 underline decoration-dotted"
                                                    >
                                                        {manualPickMap[index] ? "▲ Ẩn chỉ định vị trí/lô thủ công" : "⚙️ Chỉ định vị trí / lô thủ công (nếu không xuất tự động)"}
                                                    </button>
                                                </div>

                                                {manualPickMap[index] && (
                                                    <div className="mt-2 rounded-md border border-gray-200 bg-white p-3 space-y-2">
                                                        <p className="text-[11px] text-amber-700 font-medium">
                                                            ⚠️ Khi lưu theo chiến lược {allocationStrategy}, hệ thống sẽ tự động gán vị trí & lô tối ưu nếu các ô dưới đây để trống.
                                                        </p>
                                                        <div className="grid grid-cols-12 gap-2">
                                                            <div className="col-span-12 md:col-span-4">
                                                                <label className="mb-1 block text-xs font-medium text-gray-600">Lô hàng (để trống = tự động)</label>
                                                                <BatchSelect
                                                                    productVariantId={item.productVariantId}
                                                                    value={item.batchId}
                                                                    suppliers={suppliers}
                                                                    onChange={(batchId) => handleItemChange(index, "batchId", batchId)}
                                                                />
                                                            </div>
                                                            <div className="col-span-12 md:col-span-8">
                                                                <label className="mb-1 block text-xs font-medium text-gray-600">Ô xuất thủ công (tùy chọn)</label>
                                                                <LocationCascadePicker
                                                                    locations={filteredLocations}
                                                                    hasWarehouse={Boolean(selectedWarehouseId)}
                                                                    value={item.locationId}
                                                                    onChange={(locationId) => handleItemChange(index, "locationId", locationId)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            /* Layout cho Phiếu Nhập Kho và Phiếu Điều Chỉnh */
                                            <div className="grid grid-cols-12 items-end gap-2">
                                                <div className="col-span-12 md:col-span-4">
                                                    <label className="mb-1 block text-xs font-medium text-gray-600">Sản phẩm / Biến thể (Variant ID)</label>
                                                    <select
                                                        required
                                                        value={item.productVariantId}
                                                        onChange={(e) => handleItemChange(index, "productVariantId", e.target.value)}
                                                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500"
                                                    >
                                                        <option value="">-- Chọn sản phẩm --</option>
                                                        {formData.maNCC && supplierMatchedVariants.length > 0 ? (
                                                            <>
                                                                <optgroup label={`Sản phẩm thuộc ${selectedSupplier ? selectedSupplier.TenNCC : "Nhà cung cấp đã chọn"}`}>
                                                                    {supplierMatchedVariants.map((pv) => (
                                                                        <option key={pv.id} value={pv.id}>
                                                                            {pv.sku} - {pv.name}
                                                                        </option>
                                                                    ))}
                                                                </optgroup>
                                                                {otherVariants.length > 0 && (
                                                                    <optgroup label="Tất cả sản phẩm khác">
                                                                        {otherVariants.map((pv) => (
                                                                            <option key={pv.id} value={pv.id}>
                                                                                {pv.sku} - {pv.name}
                                                                            </option>
                                                                        ))}
                                                                    </optgroup>
                                                                )}
                                                            </>
                                                        ) : (
                                                            productVariants.map((pv) => (
                                                                <option key={pv.id} value={pv.id}>
                                                                    {pv.sku} - {pv.name}
                                                                </option>
                                                            ))
                                                        )}
                                                    </select>
                                                </div>

                                                {!isAdjustment && (
                                                    <div className="col-span-6 md:col-span-2">
                                                        <label className="mb-1 block text-xs font-medium text-gray-600">Lô hàng</label>
                                                        <BatchSelect
                                                            productVariantId={item.productVariantId}
                                                            value={item.batchId}
                                                            suppliers={suppliers}
                                                            onChange={(batchId, batch) => {
                                                                handleItemChange(index, "batchId", batchId);
                                                                // Nhà cung cấp đã khai ở lô nên lấy thẳng từ đó, khỏi chọn lại ở đầu phiếu.
                                                                if (batch?.supplier_id && String(batch.supplier_id) !== String(formData.maNCC)) {
                                                                    onSupplierAutofill?.(String(batch.supplier_id));
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                )}

                                                {isAdjustment && (
                                                    <div className="col-span-6 md:col-span-2">
                                                        <label className="mb-1 block text-xs font-medium text-gray-600">Kiểu điều chỉnh</label>
                                                        <select
                                                            value={item.adjustmentMode}
                                                            onChange={(e) => handleItemChange(index, "adjustmentMode", e.target.value)}
                                                            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500"
                                                        >
                                                            <option value="QUANTITY">Sửa số lượng</option>
                                                            <option value="LOCATION">Chuyển vị trí</option>
                                                            <option value="BOTH">Chuyển vị trí và sửa số</option>
                                                        </select>
                                                    </div>
                                                )}

                                                <div className={isAdjustment ? "col-span-12 md:col-span-6" : "col-span-12 md:col-span-4"}>
                                                    {isAdjustment ? (
                                                        <AdjustmentStockPicker
                                                            stockRows={currentStock.filter((row) =>
                                                                String(row.warehouseId) === String(selectedWarehouseId)
                                                                && String(row.productVariantId) === String(item.productVariantId),
                                                            )}
                                                            locations={filteredLocations}
                                                            hasWarehouse={Boolean(selectedWarehouseId)}
                                                            locationId={item.locationId}
                                                            batchId={item.batchId}
                                                            onPick={(locationId, batchId) => {
                                                                handleItemChange(index, "locationId", locationId);
                                                                handleItemChange(index, "batchId", batchId);
                                                            }}
                                                        />
                                                    ) : (
                                                        <LocationCascadePicker
                                                            locations={filteredLocations}
                                                            hasWarehouse={Boolean(selectedWarehouseId)}
                                                            value={item.locationId}
                                                            onChange={(locationId) => handleItemChange(index, "locationId", locationId)}
                                                        />
                                                    )}
                                                </div>

                                                {isAdjustment && item.adjustmentMode !== "QUANTITY" && (
                                                    <div className="col-span-12 md:col-span-6">
                                                        <p className="mb-1 text-xs font-semibold text-pink-700">Chuyển đến ô</p>
                                                        <LocationCascadePicker
                                                            locations={filteredLocations}
                                                            hasWarehouse={Boolean(selectedWarehouseId)}
                                                            value={item.targetLocationId}
                                                            onChange={(locationId) => handleItemChange(index, "targetLocationId", locationId)}
                                                        />
                                                    </div>
                                                )}

                                                <div className="col-span-6 md:col-span-2">
                                                    <label className="mb-1 block text-xs font-medium text-gray-600">
                                                        {isAdjustment && item.adjustmentMode !== "QUANTITY" ? "Số rời ô cũ" : "Số lượng"}
                                                    </label>
                                                    <input
                                                        required
                                                        type="number"
                                                        min="0.001"
                                                        step="0.001"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500 font-bold"
                                                    />
                                                </div>

                                                {isAdjustment && item.adjustmentMode === "BOTH" && (
                                                    <div className="col-span-6 md:col-span-2">
                                                        <label className="mb-1 block text-xs font-medium text-gray-600">Số vào ô mới</label>
                                                        <input
                                                            required
                                                            type="number"
                                                            min="0.001"
                                                            step="0.001"
                                                            value={item.targetQuantity}
                                                            onChange={(e) => handleItemChange(index, "targetQuantity", e.target.value)}
                                                            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500"
                                                        />
                                                    </div>
                                                )}

                                                {isAdjustment && item.adjustmentMode === "QUANTITY" && (
                                                    <div className="col-span-6 md:col-span-2">
                                                        <label className="mb-1 block text-xs font-medium text-gray-600">Hướng</label>
                                                        <select
                                                            value={item.adjustmentDirection}
                                                            onChange={(e) => handleItemChange(index, "adjustmentDirection", e.target.value as TransactionItem["adjustmentDirection"])}
                                                            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500"
                                                        >
                                                            <option value="IN">Tăng</option>
                                                            <option value="OUT">Giảm</option>
                                                        </select>
                                                    </div>
                                                )}

                                                <div className={isAdjustment ? "col-span-6 md:col-span-3" : "col-span-6 md:col-span-2"}>
                                                    <label className="mb-1 block text-xs font-medium text-gray-600">Ghi chú</label>
                                                    <input
                                                        value={item.note}
                                                        onChange={(e) => handleItemChange(index, "note", e.target.value)}
                                                        placeholder="Ghi chú dòng"
                                                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500"
                                                    />
                                                </div>

                                                <div className="col-span-6 md:col-span-1 flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItemRow(index)}
                                                        className="rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>

                                                {isAdjustment && (
                                                    <AdjustmentSummary
                                                        stockRows={currentStock.filter((row) =>
                                                            String(row.warehouseId) === String(selectedWarehouseId)
                                                            && String(row.productVariantId) === String(item.productVariantId),
                                                        )}
                                                        item={item}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {isIssue && allocationPreview && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 pb-2">
                                <div>
                                    <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                                        📋 Lộ trình lấy hàng tự động (Picking Route)
                                        <span className="rounded bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                                            {allocationPreview.strategy}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-emerald-800 mt-0.5">
                                        Yêu cầu xuất: <strong>{allocationPreview.requestedQuantity}</strong> — Phân bổ được: <strong>{allocationPreview.allocatedQuantity}</strong>
                                    </p>
                                </div>
                                {isShortAllocated && (
                                    <span className="rounded-full border border-rose-300 bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                                        ⚠️ Kho không đủ tồn (Thiếu {allocationPreview.requestedQuantity - allocationPreview.allocatedQuantity})
                                    </span>
                                )}
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-emerald-200 bg-white">
                                <table className="min-w-full text-left text-xs">
                                    <thead className="bg-emerald-100/70 text-emerald-900 font-bold">
                                        <tr>
                                            <th className="px-3 py-2.5">Vị trí lấy hàng</th>
                                            <th className="px-3 py-2.5">Mã Lô</th>
                                            <th className="px-3 py-2.5">Hạn sử dụng</th>
                                            <th className="px-3 py-2.5">Ngày nhập</th>
                                            <th className="px-3 py-2.5 text-right">Số lượng lấy</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-gray-800">
                                        {allocationPreview.items.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-3 py-4 text-center text-gray-500 italic">
                                                    Không tìm thấy tồn kho khả dụng cho sản phẩm này tại kho đã chọn.
                                                </td>
                                            </tr>
                                        ) : (
                                            allocationPreview.items.map((allocation: AllocationPreviewItem) => (
                                                <tr key={allocation.stockLocationId} className="hover:bg-emerald-50/40">
                                                    <td className="px-3 py-2.5 font-bold text-pink-700">{allocation.locationCode}</td>
                                                    <td className="px-3 py-2.5">{allocation.lotNumber ? `Lô ${allocation.lotNumber}` : (allocation.batchId ? `#${allocation.batchId}` : "Không có")}</td>
                                                    <td className="px-3 py-2.5">{formatDate(allocation.expiryDate)}</td>
                                                    <td className="px-3 py-2.5">{formatDate(allocation.receivedDate)}</td>
                                                    <td className="px-3 py-2.5 text-right font-bold text-emerald-700">{formatQuantity(allocation.quantity)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 border-t border-gray-100 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                            Hủy
                        </button>
                        <button type="submit" className="flex-1 rounded-md bg-pink-600 px-4 py-2 text-sm font-bold text-white hover:bg-pink-700 shadow-sm transition">
                            Lưu giao dịch
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}