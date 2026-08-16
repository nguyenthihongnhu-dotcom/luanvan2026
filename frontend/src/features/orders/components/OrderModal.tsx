import React, { useMemo, useState } from "react";
import type {
    CreateOrderInput,
    Order,
    UpdateOrderInput,
} from "@/features/orders/services/orderService";
import type { WarehouseOption } from "@/features/warehouses/services/warehouseService";
import type { ProductItem } from "@/features/products/hooks/useProducts";

interface OrderFormItem {
    productVariantId: string;
    quantity: string;
    unitPrice: string;
    note: string;
}
interface OrderFormData {
    customerName: string;
    customerPhone: string;
    customerEmail: string;

    shippingAddress: string;
    shippingWard: string;
    shippingDistrict: string;
    shippingProvince: string;

    warehouseId: string;

    discountAmount: string;
    shippingFee: string;

    note: string;

    items: OrderFormItem[];
}

interface OrderModalProps {
    editingOrder: Order | null;
    warehouses: WarehouseOption[];
    productVariants: ProductItem[];

    onClose: () => void;
    onSaved: () => Promise<void>;
}

function createInitialItem(): OrderFormItem {
    return {
        productVariantId: "",
        quantity: "1",
        unitPrice: "0",
        note: "",
    };
}

function createInitialForm(
    editingOrder: Order | null,
): OrderFormData {
    return {
        customerName: editingOrder?.customer_name ?? "",
        customerPhone: editingOrder?.customer_phone ?? "",
        customerEmail: editingOrder?.customer_email ?? "",

        shippingAddress:
            editingOrder?.shipping_address ?? "",
        shippingWard:
            editingOrder?.shipping_ward ?? "",
        shippingDistrict:
            editingOrder?.shipping_district ?? "",
        shippingProvince:
            editingOrder?.shipping_province ?? "",

        warehouseId: editingOrder
            ? String(editingOrder.warehouse_id)
            : "",

        discountAmount: String(
            editingOrder?.discount_amount ?? 0,
        ),

        shippingFee: String(
            editingOrder?.shipping_fee ?? 0,
        ),

        note: editingOrder?.note ?? "",

        items: [createInitialItem()],
    };
}

function formatMoney(value: number): string {
    return Number(value || 0).toLocaleString("vi-VN");
}

