import React, { useEffect, useMemo, useState } from "react";
import { batchService, type ProductBatch } from "@/features/batches/services/batchService";
import type { Partner } from "@/features/partners/services/partnerService";
import type { ProductItem } from "@/features/products/hooks/useProducts";
import { getHttpErrorMessage } from "@/shared/services/httpClient";

interface BatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** message nói rõ vừa tạo lô mới hay cập nhật lô đã có. */
    onSuccess: (message: string) => void;
    /** Toàn bộ SKU trong danh mục, KHÔNG lọc theo tồn kho: lô mới thường thuộc SKU chưa có hàng. */
    products: ProductItem[];
    partners: Partner[];
    /** Có giá trị nghĩa là đang sửa lô này, không phải tạo mới. */
    editingBatch?: ProductBatch | null;
}

function suggestLotNumber(sku: string) {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    return `LOT-${sku}-${yearMonth}`;
}

export default function BatchModal({
    isOpen,
    onClose,
    onSuccess,
    products,
    partners,
    editingBatch = null,
}: BatchModalProps) {
    const isEditing = Boolean(editingBatch);
    const [productVariantId, setProductVariantId] = useState("");
    const [supplierId, setSupplierId] = useState("");
    const [lotNumber, setLotNumber] = useState("");
    const [manufactureDate, setManufactureDate] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [notes, setNotes] = useState("");
    const [isBlocked, setIsBlocked] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    /** Toàn bộ lô của SKU đang chọn, tải riêng từ server. */
    const [variantBatches, setVariantBatches] = useState<ProductBatch[]>([]);

    const selectedProduct = useMemo(
        () => products.find((product) => String(product.id) === productVariantId) ?? null,
        [products, productVariantId],
    );

    // Nạp sẵn dữ liệu khi mở form ở chế độ sửa.
    useEffect(() => {
        if (!isOpen) return;
        if (editingBatch) {
            setProductVariantId(String(editingBatch.product_variant_id));
            setSupplierId(editingBatch.supplier_id ? String(editingBatch.supplier_id) : "");
            setLotNumber(editingBatch.lot_number);
            setManufactureDate(editingBatch.manufacture_date?.slice(0, 10) ?? "");
            setExpiryDate(editingBatch.expiry_date?.slice(0, 10) ?? "");
            setNotes(editingBatch.notes ?? "");
            setIsBlocked(editingBatch.status === "BLOCKED");
        }
        setError(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, editingBatch?.id]);

    // Chọn SKU xong thì gợi ý sẵn số lô theo mã SKU và tháng hiện tại.
    useEffect(() => {
        if (!isEditing && selectedProduct && !lotNumber.trim()) {
            setLotNumber(suggestLotNumber(selectedProduct.sku));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProduct?.id]);

    // Kiểm tra trùng số lô phải dựa trên TẤT CẢ lô của SKU đó, hỏi thẳng server.
    // Nếu đối chiếu với danh sách đang hiển thị ngoài trang thì bộ lọc tìm kiếm hoặc
    // trạng thái có thể đang ẩn mất lô trùng, dẫn tới không cảnh báo được.
    useEffect(() => {
        if (!selectedProduct) {
            setVariantBatches([]);
            return;
        }
        let cancelled = false;
        const variantId = selectedProduct.id;
        void batchService
            .listBatches({ productVariantId: variantId })
            .then((list) => {
                if (!cancelled) setVariantBatches(list);
            })
            .catch(() => {
                if (!cancelled) setVariantBatches([]);
            });
        return () => {
            cancelled = true;
        };
    }, [selectedProduct?.id]);

    const duplicateLot = useMemo(() => {
        if (isEditing || !selectedProduct || !lotNumber.trim()) return false;
        return variantBatches.some(
            (batch) => batch.lot_number.trim().toLowerCase() === lotNumber.trim().toLowerCase(),
        );
    }, [variantBatches, selectedProduct, lotNumber, isEditing]);

    const expiryRequired = selectedProduct?.requiresExpiryTracking ?? false;
    const dateOrderInvalid =
        Boolean(manufactureDate) && Boolean(expiryDate) && new Date(expiryDate) <= new Date(manufactureDate);

    const blockingReason = !selectedProduct
        ? "Chưa chọn sản phẩm"
        : !lotNumber.trim()
          ? "Chưa nhập số lô"
          : duplicateLot
            ? "Số lô đã tồn tại cho sản phẩm này"
            : expiryRequired && !expiryDate
              ? "Sản phẩm này bắt buộc có hạn sử dụng"
              : dateOrderInvalid
                ? "Hạn sử dụng phải sau ngày sản xuất"
                : null;

    if (!isOpen) return null;

    const resetForm = () => {
        setProductVariantId("");
        setSupplierId("");
        setLotNumber("");
        setManufactureDate("");
        setExpiryDate("");
        setNotes("");
        setIsBlocked(false);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        if (blockingReason) {
            setError(blockingReason);
            return;
        }

        setIsSubmitting(true);
        try {
            const lot = lotNumber.trim();

            if (editingBatch) {
                await batchService.updateBatch(editingBatch.id, {
                    supplierId: supplierId ? Number(supplierId) : null,
                    manufactureDate: manufactureDate || null,
                    expiryDate: expiryDate || null,
                    notes: notes.trim() || null,
                    status: isBlocked ? "BLOCKED" : "ACTIVE",
                });
                resetForm();
                onSuccess(`Đã cập nhật lô ${lot}.`);
                onClose();
                return;
            }

            const result = await batchService.createBatch({
                productVariantId: Number(productVariantId),
                supplierId: supplierId ? Number(supplierId) : null,
                lotNumber: lot,
                manufactureDate: manufactureDate || null,
                expiryDate: expiryDate || null,
                notes: notes.trim() || null,
            });
            resetForm();
            onSuccess(
                result.created
                    ? `Đã tạo lô ${lot}. Lô chưa có hàng, tạo phiếu nhập kho hoặc nhận nhanh để đưa hàng vào.`
                    : `Số lô ${lot} đã tồn tại nên hệ thống cập nhật lại lô cũ thay vì tạo mới.`,
            );
            onClose();
        } catch (err) {
            console.error("Failed to create batch:", err);
            setError(getHttpErrorMessage(err, "Không tạo được lô hàng"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-pink-100 bg-pink-50 px-6 py-4">
                    <div>
                        <h2 className="text-lg font-bold text-pink-700">
                            {isEditing ? `Sửa lô ${editingBatch?.lot_number}` : "Khai báo lô hàng mới"}
                        </h2>
                        <p className="text-xs text-pink-600">
                            {isEditing
                                ? "Đổi hạn dùng, nhà cung cấp, ghi chú hoặc khóa lô"
                                : "Đăng ký số lô và hạn sử dụng cho một SKU"}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Đóng">×</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-6">
                    {/* Điểm gây hiểu nhầm lớn nhất: khai lô không làm tăng tồn kho. */}
                    {!isEditing && (
                        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs leading-relaxed text-blue-800">
                            <b>Khai lô không làm tăng tồn kho.</b> Bước này chỉ tạo hồ sơ lô (số lô, hạn dùng) để
                            phiếu nhập kho và chức năng nhận nhanh có lô mà chọn. Muốn có hàng thực tế, sau khi
                            khai lô hãy tạo <b>phiếu nhập kho</b> hoặc dùng <b>nhận nhanh bằng QR</b>.
                        </div>
                    )}
                    {isEditing && (
                        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                            Không đổi được <b>sản phẩm</b> và <b>số lô</b> của lô đã tạo, vì tồn kho và lịch sử
                            giao dịch đang trỏ vào lô này. Cần số lô khác thì tạo lô mới.
                        </div>
                    )}

                    {error && (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="batch-variant" className="mb-1 block text-sm font-medium text-gray-700">
                            Sản phẩm / SKU <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="batch-variant"
                            required
                            disabled={isEditing}
                            value={productVariantId}
                            onChange={(event) => setProductVariantId(event.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-100 disabled:text-gray-600"
                        >
                            <option value="">-- Chọn sản phẩm --</option>
                            {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.sku} - {product.name}
                                    {product.requiresLotTracking ? " [theo lô]" : ""}
                                </option>
                            ))}
                        </select>
                        {products.length === 0 && (
                            <p className="mt-1 text-xs text-amber-700">
                                Chưa có SKU nào trong danh mục. Vào màn hình Sản phẩm để tạo SKU trước.
                            </p>
                        )}
                        {selectedProduct && (
                            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                                <span className={`rounded px-1.5 py-0.5 font-semibold ${selectedProduct.requiresLotTracking ? "bg-pink-100 text-pink-700" : "bg-gray-100 text-gray-500"}`}>
                                    {selectedProduct.requiresLotTracking ? "Bắt buộc theo lô" : "Không bắt buộc theo lô"}
                                </span>
                                <span className={`rounded px-1.5 py-0.5 font-semibold ${selectedProduct.requiresExpiryTracking ? "bg-pink-100 text-pink-700" : "bg-gray-100 text-gray-500"}`}>
                                    {selectedProduct.requiresExpiryTracking ? "Bắt buộc có hạn dùng" : "Không bắt buộc hạn dùng"}
                                </span>
                                <span className="rounded bg-gray-100 px-1.5 py-0.5 font-semibold text-gray-500">
                                    Tồn hiện tại: {selectedProduct.stock}
                                </span>
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="batch-lot" className="mb-1 block text-sm font-medium text-gray-700">
                            Số lô <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="batch-lot"
                            type="text"
                            required
                            disabled={isEditing}
                            placeholder="VD: LOT-SUA-FRISO-3-202608"
                            value={lotNumber}
                            onChange={(event) => setLotNumber(event.target.value)}
                            className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 disabled:bg-gray-100 disabled:text-gray-600 ${duplicateLot ? "border-red-400 focus:ring-red-500" : "border-gray-300 focus:ring-pink-500"}`}
                        />
                        {duplicateLot ? (
                            <p className="mt-1 text-xs font-semibold text-red-600">
                                Số lô này đã có cho sản phẩm đã chọn. Nhập hàng thêm vào lô cũ, hoặc đặt số lô khác.
                            </p>
                        ) : (
                            <p className="mt-1 text-xs text-gray-500">
                                Số lô chỉ cần duy nhất trong phạm vi một SKU, hai SKU khác nhau được trùng số lô.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="batch-mfg" className="mb-1 block text-sm font-medium text-gray-700">Ngày sản xuất</label>
                            <input
                                id="batch-mfg"
                                type="date"
                                value={manufactureDate}
                                onChange={(event) => setManufactureDate(event.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="batch-exp" className="mb-1 block text-sm font-medium text-gray-700">
                                Hạn sử dụng {expiryRequired && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                id="batch-exp"
                                type="date"
                                required={expiryRequired}
                                value={expiryDate}
                                onChange={(event) => setExpiryDate(event.target.value)}
                                className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 ${dateOrderInvalid ? "border-red-400 focus:ring-red-500" : "border-gray-300 focus:ring-pink-500"}`}
                            />
                        </div>
                    </div>
                    {dateOrderInvalid && (
                        <p className="text-xs font-semibold text-red-600">Hạn sử dụng phải sau ngày sản xuất.</p>
                    )}
                    {expiryRequired && !expiryDate && (
                        <p className="text-xs text-amber-700">
                            SKU này xuất theo FEFO nên bắt buộc có hạn dùng, thiếu thì lúc xác nhận phiếu xuất
                            sẽ báo lỗi EXPIRY_DATE_REQUIRED.
                        </p>
                    )}

                    <div>
                        <label htmlFor="batch-supplier" className="mb-1 block text-sm font-medium text-gray-700">Nhà cung cấp (tùy chọn)</label>
                        <select
                            id="batch-supplier"
                            value={supplierId}
                            onChange={(event) => setSupplierId(event.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                        >
                            <option value="">-- Không chọn --</option>
                            {partners.map((partner) => (
                                <option key={partner.MaNCC} value={partner.MaNCC}>
                                    {partner.TenNCC}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="batch-notes" className="mb-1 block text-sm font-medium text-gray-700">Ghi chú</label>
                        <textarea
                            id="batch-notes"
                            rows={2}
                            placeholder="Ghi chú thêm về lô hàng (nếu có)"
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                        />
                    </div>

                    {isEditing && (
                        <label className="flex items-start gap-2 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={isBlocked}
                                onChange={(event) => setIsBlocked(event.target.checked)}
                                className="mt-0.5"
                            />
                            <span>
                                <b>Khóa lô</b>
                                <span className="mt-0.5 block text-xs text-gray-500">
                                    Đánh dấu lô có vấn đề để người dùng thấy ngay trên danh sách. Trạng thái
                                    cận hạn và hết hạn do hạn dùng tự quyết định, không đặt tay được.
                                </span>
                            </span>
                        </label>
                    )}

                    <div className="flex gap-3 border-t border-gray-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || Boolean(blockingReason)}
                            title={blockingReason ?? undefined}
                            className="flex-1 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-60"
                        >
                            {isSubmitting ? "Đang lưu..." : isEditing ? "Lưu thay đổi" : "Khai báo lô"}
                        </button>
                    </div>
                    {blockingReason && !error && (
                        <p className="text-center text-xs text-gray-500">{blockingReason}</p>
                    )}
                </form>
            </div>
        </div>
    );
}
