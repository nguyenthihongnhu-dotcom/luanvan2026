import type { Partner } from "@/features/partners/services/partnerService";
import type { ProductItem } from "@/features/products/hooks/useProducts";
import type { LocationOption } from "@/features/products/services/productService";

interface TransactionModalProps {
    editingTransaction: Transaction | null;
    formData: {
        soPhieu: string;
        loai: "NHAP" | "XUAT" | "DIEU_CHINH";
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
    selectedWarehouseId: string;
    setSelectedWarehouseId: (warehouseId: string) => void;
    allocationStrategy: AllocationStrategy;
    setAllocationStrategy: (strategy: AllocationStrategy) => void;
    allocationPreview: AllocationPreviewResult | null;
    previewingItemIndex: number | null;
    handlePreviewAllocation: (index: number) => void;
}

function formatDate(value: string | null): string {
    if (!value) return "Không có";
    return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
}

export default function TransactionModal({
    editingTransaction,
    formData,
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
    selectedWarehouseId,
    setSelectedWarehouseId,
    allocationStrategy,
    setAllocationStrategy,
    allocationPreview,
    previewingItemIndex,
    handlePreviewAllocation,
}: TransactionModalProps) {
    const isIssue = formData.loai === "XUAT";
    const isAdjustment = formData.loai === "DIEU_CHINH";
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
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Đóng">×</button>
                </div>
                <form onSubmit={handleSubmit} className="max-h-[calc(92vh-72px)] space-y-4 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Số phiếu</label>
                            <input type="text" name="soPhieu" required value={formData.soPhieu} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
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
                            <label className="mb-1 block text-sm font-medium text-gray-700">Ngày thực hiện</label>
                            <input type="date" name="ngay" required value={formData.ngay} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                        </div>
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
                        {isIssue && (
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Mã đơn hàng tham chiếu</label>
                                <input type="text" name="maDonHangThamChieu" value={formData.maDonHangThamChieu} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                        )}
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">Ghi chú / lý do</label>
                            <textarea name="lyDo" value={formData.lyDo} onChange={handleInputChange} className="min-h-[72px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <label className="block text-sm font-semibold text-pink-700">Dòng hàng chi tiết</label>
                                {formData.loai === "NHAP" && selectedSupplier && (
                                    <p className="mt-0.5 text-xs text-pink-600 font-medium">
                                        📌 Đang ưu tiên sản phẩm thuộc <strong>{selectedSupplier.TenNCC}</strong>
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {isIssue && (
                                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs">
                                        <span className="font-semibold text-gray-600">Kho xuất</span>
                                        <select value={selectedWarehouseId} onChange={(event) => setSelectedWarehouseId(event.target.value)} className="rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-pink-500">
                                            <option value="">Chọn kho</option>
                                            {warehouses.map((warehouse) => (
                                                <option key={warehouse.id} value={warehouse.id}>{warehouse.code} - {warehouse.name ?? "Không tên"}</option>
                                            ))}
                                        </select>
                                        <span className="font-semibold text-gray-600">Chiến lược xuất</span>
                                        <select value={allocationStrategy} onChange={(event) => setAllocationStrategy(event.target.value as AllocationStrategy)} className="rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-pink-500">
                                            <option value="FEFO">FEFO - hết hạn trước xuất trước</option>
                                            <option value="FIFO">FIFO - nhập trước xuất trước</option>
                                        </select>
                                    </div>
                                )}
                                <button type="button" onClick={handleAddItemRow} className="rounded-lg border border-pink-200 bg-pink-100 px-3 py-1.5 text-xs font-semibold text-pink-700 shadow-sm hover:bg-pink-200">+ Thêm dòng</button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 items-end gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                    <div className="col-span-12 md:col-span-4">
                                        <label className="mb-1 block text-xs font-medium text-gray-600">Sản phẩm / Biến thể</label>
                                        <select required value={item.productVariantId} onChange={(e) => handleItemChange(index, "productVariantId", e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500">
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
                                    <div className="col-span-6 md:col-span-2">
                                        <label className="mb-1 block text-xs font-medium text-gray-600">Batch ID</label>
                                        <input type="number" min="1" value={item.batchId} onChange={(e) => handleItemChange(index, "batchId", e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500" placeholder="Nếu có" />
                                    </div>
                                    <div className="col-span-6 md:col-span-2">
                                        <label className="mb-1 block text-xs font-medium text-gray-600">Vị trí kho</label>
                                        <select required value={item.locationId} onChange={(e) => handleItemChange(index, "locationId", e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500">
                                            <option value="">-- Chọn vị trí --</option>
                                            {filteredLocations.map((loc) => (
                                                <option key={loc.id} value={loc.id}>
                                                    {loc.label} (ID #{loc.id})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-6 md:col-span-2">
                                        <label className="mb-1 block text-xs font-medium text-gray-600">Số lượng</label>
                                        <input required type="number" min="0.001" step="0.001" value={item.quantity} onChange={(e) => handleItemChange(index, "quantity", e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500" />
                                    </div>
                                    {isAdjustment && (
                                        <div className="col-span-6 md:col-span-2">
                                            <label className="mb-1 block text-xs font-medium text-gray-600">Hướng</label>
                                            <select value={item.adjustmentDirection} onChange={(e) => handleItemChange(index, "adjustmentDirection", e.target.value as TransactionItem["adjustmentDirection"])} className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500">
                                                <option value="IN">Tăng</option>
                                                <option value="OUT">Giảm</option>
                                            </select>
                                        </div>
                                    )}
                                    <div className={isAdjustment ? "col-span-6 md:col-span-1" : isIssue ? "col-span-6 md:col-span-2" : "col-span-10 md:col-span-1"}>
                                        <label className="mb-1 block text-xs font-medium text-gray-600">Ghi chú</label>
                                        <input value={item.note} onChange={(e) => handleItemChange(index, "note", e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500" />
                                    </div>
                                    {isIssue && (
                                        <button type="button" onClick={() => handlePreviewAllocation(index)} disabled={previewingItemIndex === index} className="col-span-4 rounded-md border border-green-200 bg-green-50 px-2 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-1">
                                            {previewingItemIndex === index ? "Đang xem" : "Xem phân bổ"}
                                        </button>
                                    )}
                                    <button type="button" onClick={() => handleRemoveItemRow(index)} className="col-span-2 rounded p-1.5 text-xs text-red-500 hover:bg-red-50 hover:text-red-700 md:col-span-1">Xóa</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {isIssue && allocationPreview && (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h3 className="text-sm font-semibold text-green-800">Preview phân bổ tồn kho</h3>
                                    <p className="text-xs text-green-700">
                                        Chiến lược {allocationPreview.strategy}: yêu cầu {allocationPreview.requestedQuantity}, phân bổ được {allocationPreview.allocatedQuantity}.
                                    </p>
                                </div>
                                {isShortAllocated && <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">Không đủ tồn</span>}
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-green-100 bg-white">
                                <table className="min-w-full text-left text-xs">
                                    <thead className="bg-green-50 text-green-900">
                                        <tr>
                                            <th className="px-3 py-2 font-semibold">Vị trí</th>
                                            <th className="px-3 py-2 font-semibold">Batch ID</th>
                                            <th className="px-3 py-2 font-semibold">Lô</th>
                                            <th className="px-3 py-2 font-semibold">Hạn sử dụng</th>
                                            <th className="px-3 py-2 font-semibold">Ngày nhập</th>
                                            <th className="px-3 py-2 text-right font-semibold">Số lượng</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-gray-700">
                                        {allocationPreview.items.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-3 py-4 text-center text-gray-500">Backend không tìm thấy tồn khả dụng cho dòng hàng này.</td>
                                            </tr>
                                        ) : allocationPreview.items.map((allocation) => (
                                            <tr key={allocation.stockLocationId}>
                                                <td className="px-3 py-2 font-semibold text-gray-900">{allocation.locationCode}</td>
                                                <td className="px-3 py-2">{allocation.batchId ?? "Không có"}</td>
                                                <td className="px-3 py-2">{allocation.lotNumber ?? "Không có"}</td>
                                                <td className="px-3 py-2">{formatDate(allocation.expiryDate)}</td>
                                                <td className="px-3 py-2">{formatDate(allocation.receivedDate)}</td>
                                                <td className="px-3 py-2 text-right font-semibold">{allocation.quantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 border-t border-gray-100 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
                        <button type="submit" className="flex-1 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700">Lưu giao dịch</button>
                    </div>
                </form>
            </div>
        </div>
    );
}