export default function OrderModal({
    editingOrder,
    warehouses,
    productVariants,
    onClose,
    onSaved,
}: OrderModalProps) {
    const [formData, setFormData] = useState<OrderFormData>(
        () => createInitialForm(editingOrder),
    );

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const subtotal = useMemo(() => {
        return formData.items.reduce((sum, item) => {
            const quantity = Number(item.quantity) || 0;
            const unitPrice =
                Number(item.unitPrice) || 0;

            return sum + quantity * unitPrice;
        }, 0);
    }, [formData.items]);

    const discountAmount =
        Number(formData.discountAmount) || 0;

    const shippingFee =
        Number(formData.shippingFee) || 0;

    const totalAmount = Math.max(
        0,
        subtotal - discountAmount + shippingFee,
    );

    function handleInputChange(
        event: React.ChangeEvent<
            HTMLInputElement |
            HTMLSelectElement |
            HTMLTextAreaElement
        >,
    ) {
        const { name, value } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function handleItemChange(
        index: number,
        field: keyof OrderFormItem,
        value: string,
    ) {
        setFormData((current) => ({
            ...current,
            items: current.items.map((item, itemIndex) =>
                itemIndex === index
                    ? {
                        ...item,
                        [field]: value,
                    }
                    : item,
            ),
        }));
    }

    function handleAddItemRow() {
        setFormData((current) => ({
            ...current,
            items: [
                ...current.items,
                createInitialItem(),
            ],
        }));
    }

    function handleRemoveItemRow(index: number) {
        setFormData((current) => {
            if (current.items.length <= 1) {
                return current;
            }

            return {
                ...current,
                items: current.items.filter(
                    (_, itemIndex) =>
                        itemIndex !== index,
                ),
            };
        });
    }

    async function handleSubmit(
        event: React.FormEvent,
    ) {
        event.preventDefault();

        setError(null);

        if (!formData.customerName.trim()) {
            setError(
                "Vui lòng nhập tên khách hàng.",
            );
            return;
        }

        const warehouseId = Number(
            formData.warehouseId,
        );

        if (
            !Number.isFinite(warehouseId) ||
            warehouseId <= 0
        ) {
            setError("Vui lòng chọn kho.");
            return;
        }

        const items = formData.items.map(
            (item, index) => {
                const productVariantId = Number(
                    item.productVariantId,
                );

                const quantity = Number(
                    item.quantity,
                );

                const unitPrice = Number(
                    item.unitPrice,
                );

                if (
                    !productVariantId ||
                    !Number.isFinite(
                        productVariantId,
                    )
                ) {
                    throw new Error(
                        `Dòng ${index + 1}: chưa chọn sản phẩm.`,
                    );
                }

                if (
                    !Number.isFinite(quantity) ||
                    quantity <= 0
                ) {
                    throw new Error(
                        `Dòng ${index + 1}: số lượng không hợp lệ.`,
                    );
                }

                if (
                    !Number.isFinite(unitPrice) ||
                    unitPrice < 0
                ) {
                    throw new Error(
                        `Dòng ${index + 1}: đơn giá không hợp lệ.`,
                    );
                }

                return {
                    productVariantId,
                    quantity,
                    unitPrice,
                    note:
                        item.note.trim() ||
                        undefined,
                };
            },
        );

        try {
            setIsSaving(true);

            if (editingOrder) {
                const input: UpdateOrderInput = {
                    customerName:
                        formData.customerName.trim(),
                    customerPhone:
                        formData.customerPhone.trim() ||
                        undefined,
                    customerEmail:
                        formData.customerEmail.trim() ||
                        undefined,

                    shippingAddress:
                        formData.shippingAddress.trim() ||
                        undefined,
                    shippingWard:
                        formData.shippingWard.trim() ||
                        undefined,
                    shippingDistrict:
                        formData.shippingDistrict.trim() ||
                        undefined,
                    shippingProvince:
                        formData.shippingProvince.trim() ||
                        undefined,

                    discountAmount,
                    shippingFee,

                    note:
                        formData.note.trim() ||
                        undefined,
                };

                await import(
                    "@/features/orders/services/orderService"
                ).then(({ orderService }) =>
                    orderService.updateOrder(
                        editingOrder.id,
                        input,
                    ),
                );
            } else {
                const input: CreateOrderInput = {
                    customerName:
                        formData.customerName.trim(),
                    customerPhone:
                        formData.customerPhone.trim() ||
                        undefined,
                    customerEmail:
                        formData.customerEmail.trim() ||
                        undefined,

                    shippingAddress:
                        formData.shippingAddress.trim() ||
                        undefined,
                    shippingWard:
                        formData.shippingWard.trim() ||
                        undefined,
                    shippingDistrict:
                        formData.shippingDistrict.trim() ||
                        undefined,
                    shippingProvince:
                        formData.shippingProvince.trim() ||
                        undefined,

                    warehouseId,

                    items,

                    discountAmount,
                    shippingFee,

                    note:
                        formData.note.trim() ||
                        undefined,
                };

                await import(
                    "@/features/orders/services/orderService"
                ).then(({ orderService }) =>
                    orderService.createOrder(input),
                );
            }

            await onSaved();
            onClose();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể lưu đơn hàng.",
            );
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="max-h-[94vh] w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-xl">
                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-gray-100 bg-pink-50 px-6 py-4">
                    <div>
                        <h2 className="text-lg font-bold text-pink-700">
                            {editingOrder
                                ? "Chỉnh sửa đơn hàng"
                                : "Tạo đơn hàng mới"}
                        </h2>

                        {editingOrder && (
                            <p className="mt-1 text-xs text-gray-500">
                                {editingOrder.order_code}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-2xl text-gray-400 hover:text-gray-600"
                    >
                        ×
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="max-h-[calc(94vh-72px)] space-y-5 overflow-y-auto p-6"
                >
                    {error && (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* THÔNG TIN KHÁCH HÀNG */}
                    <section>
                        <div className="mb-3 border-b border-gray-200 pb-2">
                            <h3 className="text-sm font-semibold text-pink-700">
                                Thông tin khách hàng
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Tên khách hàng
                                </label>

                                <input
                                    name="customerName"
                                    value={
                                        formData.customerName
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    required
                                    placeholder="Nhập tên khách hàng"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Số điện thoại
                                </label>

                                <input
                                    name="customerPhone"
                                    value={
                                        formData.customerPhone
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    placeholder="090..."
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Email
                                </label>

                                <input
                                    name="customerEmail"
                                    type="email"
                                    value={
                                        formData.customerEmail
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    placeholder="email@example.com"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                                />
                            </div>
                        </div>
                    </section>

                    {/* KHO + ĐỊA CHỈ */}
                    <section>
                        <div className="mb-3 border-b border-gray-200 pb-2">
                            <h3 className="text-sm font-semibold text-pink-700">
                                Thông tin giao hàng
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Kho xử lý
                                </label>

                                <select
                                    name="warehouseId"
                                    value={
                                        formData.warehouseId
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    required
                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                                >
                                    <option value="">
                                        -- Chọn kho --
                                    </option>

                                    {warehouses.map(
                                        (warehouse) => (
                                            <option
                                                key={
                                                    warehouse.id
                                                }
                                                value={
                                                    warehouse.id
                                                }
                                            >
                                                {
                                                    warehouse.code
                                                }{" "}
                                                -{" "}
                                                {warehouse.name ??
                                                    "Không tên"}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Địa chỉ
                                </label>

                                <input
                                    name="shippingAddress"
                                    value={
                                        formData.shippingAddress
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    placeholder="Số nhà, đường..."
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Phường / Xã
                                </label>

                                <input
                                    name="shippingWard"
                                    value={
                                        formData.shippingWard
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Quận / Huyện
                                </label>

                                <input
                                    name="shippingDistrict"
                                    value={
                                        formData.shippingDistrict
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Tỉnh / Thành phố
                                </label>

                                <input
                                    name="shippingProvince"
                                    value={
                                        formData.shippingProvince
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                    </section>

                    {/* SẢN PHẨM */}
                    <section className="border-t border-gray-200 pt-4">
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-pink-700">
                                    Sản phẩm trong đơn
                                </h3>

                                <p className="text-xs text-gray-500">
                                    Chọn SKU, nhập số lượng và đơn giá
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    handleAddItemRow
                                }
                                className="rounded-lg border border-pink-200 bg-pink-100 px-3 py-1.5 text-xs font-semibold text-pink-700 hover:bg-pink-200"
                            >
                                + Thêm dòng
                            </button>
                        </div>

                        <div className="space-y-3">
                            {formData.items.map(
                                (item, index) => {
                                    const quantity =
                                        Number(
                                            item.quantity,
                                        ) || 0;

                                    const unitPrice =
                                        Number(
                                            item.unitPrice,
                                        ) || 0;

                                    const itemTotal =
                                        quantity *
                                        unitPrice;

                                    return (
                                        <div
                                            key={index}
                                            className="grid grid-cols-12 items-end gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
                                        >
                                            <div className="col-span-12 md:col-span-5">
                                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                                    Sản phẩm / SKU
                                                </label>

                                                <select
                                                    value={
                                                        item.productVariantId
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        handleItemChange(
                                                            index,
                                                            "productVariantId",
                                                            event
                                                                .target
                                                                .value,
                                                        )
                                                    }
                                                    required
                                                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-xs outline-none focus:ring-1 focus:ring-pink-500"
                                                >
                                                    <option value="">
                                                        -- Chọn sản phẩm --
                                                    </option>

                                                    {productVariants.map(
                                                        (
                                                            product,
                                                        ) => (
                                                            <option
                                                                key={
                                                                    product.id
                                                                }
                                                                value={
                                                                    product.id
                                                                }
                                                            >
                                                                {
                                                                    product.sku
                                                                }{" "}
                                                                -{" "}
                                                                {
                                                                    product.name
                                                                }
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </div>

                                            <div className="col-span-4 md:col-span-2">
                                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                                    Số lượng
                                                </label>

                                                <input
                                                    type="number"
                                                    min="0.001"
                                                    step="0.001"
                                                    value={
                                                        item.quantity
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        handleItemChange(
                                                            index,
                                                            "quantity",
                                                            event
                                                                .target
                                                                .value,
                                                        )
                                                    }
                                                    required
                                                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-xs outline-none focus:ring-1 focus:ring-pink-500"
                                                />
                                            </div>

                                            <div className="col-span-4 md:col-span-2">
                                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                                    Đơn giá
                                                </label>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1000"
                                                    value={
                                                        item.unitPrice
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        handleItemChange(
                                                            index,
                                                            "unitPrice",
                                                            event
                                                                .target
                                                                .value,
                                                        )
                                                    }
                                                    required
                                                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-xs outline-none focus:ring-1 focus:ring-pink-500"
                                                />
                                            </div>

                                            <div className="col-span-4 md:col-span-2">
                                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                                    Thành tiền
                                                </label>

                                                <div className="rounded-md border border-gray-200 bg-white px-2 py-2 text-right text-xs font-semibold">
                                                    {formatMoney(
                                                        itemTotal,
                                                    )}{" "}
                                                    ₫
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={
                                                    formData
                                                        .items
                                                        .length <=
                                                    1
                                                }
                                                onClick={() =>
                                                    handleRemoveItemRow(
                                                        index,
                                                    )
                                                }
                                                className="col-span-12 rounded-md px-2 py-2 text-xs font-medium text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 md:col-span-1"
                                            >
                                                Xóa
                                            </button>

                                            <div className="col-span-12">
                                                <input
                                                    value={
                                                        item.note
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        handleItemChange(
                                                            index,
                                                            "note",
                                                            event
                                                                .target
                                                                .value,
                                                        )
                                                    }
                                                    placeholder="Ghi chú sản phẩm..."
                                                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-xs outline-none focus:ring-1 focus:ring-pink-500"
                                                />
                                            </div>
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    </section>

                    {/* TỔNG TIỀN */}
                    <section className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Ghi chú đơn hàng
                            </label>

                            <textarea
                                name="note"
                                value={
                                    formData.note
                                }
                                onChange={
                                    handleInputChange
                                }
                                rows={5}
                                placeholder="Nhập ghi chú..."
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                            />
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <h3 className="mb-3 text-sm font-semibold text-pink-700">
                                Tổng tiền
                            </h3>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Tạm tính
                                    </span>

                                    <strong>
                                        {formatMoney(
                                            subtotal,
                                        )}{" "}
                                        ₫
                                    </strong>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs text-gray-600">
                                        Giảm giá
                                    </label>

                                    <input
                                        name="discountAmount"
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={
                                            formData.discountAmount
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs text-gray-600">
                                        Phí vận chuyển
                                    </label>

                                    <input
                                        name="shippingFee"
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={
                                            formData.shippingFee
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs"
                                    />
                                </div>

                                <div className="border-t border-gray-200 pt-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-gray-700">
                                            Tổng cộng
                                        </span>

                                        <span className="text-lg font-bold text-pink-700">
                                            {formatMoney(
                                                totalAmount,
                                            )}{" "}
                                            ₫
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* BUTTON */}
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
                            disabled={isSaving}
                            className="flex-1 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving
                                ? "Đang lưu..."
                                : editingOrder
                                    ? "Lưu thay đổi"
                                    : "Tạo đơn hàng"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}